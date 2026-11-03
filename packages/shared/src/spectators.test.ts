import { describe, expect, test } from "bun:test";
import samples from "../../content/samples.json";
import type { Phase } from "./api";
import { renderRule, solveWires, wirePages, type Bomb } from "./bomb";
import { manualFor, playView, scrambleManual, type SymbolsManual, type WiresManual, type WordManual } from "./manual";
import { newBombState } from "./play";
import { remainingMs, scoreBets } from "./scoring";

const all = Object.values(samples as Record<string, Bomb[]>).flat();
const PHASES: Phase[] = ["round1", "round2", "final"];

describe("scrambleManual (Radio Interference)", () => {
  test("the same seed gives every phone the same shuffle, and it really shuffles", () => {
    for (const phase of PHASES)
      for (const m of [1, 2, 3] as const) {
        const manual = manualFor(phase, m);
        expect(scrambleManual(manual, 7)).toEqual(scrambleManual(manual, 7));
        expect(scrambleManual(manual, 7).scrambled).toBe(true);
      }
    const seeds = Array.from({ length: 20 }, (_, i) => i + 1);
    const cols = (seed: number) => (scrambleManual(manualFor("round2", 2), seed) as SymbolsManual).columns.map((c) => c.id).join("");
    expect(new Set(seeds.map(cols)).size).toBeGreaterThan(1);
  });

  test("answers read from a shuffled manual match the answers of every sample bomb", () => {
    for (const b of all)
      for (let seed = 1; seed <= 5; seed++) {
        // Wires: the page for this wire count still lists the rules in the order the solver uses.
        const wires = scrambleManual(manualFor(b.phase, 1), seed) as WiresManual;
        const page = wires.pages.find((p) => p.wireCount === b.wires.colors.length)!;
        const rules = wirePages(b.phase)[String(b.wires.colors.length)]!;
        expect(page.rules.map((r) => r.text)).toEqual(rules.map(renderRule));
        expect(solveWires(rules, b.wires.colors).wire).toBe(b.wires.answer);

        // Symbols: the one column holding all four, read in the manual's direction.
        const sym = scrambleManual(manualFor(b.phase, 2), seed) as SymbolsManual;
        const col = sym.columns.filter((c) => b.symbols.shown.every((x) => c.symbols.includes(x)));
        expect(col.length).toBe(1);
        const inOrder = col[0]!.symbols.filter((x) => b.symbols.shown.includes(x));
        expect(sym.order === "bottomToTop" ? inOrder.reverse() : inOrder).toEqual(b.symbols.answer);

        // Words: the row for the word on screen still points to the same button.
        const word = scrambleManual(manualFor(b.phase, 3), seed) as WordManual;
        const rows = word.groups.flatMap((g) => g.rows).filter((r) => r.display === b.word.display && word.groups.find((g) => g.rows.includes(r))!.id === b.word.group);
        expect(rows.map((r) => r.press)).toEqual([b.word.answer]);
      }
  });

  test("Experts get the shuffled manual only while Radio Interference is on", () => {
    const turn = { teamId: 1, phase: "round2" as const, module: 2 as const, defuserIds: [11, 12, 13], status: "playing" as const };
    expect(playView({ id: 11, teamId: 1 }, turn)).toEqual({ role: "expert", module: 2, manual: manualFor("round2", 2) });
    expect(playView({ id: 11, teamId: 1 }, { ...turn, scrambleSeed: 9 })).toEqual({ role: "expert", module: 2, manual: scrambleManual(manualFor("round2", 2), 9) });
  });
});

describe("scoreBets", () => {
  const boom = { ...newBombState(), status: "boom" as const, strikes: 3 };
  const defused = { ...newBombState(), status: "defused" as const, strikes: 1 };

  test("+20 for the outcome, +10 for the strikes; 2 means 2 or more", () => {
    expect(scoreBets([{ teamId: 2, willDefuse: false, strikesGuess: 2 }], boom)).toEqual([
      { teamId: 2, lines: [{ kind: "bet_defuse", points: 20, note: "Bet: outcome right" }, { kind: "bet_strikes", points: 10, note: "Bet: strikes right" }] },
    ]);
    expect(scoreBets([{ teamId: 2, willDefuse: false, strikesGuess: 1 }], defused)[0]!.lines).toEqual([
      { kind: "bet_strikes", points: 10, note: "Bet: strikes right" },
    ]);
  });

  test("an unanswered question scores nothing and costs nothing", () => {
    expect(scoreBets([{ teamId: 2, willDefuse: null, strikesGuess: null }], defused)[0]!.lines).toEqual([]);
  });
});

test("Speed Up's cut comes off the remaining time", () => {
  const clock = { startedAt: 0, durationSec: 180, pausedMs: 0, pausedAt: null, endedAt: null, cutMs: 30_000 };
  expect(remainingMs(clock, 10_000)).toBe(140_000);
  expect(remainingMs(clock, 170_000)).toBe(0);
});
