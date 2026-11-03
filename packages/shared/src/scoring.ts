import type { BombState } from "./play";
import { solvedModules } from "./play";
import { BET_POINTS } from "./api";

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

export type TurnClock = {
  startedAt: number | null; durationSec: number; pausedMs: number; pausedAt: number | null; endedAt: number | null;
  /** Time taken off by Speed Up. */
  cutMs: number;
};

/** How long the bomb has been running, not counting pauses. Twists are timed on this clock. */
export function elapsedMs(t: TurnClock, now: number): number {
  if (t.startedAt === null) return 0;
  return (t.endedAt ?? t.pausedAt ?? now) - t.startedAt - t.pausedMs;
}

/** Time left on the bomb, computed from stored timestamps so every device and a restarted server agree. */
export function remainingMs(t: TurnClock, now: number): number {
  return Math.max(0, t.durationSec * 1000 - elapsedMs(t, now) - t.cutMs);
}

export type BetRow = { teamId: number; willDefuse: boolean | null; strikesGuess: number | null };

/** Points for each spectator team's Bet. An unanswered question scores nothing and costs nothing. */
export function scoreBets(bets: BetRow[], state: BombState): { teamId: number; lines: ScoreLine[] }[] {
  const strikes = Math.min(state.strikes, 2);
  return bets.map((b) => {
    const lines: ScoreLine[] = [];
    if (b.willDefuse !== null && b.willDefuse === (state.status === "defused"))
      lines.push({ kind: "bet_defuse", points: BET_POINTS.defuse, note: "Bet: outcome right" });
    if (b.strikesGuess === strikes)
      lines.push({ kind: "bet_strikes", points: BET_POINTS.strikes, note: "Bet: strikes right" });
    return { teamId: b.teamId, lines };
  });
}
