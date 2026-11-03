import type { GmNext, Phase } from "@defuse/shared";

export type FlowState = {
  game: { status: string; phase: Phase; round: number } | null;
  teams: { id: number; turnOrder: number; playerCount: number }[];
  /** Turns of the active session. Voided turns don't count as played. */
  turns: { teamId: number; round: number; status: string }[];
};

/** Teams still to play in a round, in turn order. Teams without players are skipped. */
export function queueFor(s: FlowState, round: number): number[] {
  const played = new Set(s.turns.filter((t) => t.round === round && t.status !== "voided").map((t) => t.teamId));
  return [...s.teams]
    .sort((a, b) => a.turnOrder - b.turnOrder)
    .filter((t) => !played.has(t.id) && t.playerCount > 0)
    .map((t) => t.id);
}

/**
 * What the GM's main button does right now. After Round 1 comes Round 2. From Round 2 on the GM
 * picks: the Final (main button) or one more round at round2 difficulty (`extraRound`).
 */
export function nextStep(s: FlowState): GmNext {
  const { game } = s;
  if (!game) return { kind: "none", reason: "Create a session first." };
  switch (game.status) {
    case "lobby":
    case "result": {
      const [teamId] = queueFor(s, game.round);
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
      const round = game.round + 1;
      if (game.phase === "round1") return { kind: "next_round", round, phase: "round2", extraRound: null };
      if (game.phase === "round2") return { kind: "next_round", round, phase: "final", extraRound: round };
      return { kind: "finish" };
    }
    default:
      return { kind: "none", reason: "This session has finished." };
  }
}
