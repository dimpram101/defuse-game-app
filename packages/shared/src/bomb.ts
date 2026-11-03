import { symbolsData, wiresData, wordsData } from "@defuse/content";
import type { Phase } from "./api";

export type Color = "red" | "blue" | "yellow" | "white" | "black";

type Cond =
  | { count: Color; op: "eq" | "gt" | "gte"; n: number }
  | { last: Color }
  | { first: Color }
  | { all: Cond[] };
type Cut = { pos: number } | { lastOf: Color } | { firstOf: Color };
export type WireRule = { if: Cond | null; cut: Cut; changed?: boolean };

export const COLORS = wiresData.colors as Color[];

// ---------- seeded RNG (mulberry32) ----------
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number) => Math.floor(next() * n);
  const pick = <T>(xs: readonly T[]): T => xs[int(xs.length)]!;
  const shuffle = <T>(xs: readonly T[]) => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  };
  return { next, int, pick, shuffle };
}

// ---------- wires ----------
export function wirePages(phase: Phase): Record<string, WireRule[]> {
  return (wiresData.phases as any)[phase].pages;
}

const ORD = ["first", "second", "third", "fourth", "fifth", "sixth"];
const num = (n: number) => ["no", "one", "two", "three", "four", "five", "six"][n];

function condText(c: Cond): string {
  if ("all" in c) return c.all.map(condText).join(" and ");
  if ("last" in c) return `the last wire is ${c.last}`;
  if ("first" in c) return `the first wire is ${c.first}`;
  if (c.op === "eq" && c.n === 0) return `there is no ${c.count} wire`;
  if (c.op === "eq") return `there is exactly ${num(c.n)} ${c.count} wire${c.n > 1 ? "s" : ""}`;
  if (c.op === "gt") return `there is more than ${num(c.n)} ${c.count} wire`;
  return `there are at least ${num(c.n)} ${c.count} wires`;
}
function cutText(c: Cut): string {
  if ("lastOf" in c) return `cut the last ${c.lastOf} wire`;
  if ("firstOf" in c) return `cut the first ${c.firstOf} wire`;
  return c.pos === -1 ? "cut the last wire" : `cut the ${ORD[c.pos - 1]} wire`;
}
/** English manual line, generated from the rule so text and logic never disagree. */
export function renderRule(r: WireRule): string {
  return r.if ? `If ${condText(r.if)}, ${cutText(r.cut)}.` : `Otherwise, ${cutText(r.cut)}.`;
}

function test(c: Cond, w: Color[]): boolean {
  if ("all" in c) return c.all.every((x) => test(x, w));
  if ("last" in c) return w[w.length - 1] === c.last;
  if ("first" in c) return w[0] === c.first;
  const k = w.filter((x) => x === c.count).length;
  return c.op === "eq" ? k === c.n : c.op === "gt" ? k > c.n : k >= c.n;
}
/** Returns the matching rule index and the 1-based wire to cut (null if the rule's target doesn't exist). */
export function solveWires(rules: WireRule[], w: Color[]) {
  const ruleIndex = rules.findIndex((r) => r.if === null || test(r.if, w));
  const cut = rules[ruleIndex]!.cut;
  let wire: number | null;
  if ("pos" in cut) wire = cut.pos === -1 ? w.length : cut.pos;
  else if ("lastOf" in cut) wire = w.lastIndexOf(cut.lastOf) + 1 || null;
  else wire = w.indexOf(cut.firstOf) + 1 || null;
  return { ruleIndex, wire };
}

/** Every colour combination for n wires, grouped by the rule that fires. */
export function wireCombosByRule(rules: WireRule[], n: number) {
  const groups: Color[][][] = rules.map(() => []);
  const total = COLORS.length ** n;
  for (let i = 0; i < total; i++) {
    const w: Color[] = [];
    let x = i;
    for (let k = 0; k < n; k++) { w.push(COLORS[x % COLORS.length]!); x = Math.floor(x / COLORS.length); }
    groups[solveWires(rules, w).ruleIndex]!.push(w);
  }
  return groups;
}

// ---------- symbols ----------
export function symbolColumns(phase: Phase): { order: "topToBottom" | "bottomToTop"; columns: Record<string, string[]> } {
  const p = (symbolsData.phases as any)[phase];
  const base = p.sameColumnsAs ? (symbolsData.phases as any)[p.sameColumnsAs] : p;
  return { order: p.order, columns: base.columns };
}
function subsets<T>(xs: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (xs.length < k) return [];
  const [h, ...t] = xs as [T, ...T[]];
  return [...subsets(t, k - 1).map((s) => [h, ...s]), ...subsets(t, k)];
}
/** 4-symbol sets that fit exactly one column, per column. */
export function validSymbolSets(phase: Phase) {
  const { columns } = symbolColumns(phase);
  const out: Record<string, string[][]> = {};
  for (const [id, col] of Object.entries(columns)) {
    out[id] = subsets(col, symbolsData.showCount).filter(
      (s) => Object.entries(columns).filter(([, c]) => s.every((x) => c.includes(x))).length === 1,
    );
  }
  return out;
}

// ---------- words ----------
export function wordGroups(phase: Phase): { id: string; words: string[]; table: Record<string, string> }[] {
  return (wordsData.phases as any)[phase].groups;
}

// ---------- bomb ----------
export type Bomb = {
  seed: number;
  phase: Phase;
  wires: { colors: Color[]; answer: number; rule: number };
  symbols: { shown: string[]; column: string; answer: string[] };
  word: { group: string; display: string; buttons: string[]; answer: string };
};

/** Deterministic: the same seed and phase always give the same bomb. Wire rules are chosen evenly so every rule gets played. */
export function generateBomb(seed: number, phase: Phase): Bomb {
  const r = rng(seed);
  const counts = (wiresData.phases as any)[phase].wireCounts as number[];
  const n = r.pick(counts);
  const rules = wirePages(phase)[String(n)]!;
  const byRule = wireCombosByRule(rules, n);
  const rule = r.int(rules.length);
  const colors = r.pick(byRule[rule]!);
  const wire = solveWires(rules, colors).wire!;

  const sets = validSymbolSets(phase);
  const { order, columns } = symbolColumns(phase);
  const column = r.pick(Object.keys(columns).filter((c) => sets[c]!.length > 0));
  const chosen = r.pick(sets[column]!);
  const inOrder = columns[column]!.filter((s) => chosen.includes(s));
  const symAnswer = order === "bottomToTop" ? [...inOrder].reverse() : inOrder;

  const g = r.pick(wordGroups(phase));
  const display = r.pick(g.words);

  return {
    seed, phase,
    wires: { colors, answer: wire, rule: rule + 1 },
    symbols: { shown: r.shuffle(chosen), column, answer: symAnswer },
    word: { group: g.id, display, buttons: r.shuffle(g.words), answer: g.table[display]! },
  };
}
