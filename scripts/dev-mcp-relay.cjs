#!/usr/bin/env node
/**
 * Throwaway MCP-relay scratch tool.
 *
 * Two modes:
 *
 *   node scripts/dev-mcp-relay.cjs               REPL mode — type frames
 *                                                 by hand at an `mcp>` prompt.
 *                                                 Good for transport debugging.
 *
 *   node scripts/dev-mcp-relay.cjs --stdio       MCP-server mode — speak
 *                                                 line-delimited JSON-RPC over
 *                                                 stdin/stdout so Claude Code
 *                                                 or Claude Desktop can use it
 *                                                 as an MCP server. Forwards
 *                                                 tool calls to the WebSocket
 *                                                 peer (the open 3DStreet tab).
 *
 * In both modes a WebSocket server listens on 127.0.0.1:51735 (override
 * with --port). The browser pane connects there; the relay multiplexes
 * frames between the LLM-facing transport (REPL or stdio) and the WS peer.
 *
 * This is a scratch tool to validate the protocol end-to-end. The real
 * MCP relay lives in a separate npm package (see #1582).
 */

const readline = require('node:readline');
const { WebSocketServer } = require('ws');

const args = process.argv.slice(2);
let port = 51735;
let stdioMode = false;
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--port' || args[i] === '-p') && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--stdio') {
    stdioMode = true;
  }
}

// Stdio mode hijacks stdout for JSON-RPC frames — anything else on stdout
// would corrupt the stream. Route logs to stderr instead.
const log = stdioMode
  ? (...a) => console.error('[mcp-relay]', ...a)
  : (...a) => console.log('[mcp-relay]', ...a);

const ALLOWED_ORIGINS = new Set([
  'https://3dstreet.app',
  'https://dev-3dstreet.web.app',
  'http://localhost:3333',
  'http://127.0.0.1:3333'
]);

const wss = new WebSocketServer({
  host: '127.0.0.1',
  port,
  verifyClient: (info, done) => {
    const origin = info.origin || info.req.headers.origin;
    if (!origin || ALLOWED_ORIGINS.has(origin)) {
      done(true);
    } else {
      log(`rejecting origin ${origin}`);
      done(false, 403, 'origin not allowed');
    }
  }
});

let peer = null;
let nextId = 1;
// id sent on the WS → callback to invoke with the reply frame
const wsPending = new Map();
// queue of MCP frames waiting for a peer to attach
const queued = [];
// last tools list fetched from the peer (so initialize → tools/list works
// even before the browser pairs the first time)
let cachedTools = [];

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: '3dstreet-dev-relay', version: '0.1.0' };

log(`listening on ws://127.0.0.1:${port}${stdioMode ? ' (stdio MCP)' : ''}`);
if (!stdioMode) {
  log('open 3DStreet, then drive it with: list / call / raw / quit');
}

wss.on('connection', (ws, req) => {
  if (peer) {
    log('second peer rejected (paired-elsewhere)');
    ws.close(4001, 'paired-elsewhere');
    return;
  }
  peer = ws;
  log(`paired with ${req.headers.origin || 'unknown origin'}`);
  if (!stdioMode) {
    console.log('[mcp-relay] try:');
    console.log('  list                                        ← see all tools');
    console.log('  call getSessionInfo                         ← who is signed in');
    console.log('  call getScene                               ← full scene JSON');
    console.log(
      '  call entityUpdate {"entityId":"environment","component":"street-environment","property":"preset","value":"night"}'
    );
  }

  // Refresh the tool cache and ping any clients that already initialized.
  refreshToolsFromPeer().then(() => {
    if (stdioMode) {
      writeMCP({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
    }
  });

  // Drain any frames Claude sent before pairing (e.g. tools/list issued
  // right after initialize). Without this they'd hang forever.
  while (queued.length) {
    const f = queued.shift();
    forwardToPeer(f);
  }

  ws.on('message', (data) => {
    let frame;
    try {
      frame = JSON.parse(data.toString());
    } catch (err) {
      log('dropping unparseable WS frame:', err.message);
      return;
    }
    handlePeerFrame(frame);
  });

  ws.on('close', (code, reason) => {
    if (peer === ws) peer = null;
    log(
      `peer closed code=${code} reason=${reason?.toString() || ''}`
    );
    // Fail any pending WS calls so the LLM gets an error instead of hanging.
    for (const [, cb] of wsPending) {
      cb({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32000, message: 'peer disconnected' }
      });
    }
    wsPending.clear();
    if (!stdioMode) rl.prompt();
  });
});

function handlePeerFrame(frame) {
  // Reply to a frame we sent → resolve the pending callback.
  if (frame.id != null && wsPending.has(frame.id)) {
    const cb = wsPending.get(frame.id);
    wsPending.delete(frame.id);
    cb(frame);
    return;
  }
  // Anything else from the peer (notifications, unsolicited replies) just
  // gets logged in REPL mode and discarded in stdio mode.
  if (!stdioMode) {
    console.log('\n[mcp-relay] inbound frame:');
    console.log(JSON.stringify(frame, null, 2));
    rl.prompt();
  }
}

function forwardToPeer(frame, callback) {
  if (!peer || peer.readyState !== peer.OPEN) {
    if (callback) {
      callback({
        jsonrpc: '2.0',
        id: frame.id ?? null,
        error: { code: -32000, message: 'no browser peer connected' }
      });
    }
    return;
  }
  const wsId = nextId++;
  const wsFrame = { ...frame, id: wsId };
  if (callback) wsPending.set(wsId, callback);
  peer.send(JSON.stringify(wsFrame));
}

async function refreshToolsFromPeer() {
  return new Promise((resolve) => {
    forwardToPeer(
      { jsonrpc: '2.0', method: 'tools/list' },
      (reply) => {
        if (reply.result?.tools) {
          cachedTools = reply.result.tools;
          log(`cached ${cachedTools.length} tools from peer`);
        }
        resolve();
      }
    );
  });
}

/* ------------------------------------------------------------------ */
/* stdio MCP transport                                                 */
/* ------------------------------------------------------------------ */

function writeMCP(frame) {
  if (!stdioMode) return;
  process.stdout.write(JSON.stringify(frame) + '\n');
}

async function handleMCPFrame(frame) {
  const { id, method, params } = frame;
  const isNotification = id === undefined || id === null;
  const reply = (result) => ({ jsonrpc: '2.0', id, result });
  const fail = (code, message) => ({
    jsonrpc: '2.0',
    id,
    error: { code, message }
  });

  switch (method) {
    case 'initialize':
      if (isNotification) return null;
      return reply({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: true } },
        serverInfo: SERVER_INFO
      });

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null;

    case 'ping':
      if (isNotification) return null;
      return reply({});

    case 'tools/list': {
      if (isNotification) return null;
      // Prefer a fresh fetch; fall back to cache when no peer.
      if (peer && peer.readyState === peer.OPEN) {
        await refreshToolsFromPeer();
      }
      return reply({ tools: cachedTools });
    }

    case 'tools/call': {
      if (isNotification) return null;
      if (!params || typeof params.name !== 'string') {
        return fail(-32602, 'tools/call requires params.name');
      }
      if (!peer || peer.readyState !== peer.OPEN) {
        return fail(
          -32000,
          'No 3DStreet tab paired. Open 3DStreet, type /mcp in the AI Assistant pane, then click Reconnect.'
        );
      }
      return await new Promise((resolve) => {
        forwardToPeer(
          {
            jsonrpc: '2.0',
            method: 'tools/call',
            params: { name: params.name, arguments: params.arguments || {} }
          },
          (peerReply) => {
            if (peerReply.error) {
              resolve(fail(peerReply.error.code || -32000, peerReply.error.message));
            } else {
              resolve(reply(peerReply.result));
            }
          }
        );
      });
    }

    default:
      if (isNotification) return null;
      return fail(-32601, `Method not found: ${method}`);
  }
}

