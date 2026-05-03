/**
 * React hook owning the MCP WebSocket lifecycle.
 *
 * Auto-connects to ws://127.0.0.1:51735 (or `?mcp=PORT`) and feeds every
 * incoming JSON-RPC frame into `handleFrame`, writing the reply back over
 * the same socket.
 *
 * Reconnect strategy: exponential backoff capped at 30s. Stops when the
 * server hands back a `paired-elsewhere` close — another tab owns the
 * peer and we shouldn't keep stomping it.
 *
 * Status surfaces (`status`, `lastError`, `transcript`) update via React
 * state so the panel can render them; the hook owns no DOM.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { handleFrame } from './dispatch.js';

const DEFAULT_PORT = 51735;
const MAX_TRANSCRIPT = 200;
const MAX_BACKOFF_MS = 30_000;
const PAIRED_ELSEWHERE_CODE = 4001;

const resolvePort = () => {
  if (typeof window === 'undefined') return DEFAULT_PORT;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = parseInt(params.get('mcp'), 10);
  if (Number.isFinite(fromQuery) && fromQuery > 0 && fromQuery < 65536) {
    return fromQuery;
  }
  return DEFAULT_PORT;
};

export function useMCPClient({
  currentUser,
  enabled,
  readOnly,
  persistRetries
}) {
  const [status, setStatus] = useState('disconnected');
  const [lastError, setLastError] = useState(null);
  const [transcript, setTranscript] = useState([]);

  const wsRef = useRef(null);
  const backoffRef = useRef(1000);
  const reconnectTimerRef = useRef(null);
  const userRef = useRef(currentUser);
  const readOnlyRef = useRef(!!readOnly);
  const enabledRef = useRef(!!enabled);
  const persistRef = useRef(!!persistRetries);
  // Sticky for the session: once we've successfully paired, drops are worth
  // retrying through even after `persistRetries` flips back off.
  const everConnectedRef = useRef(false);
  // Indirection so `scheduleReconnect` can reach `connect` without forcing
  // either callback to re-create on every dependency churn.
  const connectRef = useRef(null);

  // Keep refs in sync without re-subscribing the WebSocket on every render.
  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);
  useEffect(() => {
    readOnlyRef.current = !!readOnly;
  }, [readOnly]);
  useEffect(() => {
    enabledRef.current = !!enabled;
  }, [enabled]);
  useEffect(() => {
    persistRef.current = !!persistRetries;
  }, [persistRetries]);

  const appendTranscript = useCallback((entry) => {
    setTranscript((prev) => {
      const next = prev.concat(entry);
      if (next.length <= MAX_TRANSCRIPT) return next;
      return next.slice(next.length - MAX_TRANSCRIPT);
    });
  }, []);

  const updateTranscript = useCallback((id, patch) => {
    setTranscript((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }, []);

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const scheduleReconnect = useCallback(() => {
    if (!enabledRef.current) return;
    // Probe mode: one shot, then idle. Avoids spamming console with
    // connection errors for users who never installed the relay.
    if (!persistRef.current && !everConnectedRef.current) return;
    clearReconnectTimer();
    const delay = backoffRef.current;
    backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRef.current?.();
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (!enabledRef.current) return;
    if (wsRef.current) {
      const state = wsRef.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
    }
    const port = resolvePort();
    const url = `ws://127.0.0.1:${port}`;
    setStatus('connecting');
    setLastError(null);
    let ws;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      setLastError(err.message || String(err));
      scheduleReconnect();
      return;
    }
    wsRef.current = ws;

    ws.addEventListener('open', () => {
      backoffRef.current = 1000;
      everConnectedRef.current = true;
      setStatus('connected');
      setLastError(null);
    });

    ws.addEventListener('close', (ev) => {
      wsRef.current = null;
      if (ev.code === PAIRED_ELSEWHERE_CODE) {
        setStatus('paired-elsewhere');
        setLastError(ev.reason || 'Another tab owns the MCP connection');
        return;
      }
      setStatus('disconnected');
      scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      // The WebSocket spec deliberately hides the error reason. The matching
      // close event will fire next; surface details from there.
    });

    ws.addEventListener('message', async (ev) => {
      let frame;
      try {
        frame = JSON.parse(ev.data);
      } catch (err) {
        console.warn('[mcp] dropping unparseable frame:', err);
        return;
      }
      const isCall = frame.method === 'tools/call';
      const transcriptId =
        isCall || frame.method === 'tools/list'
          ? `frame_${Date.now()}_${Math.random().toString(16).slice(2)}`
          : null;

      if (transcriptId) {
        appendTranscript({
          id: transcriptId,
          method: frame.method,
          name: frame.params?.name,
          args: frame.params?.arguments,
          status: 'pending',
          result: null,
          timestamp: new Date()
        });
      }

      const reply = await handleFrame(frame, {
        currentUser: userRef.current,
        readOnly: readOnlyRef.current
      });

      if (transcriptId) {
        const errored = reply && reply.error;
        updateTranscript(transcriptId, {
          status: errored ? 'error' : 'success',
          result: errored ? reply.error : reply?.result
        });
      }

      if (reply && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(reply));
      }
    });
  }, [appendTranscript, scheduleReconnect, updateTranscript]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Bring the connection up when enabled flips on; tear it down when off.
  useEffect(() => {
    if (!enabled) {
      clearReconnectTimer();
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'panel-closing');
        } catch (err) {
          console.warn('[mcp] error closing socket:', err);
        }
        wsRef.current = null;
      }
      backoffRef.current = 1000;
      setStatus('disconnected');
      return;
    }
    backoffRef.current = 1000;
    connect();
    return () => {
      clearReconnectTimer();
      const sock = wsRef.current;
      wsRef.current = null;
      if (sock) {
        try {
          sock.close(1000, 'panel-unmount');
        } catch (err) {
          console.warn('[mcp] error closing socket on unmount:', err);
        }
      }
    };
  }, [enabled, connect]);

  const reconnect = useCallback(() => {
    clearReconnectTimer();
    backoffRef.current = 1000;
    // Manual reconnect = explicit user intent; treat the same as a prior
    // successful pairing so subsequent drops trigger backoff retries.
    everConnectedRef.current = true;
    if (wsRef.current) {
      try {
        wsRef.current.close(1000, 'manual-reconnect');
      } catch {
        // best-effort
      }
      wsRef.current = null;
    }
    setStatus('disconnected');
    connect();
  }, [connect]);

  const port = resolvePort();

  return {
    status,
    lastError,
    transcript,
    port,
    reconnect
  };
}
