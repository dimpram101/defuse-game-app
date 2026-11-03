import type { BombState } from "./play";
import { solvedModules } from "./play";

export type ScoreLine = { kind: string; points: number; note: string };

/** Score for the team that played, from the concept's score table. */
export function scoreTurn(state: BombState, remainingMs: number): ScoreLine[] {
  const lines: ScoreLine[] = [];
  if (state.status === "defused") {
    lines.push({ kind: "defused", points: 100, note: "Bomb defused" });
    const seconds = Math.floor(Math.max(0, remainingMs) / 1000);
    if (seconds > 0) lines.push({ kind: "time_bonus", points: seconds, note: `${seconds} s left` });
  } else {
    const modules = solvedModules(state);
    if (modules > 0) lines.push({ kind: "module", points: 30 * modules, note: `${modules} module${modules > 1 ? "s" : ""} done` });
  }
  if (state.strikes > 0)
    lines.push({ kind: "strike", points: -20 * state.strikes, note: `${state.strikes} strike${state.strikes > 1 ? "s" : ""}` });
  return lines;
}

export type TurnClock = { startedAt: number | null; durationSec: number; pausedMs: number; pausedAt: number | null; endedAt: number | null };

/** Time left on the bomb, computed from stored timestamps so every device and a restarted server agree. */
export function remainingMs(t: TurnClock, now: number): number {
  if (t.startedAt === null) return t.durationSec * 1000;
  const until = t.endedAt ?? t.pausedAt ?? now;
  return Math.max(0, t.durationSec * 1000 - (until - t.startedAt - t.pausedMs));
}