if (stdioMode) {
  let buffer = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    let nl;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      let frame;
      try {
        frame = JSON.parse(line);
      } catch (err) {
        log('dropping unparseable stdin frame:', err.message);
        continue;
      }
      // No peer yet for tools/call → defer briefly so initialize→tools/list
      // can land while the user opens the tab.
      if (!peer && frame.method === 'tools/call') {
        queued.push(frame);
        // Reply with deferred error after a grace period.
        setTimeout(() => {
          const idx = queued.indexOf(frame);
          if (idx !== -1) {
            queued.splice(idx, 1);
            writeMCP({
              jsonrpc: '2.0',
              id: frame.id,
              error: {
                code: -32000,
                message:
                  'Timed out waiting for the 3DStreet tab. Open it, type /mcp, click Reconnect, then try again.'
              }
            });
          }
        }, 30_000);
        continue;
      }
      const reply = await handleMCPFrame(frame);
      if (reply) writeMCP(reply);
    }
  });
  process.stdin.on('end', () => {
    log('stdin closed; shutting down');
    if (peer) peer.close(1000, 'relay-shutdown');
    wss.close();
    process.exit(0);
  });
}

/* ------------------------------------------------------------------ */
/* REPL transport (default mode)                                       */
/* ------------------------------------------------------------------ */

let rl = null;
if (!stdioMode) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'mcp> '
  });

  const send = (frame, label) => {
    if (!peer || peer.readyState !== peer.OPEN) {
      console.warn('[mcp-relay] no peer connected');
      return;
    }
    forwardToPeer(frame, (reply) => {
      const tag = reply.error ? `✗ ${label} error` : `✓ ${label}`;
      console.log(`\n[mcp-relay] ${tag}`);
      console.log(JSON.stringify(reply, null, 2));
      rl.prompt();
    });
    console.log(`→ sent: ${label}`);
  };

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return rl.prompt();
    if (trimmed === 'quit' || trimmed === 'exit') {
      rl.close();
      process.exit(0);
    }
    if (trimmed === 'list') {
      send({ jsonrpc: '2.0', method: 'tools/list' }, 'tools/list');
      return rl.prompt();
    }
    if (trimmed.startsWith('call ')) {
      const rest = trimmed.slice(5).trim();
      const firstSpace = rest.indexOf(' ');
      const name = firstSpace === -1 ? rest : rest.slice(0, firstSpace);
      const argsStr =
        firstSpace === -1 ? '{}' : rest.slice(firstSpace + 1).trim();
      let argsObj;
      try {
        argsObj = argsStr ? JSON.parse(argsStr) : {};
      } catch (err) {
        console.warn('[mcp-relay] invalid JSON arguments:', err.message);
        return rl.prompt();
      }
      send(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name, arguments: argsObj }
        },
        `tools/call ${name}`
      );
      return rl.prompt();
    }
    if (trimmed.startsWith('raw ')) {
      const json = trimmed.slice(4).trim();
      let frame;
      try {
        frame = JSON.parse(json);
      } catch (err) {
        console.warn('[mcp-relay] invalid raw JSON:', err.message);
        return rl.prompt();
      }
      if (!frame.jsonrpc) frame.jsonrpc = '2.0';
      send(frame, frame.method || 'raw');
      return rl.prompt();
    }
    console.log(
      '[mcp-relay] unknown command. Try: list | call <name> [json] | raw <json> | quit'
    );
    rl.prompt();
  });

  rl.on('close', () => {
    if (peer) peer.close(1000, 'relay-shutdown');
    wss.close();
  });

  setTimeout(() => rl.prompt(), 100);
}
