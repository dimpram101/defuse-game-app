// bun run report (in packages/shared) → prints pool sizes and rule texts, rewrites packages/content/samples.json (printable backup bombs)
import { generateBomb, renderRule, validSymbolSets, wireCombosByRule, wirePages, wordGroups, type Phase } from "../src/index";

const PHASES: Phase[] = ["round1", "round2", "final"];
const report: any = {};
for (const p of PHASES) {
  const wires: any = {};
  for (const [n, rules] of Object.entries(wirePages(p))) {
    const g = wireCombosByRule(rules, Number(n));
    wires[n] = rules.map((r, i) => ({ text: renderRule(r), changed: !!r.changed, combos: g[i]!.length }));
  }
  const sets = validSymbolSets(p);
  report[p] = {
    wires,
    symbolSetsPerColumn: Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v.length])),
    symbolSetsTotal: Object.values(sets).reduce((a, v) => a + v.length, 0),
    wordVariants: wordGroups(p).reduce((a, g) => a + g.words.length, 0),
  };
}
console.log(JSON.stringify(report, null, 2));

// Fixed backup bombs: practice uses seeds 1..3 (round1), then 12 per phase.
const plan: [string, Phase, number, number][] = [
  ["practice", "round1", 1, 3], ["round1", "round1", 101, 12], ["round2", "round2", 201, 12], ["final", "final", 301, 8],
];
const samples: any = {};
for (const [label, phase, start, count] of plan)
  samples[label] = Array.from({ length: count }, (_, i) => generateBomb(start + i, phase));
await Bun.write(new URL("../../content/samples.json", import.meta.url), JSON.stringify(samples, null, 2));
console.error("samples.json written");
