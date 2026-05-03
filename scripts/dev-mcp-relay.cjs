#!/usr/bin/env node
/**
 * Throwaway MCP-relay scratch tool.
 *
 * Spawns the localhost WebSocket the AIChatPanel will connect to, then
 * exposes a minimal REPL so we can poke `tools/list` / `tools/call` frames
 * by hand and watch the responses come back. Replaces the real MCP relay
 * (separate npm package, see #1582) for transport-validation work only.
 *
 *   node scripts/dev-mcp-relay.cjs            # listens on 127.0.0.1:51735
 *   node scripts/dev-mcp-relay.cjs --port 51800
 *
 * REPL commands once a browser pairs:
 *   list                          send tools/list
 *   call <toolName> [json]        send tools/call
 *   raw <json>                    send arbitrary frame
 *   quit                          exit
 */

const readline = require('node:readline');
const { WebSocketServer } = require('ws');

const args = process.argv.slice(2);
let port = 51735;
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--port' || args[i] === '-p') && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    i++;
  }
}

const ALLOWED_ORIGINS = new Set([
  'https://3dstreet.app',
  'https://dev-3dstreet.web.app',
  'http://localhost:3333',
  'http://127.0.0.1:3333'
]);

const wss = new WebSocketServer({
  host: '127.0.0.1',
  port,
  // Origin gate matches the design doc's localhost allowlist. The WS spec
  // doesn't enforce same-origin on its own, so we have to.
  verifyClient: (info, done) => {
    const origin = info.origin || info.req.headers.origin;
    if (!origin || ALLOWED_ORIGINS.has(origin)) {
      done(true);
    } else {
      console.warn(`[mcp-relay] rejecting origin ${origin}`);
      done(false, 403, 'origin not allowed');
    }
  }
});

let peer = null;
let nextId = 1;
const pending = new Map();

console.log(`[mcp-relay] listening on ws://127.0.0.1:${port}`);
console.log('[mcp-relay] open 3DStreet, then drive it with: list / call / raw / quit');

wss.on('connection', (ws, req) => {
  if (peer) {
    console.warn('[mcp-relay] second peer rejected (paired-elsewhere)');
    ws.close(4001, 'paired-elsewhere');
    return;
  }
  peer = ws;
  console.log(
    `[mcp-relay] paired with ${req.headers.origin || 'unknown origin'}`
  );
  console.log('[mcp-relay] try:');
  console.log('  list                                        ← see all tools');
  console.log('  call getSessionInfo                         ← who is signed in');
  console.log('  call getScene                               ← full scene JSON');
  console.log(
    '  call entityUpdate {"entityId":"environment","component":"street-environment","property":"preset","value":"night"}'
  );

  ws.on('message', (data) => {
    let frame;
    try {
      frame = JSON.parse(data.toString());
    } catch (err) {
      console.warn('[mcp-relay] dropping unparseable frame:', err.message);
      return;
    }
    if (frame.id != null && pending.has(frame.id)) {
      const label = pending.get(frame.id);
      pending.delete(frame.id);
      const tag = frame.error
        ? `✗ ${label} (id=${frame.id}) error`
        : `✓ ${label} (id=${frame.id})`;
      console.log(`\n[mcp-relay] ${tag}`);
      console.log(JSON.stringify(frame, null, 2));
    } else {
      console.log('\n[mcp-relay] inbound frame:');
      console.log(JSON.stringify(frame, null, 2));
    }
    rl.prompt();
  });

  ws.on('close', (code, reason) => {
    if (peer === ws) peer = null;
    console.log(
      `[mcp-relay] peer closed code=${code} reason=${reason?.toString() || ''}`
    );
    rl.prompt();
  });
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'mcp> '
});

const send = (frame, label) => {
  if (!peer || peer.readyState !== peer.OPEN) {
    console.warn('[mcp-relay] no peer connected');
    return;
  }
  if (frame.id == null) frame.id = nextId++;
  pending.set(frame.id, label || frame.method || 'frame');
  peer.send(JSON.stringify(frame));
  console.log(`→ sent id=${frame.id}: ${label}`);
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
    const argsStr = firstSpace === -1 ? '{}' : rest.slice(firstSpace + 1).trim();
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
  console.log('[mcp-relay] unknown command. Try: list | call <name> [json] | raw <json> | quit');
  rl.prompt();
});

rl.on('close', () => {
  if (peer) peer.close(1000, 'relay-shutdown');
  wss.close();
});

setTimeout(() => rl.prompt(), 100);
