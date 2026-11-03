import { describe, expect, test } from "bun:test";
import {
  generateBomb, renderRule, solveWires, validSymbolSets, wireCombosByRule,
  wirePages, wordGroups,
} from "./bomb";
import type { Phase } from "./api";

const PHASES: Phase[] = ["round1", "round2", "final"];

describe.each(PHASES)("%s", (phase) => {
  test("every wire page: each combination has a valid wire to cut, and every rule can fire", () => {
    for (const [n, rules] of Object.entries(wirePages(phase))) {
      const groups = wireCombosByRule(rules, Number(n));
      groups.forEach((g, i) => {
        expect(g.length, `${phase} ${n}-wire rule ${i + 1} never fires`).toBeGreaterThan(0);
        for (const w of g) expect(solveWires(rules, w).wire, `${phase} ${n}: ${w}`).not.toBeNull();
      });
      expect(rules.at(-1)!.if).toBeNull();
      rules.forEach((r) => expect(renderRule(r).length).toBeGreaterThan(10));
    }
  });

  test("every symbol column has enough unique 4-symbol sets", () => {
    for (const [col, sets] of Object.entries(validSymbolSets(phase)))
      expect(sets.length, `${phase} column ${col}`).toBeGreaterThanOrEqual(3);
  });

  test("every word table is a one-to-one mapping and never points to itself", () => {
    for (const g of wordGroups(phase)) {
      expect(g.words.length).toBe(6);
      expect(new Set(Object.values(g.table)).size).toBe(6);
      for (const w of g.words) {
        expect(g.words).toContain(g.table[w]!);
        expect(g.table[w]).not.toBe(w);
      }
    }
  });

  test("generateBomb is deterministic and self-consistent", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const a = generateBomb(seed, phase);
      expect(generateBomb(seed, phase)).toEqual(a);
      expect(a.symbols.answer.length).toBe(4);
      expect(a.word.buttons).toContain(a.word.answer);
      expect(a.wires.answer).toBeGreaterThanOrEqual(1);
      expect(a.wires.answer).toBeLessThanOrEqual(a.wires.colors.length);
    }
  });
});

test("final word tables differ from round 2 for every word", () => {
  const r2 = wordGroups("round2"), f = wordGroups("final");
  r2.forEach((g, i) => g.words.forEach((w) => expect(f[i]!.table[w]).not.toBe(g.table[w])));
});
