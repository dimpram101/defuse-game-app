import type { GmNext, Phase } from "@defuse/shared";

export const NEXT_PHASE: Record<Phase, Phase | null> = { round1: "round2", round2: "final", final: null };

export type FlowState = {
  game: { status: string; phase: Phase } | null;
  teams: { id: number; turnOrder: number; playerCount: number }[];
  /** Turns of the active session. Voided turns don't count as played. */
  turns: { teamId: number; phase: Phase; status: string }[];
};

/** Teams still to play in a round, in turn order. Teams without players are skipped. */
export function queueFor(s: FlowState, phase: Phase): number[] {
  const played = new Set(s.turns.filter((t) => t.phase === phase && t.status !== "voided").map((t) => t.teamId));
  return [...s.teams]
    .sort((a, b) => a.turnOrder - b.turnOrder)
    .filter((t) => !played.has(t.id) && t.playerCount > 0)
    .map((t) => t.id);
}

/** What the GM's main button does right now. */
export function nextStep(s: FlowState): GmNext {
  const { game } = s;
  if (!game) return { kind: "none", reason: "Create a session first." };
  switch (game.status) {
    case "lobby":
    case "result": {
      const [teamId] = queueFor(s, game.phase);
      if (teamId !== undefined) return { kind: "open_turn", teamId };
      if (game.status === "lobby") return { kind: "none", reason: "No one has joined yet." };
      return { kind: "leaderboard" };
    }
    case "betting":
      return { kind: "start_turn" };
    case "playing":
    case "paused":
      return { kind: "none", reason: "A turn is in progress." };
    case "leaderboard": {
      const phase = NEXT_PHASE[game.phase];
      return phase ? { kind: "next_round", phase } : { kind: "finish" };
    }
    default:
      return { kind: "none", reason: "This session has finished." };
  }
}
