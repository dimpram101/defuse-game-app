import { describe, expect, test } from "bun:test";
import type { Phase } from "./api";
import { renderRule, symbolColumns, wirePages, wordGroups } from "./bomb";
import { manualFor, pickDefusers, playView, type SymbolsManual, type TurnForPlay, type WiresManual, type WordManual } from "./manual";

const PHASES: Phase[] = ["round1", "round2", "final"];

describe.each(PHASES)("manualFor %s", (phase) => {
  test("wires: every page and rule from the bank, in order, text from renderRule", () => {
    const m = manualFor(phase, 1) as WiresManual;
    const pages = wirePages(phase);
    expect(m.pages.map((p) => p.wireCount)).toEqual(Object.keys(pages).map(Number).sort((a, b) => a - b));
    for (const page of m.pages)
      expect(page.rules.map((r) => r.text)).toEqual(pages[String(page.wireCount)]!.map(renderRule));
  });

  test("symbols: every column with its symbols in bank order", () => {
    const m = manualFor(phase, 2) as SymbolsManual;
    const { order, columns } = symbolColumns(phase);
    expect(m.order).toBe(order);
    expect(Object.fromEntries(m.columns.map((c) => [c.id, c.symbols]))).toEqual(columns);
  });

  test("words: every group, one row per word, pointing where the bank table points", () => {
    const m = manualFor(phase, 3) as WordManual;
    const groups = wordGroups(phase);
    expect(m.groups.map((g) => g.id)).toEqual(groups.map((g) => g.id));
    m.groups.forEach((g, i) => {
      expect(g.rows.map((r) => r.display)).toEqual(groups[i]!.words);
      for (const r of g.rows) expect(r.press).toBe(groups[i]!.table[r.display]!);
    });
  });
});

test("only the Final marks what changed", () => {
  const newRules = (phase: Phase) => (manualFor(phase, 1) as WiresManual).pages.flatMap((p) => p.rules).filter((r) => r.isNew).length;
  expect([newRules("round1"), newRules("round2"), newRules("final")]).toEqual([0, 0, 4]);
  expect((manualFor("round2", 2) as SymbolsManual).orderIsNew).toBe(false);
  expect(manualFor("final", 2)).toMatchObject({ order: "bottomToTop", orderIsNew: true });
  expect((manualFor("round2", 3) as WordManual).tableIsNew).toBe(false);
  expect((manualFor("final", 3) as WordManual).tableIsNew).toBe(true);
});

describe("pickDefusers", () => {
  const team = (n: number) => Array.from({ length: n }, (_, i) => 101 + i); // member k has id 100 + k

  test("5 players follow the concept rotation", () => {
    expect(pickDefusers(team(5), 1)).toEqual([101, 102, 103]);
    expect(pickDefusers(team(5), 2)).toEqual([104, 105, 101]);
  });

  test("each later round (extra or Final) continues the rotation", () => {
    expect(pickDefusers(team(5), 3)).toEqual([102, 103, 104]);
    expect(pickDefusers(team(5), 4)).toEqual([105, 101, 102]);
  });

  test("4 players: Round 2 is members 4, 1, 2", () => {
    expect(pickDefusers(team(4), 2)).toEqual([104, 101, 102]);
  });

  test("small teams repeat, an empty team has no Defuser", () => {
    expect(pickDefusers(team(3), 2)).toEqual([101, 102, 103]);
    expect(pickDefusers(team(2), 1)).toEqual([101, 102, 101]);
    expect(pickDefusers(team(1), 3)).toEqual([101, 101, 101]);
    expect(pickDefusers([], 1)).toEqual([]);
  });
});

describe("playView", () => {
  const turn: TurnForPlay = { teamId: 1, phase: "round1", module: 2, defuserIds: [11, 12, 13], status: "playing" };

  test("the Defuser of the active module gets no manual", () => {
    expect(playView({ id: 12, teamId: 1 }, turn)).toEqual({ role: "defuser", module: 2 });
  });

  test("every other member of the playing team gets the same manual, including last module's Defuser", () => {
    const a = playView({ id: 11, teamId: 1 }, turn);
    const b = playView({ id: 14, teamId: 1 }, turn);
    expect(a).toEqual({ role: "expert", module: 2, manual: manualFor("round1", 2) });
    expect(b).toEqual(a);
  });

  test("spectators never get the manual", () => {
    const v = playView({ id: 21, teamId: 2 }, turn);
    expect(v).toEqual({ role: "spectator", playingTeamId: 1 });
    expect(JSON.stringify(v)).not.toContain("manual");
  });

  test("the manual shows while the team is up (betting, playing, paused) and disappears afterwards", () => {
    for (const status of ["betting", "paused"] as const)
      expect(playView({ id: 11, teamId: 1 }, { ...turn, status }).role).toBe("expert");
    for (const status of ["defused", "boom", "voided"] as const)
      expect(playView({ id: 11, teamId: 1 }, { ...turn, status })).toEqual({ role: "waiting" });
    expect(playView({ id: 11, teamId: 1 }, null)).toEqual({ role: "waiting" });
  });
});
