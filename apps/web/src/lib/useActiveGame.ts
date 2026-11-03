import type { PublicGame } from "@defuse/shared";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";

export type ActiveGame =
  | { state: "loading" }
  | { state: "none" }
  | { state: "offline" }
  | { state: "ready"; game: PublicGame };

/**
 * Polls the active session. Phase 4 replaces this with the WebSocket snapshot;
 * until then the lobby refreshes every few seconds.
 */
export function useActiveGame(intervalMs = 3000) {
  const [result, setResult] = useState<ActiveGame>({ state: "loading" });

  const refresh = useCallback(async () => {
    try {
      setResult({ state: "ready", game: await api<PublicGame>("/api/game") });
    } catch (e) {
      setResult(e instanceof ApiError && e.status === 404 ? { state: "none" } : { state: "offline" });
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return [result, refresh] as const;
}
