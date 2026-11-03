import type { ClientMessage, ServerMessage, Snapshot } from "@defuse/shared";
import { useCallback, useEffect, useRef, useState } from "react";

const DELAYS = [1000, 2000, 4000, 8000];

/**
 * One WebSocket to the live game. Sends `hello` on every (re)connect and keeps the latest snapshot.
 * The server sends a full snapshot after every change, so a dropped connection loses nothing.
 */
export function useLive<S extends Snapshot>(hello: Extract<ClientMessage, { type: "hello" }>) {
  // Each snapshot remembers which hello it answers, so a new identity never reads the old one's snapshot.
  const [latest, setLatest] = useState<{ key: string; snapshot: S } | null>(null);
  const [receivedAt, setReceivedAt] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const socket = useRef<WebSocket | null>(null);
  const helloKey = JSON.stringify(hello);

  useEffect(() => {
    let attempt = 0;
    let retry: ReturnType<typeof setTimeout>;
    let closed = false;

    const open = () => {
      const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
      socket.current = ws;
      ws.onopen = () => {
        attempt = 0;
        setConnected(true);
        ws.send(helloKey);
      };
      ws.onmessage = (e) => {
        // A socket being replaced can still deliver one last message for the old identity.
        if (closed) return;
        const msg = JSON.parse(e.data) as ServerMessage;
        if (msg.type === "snapshot") {
          setLatest({ key: helloKey, snapshot: msg.snapshot as S });
          setReceivedAt(performance.now());
        } else setError(msg.message);
      };
      ws.onclose = () => {
        setConnected(false);
        if (closed) return;
        retry = setTimeout(open, DELAYS[Math.min(attempt++, DELAYS.length - 1)]);
      };
    };
    open();
    return () => {
      closed = true;
      clearTimeout(retry);
      socket.current?.close();
    };
  }, [helloKey]);

  const send = useCallback((msg: ClientMessage) => {
    setError("");
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(msg));
    else setError("Not connected. Retrying…");
  }, []);

  const snapshot = latest?.key === helloKey ? latest.snapshot : null;
  return { snapshot, receivedAt, connected, error, clearError: () => setError(""), send };
}

/** Counts down locally from the server's remaining time; never from the device clock alone. */
export function useCountdown(timer: { running: boolean; remainingMs: number } | null | undefined, receivedAt: number) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!timer?.running) return;
    const id = setInterval(() => setNow(performance.now()), 200);
    return () => clearInterval(id);
  }, [timer?.running, receivedAt]);
  if (!timer) return 0;
  return timer.running ? Math.max(0, timer.remainingMs - Math.max(0, now - receivedAt)) : timer.remainingMs;
}

export const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
