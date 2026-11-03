import { describe, expect, test } from "bun:test";
import type { Phase } from "@defuse/shared";
import { nextStep, queueFor, type FlowState } from "./flow";

const teams = [
  { id: 1, turnOrder: 1, playerCount: 3 },
  { id: 2, turnOrder: 2, playerCount: 0 },
  { id: 3, turnOrder: 3, playerCount: 1 },
];
const state = (status: string, phase: Phase = "round1", round = 1, turns: FlowState["turns"] = []): FlowState =>
  ({ game: { status, phase, round }, teams, turns });

describe("queueFor", () => {
  test("turn order, skipping empty teams and teams that already played this round", () => {
    expect(queueFor(state("lobby"), 1)).toEqual([1, 3]);
    expect(queueFor(state("result", "round1", 1, [{ teamId: 1, round: 1, status: "boom" }]), 1)).toEqual([3]);
    expect(queueFor(state("result", "round2", 2, [{ teamId: 1, round: 1, status: "boom" }]), 2)).toEqual([1, 3]);
  });

  test("an extra round at round2 difficulty has its own queue", () => {
    const r2: FlowState["turns"] = [{ teamId: 1, round: 2, status: "defused" }, { teamId: 3, round: 2, status: "boom" }];
    expect(queueFor(state("result", "round2", 3, r2), 3)).toEqual([1, 3]);
  });

  test("a voided turn means the team plays again", () => {
    expect(queueFor(state("result", "round1", 1, [{ teamId: 1, round: 1, status: "voided" }]), 1)).toEqual([1, 3]);
  });
});

describe("nextStep", () => {
  test("lobby opens the first team with players; an empty lobby can't start", () => {
    expect(nextStep(state("lobby"))).toEqual({ kind: "open_turn", teamId: 1 });
    expect(nextStep({ ...state("lobby"), teams: teams.map((t) => ({ ...t, playerCount: 0 })) }).kind).toBe("none");
  });

  test("betting starts the turn; a running turn has no next step", () => {
    expect(nextStep(state("betting"))).toEqual({ kind: "start_turn" });
    expect(nextStep(state("playing")).kind).toBe("none");
    expect(nextStep(state("paused")).kind).toBe("none");
  });

  test("after the last team of a round comes the leaderboard, then the next round, then the end", () => {
    const allPlayed: FlowState["turns"] = [
      { teamId: 1, round: 1, status: "defused" },
      { teamId: 3, round: 1, status: "boom" },
    ];
    expect(nextStep(state("result", "round1", 1, allPlayed))).toEqual({ kind: "leaderboard" });
    expect(nextStep(state("leaderboard", "round1", 1))).toEqual({ kind: "next_round", round: 2, phase: "round2", extraRound: null });
    expect(nextStep(state("leaderboard", "final", 3))).toEqual({ kind: "finish" });
    expect(nextStep(state("finished")).kind).toBe("none");
    expect(nextStep({ game: null, teams: [], turns: [] }).kind).toBe("none");
  });

  test("from Round 2 on, the GM can add a round instead of going to the Final", () => {
    expect(nextStep(state("leaderboard", "round2", 2))).toEqual({ kind: "next_round", round: 3, phase: "final", extraRound: 3 });
    expect(nextStep(state("leaderboard", "round2", 4))).toEqual({ kind: "next_round", round: 5, phase: "final", extraRound: 5 });
  });
});
