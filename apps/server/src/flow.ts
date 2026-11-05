import type { GmNext, Phase } from "@defuse/shared";

export type FlowState = {
  game: { status: string; phase: Phase; round: number; finalTeamIds: number[] | null } | null;
  teams: { id: number; turnOrder: number; playerCount: number; score: number }[];
  /** Turns of the active session. Voided turns don't count as played. */
  turns: { teamId: number; round: number; status: string }[];
};

/**
 * Final order, fixed when the Final starts: lowest score first, ties by turn order. `top2` keeps only the two
 * highest scores (ties again by turn order), the fallback when the event runs late. Teams without players are left out.
 */
export function finalOrder(s: FlowState, top2: boolean): number[] {
  const teams = s.teams.filter((t) => t.playerCount > 0);
  const kept = top2
    ? new Set([...teams].sort((a, b) => b.score - a.score || a.turnOrder - b.turnOrder).slice(0, 2).map((t) => t.id))
    : null;
  return teams
    .filter((t) => !kept || kept.has(t.id))
    .sort((a, b) => a.score - b.score || a.turnOrder - b.turnOrder)
    .map((t) => t.id);
}

/** Teams still to play in a round, in turn order (Final: the stored Final order). Teams without players are skipped. */
export function queueFor(s: FlowState, round: number): number[] {
  const played = new Set(s.turns.filter((t) => t.round === round && t.status !== "voided").map((t) => t.teamId));
  const withPlayers = new Set(s.teams.filter((t) => t.playerCount > 0).map((t) => t.id));
  const final = s.game?.phase === "final" && s.game.round === round ? s.game.finalTeamIds : null;
  const order = final ?? [...s.teams].sort((a, b) => a.turnOrder - b.turnOrder).map((t) => t.id);
  return order.filter((id) => !played.has(id) && withPlayers.has(id));
}

/**
 * What the GM's main button does right now. After Round 1 comes Round 2. From Round 2 on the GM
 * picks: the Final (main button, all teams or the top 2) or one more round at round2 difficulty (`extraRound`).
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
      if (game.phase === "round1") return { kind: "next_round", round, phase: "round2", extraRound: null, finalOrder: null };
      if (game.phase === "round2")
        return { kind: "next_round", round, phase: "final", extraRound: round, finalOrder: { all: finalOrder(s, false), top2: finalOrder(s, true) } };
      return { kind: "finish" };
    }
    default:
      return { kind: "none", reason: "This session has finished." };
  }
}
