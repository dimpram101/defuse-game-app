import { renderRule, rng, symbolColumns, wirePages, wordGroups } from "./bomb";
import type { Phase } from "./api";
import type { ModuleNo } from "./play";

export type WiresManual = {
  module: "wires";
  pages: { wireCount: number; rules: { text: string; isNew: boolean }[] }[];
};
export type SymbolsManual = {
  module: "symbols";
  order: "topToBottom" | "bottomToTop";
  /** Final reads the Round 2 columns from the bottom. */
  orderIsNew: boolean;
  columns: { id: string; symbols: string[] }[];
};
export type WordManual = {
  module: "word";
  /** Final keeps the Round 2 words but every pair changes. */
  tableIsNew: boolean;
  groups: { id: string; rows: { display: string; press: string }[] }[];
};
/** `scrambled`: Radio Interference is on. The UI hides page numbers, column letters and group numbers. */
export type Manual = (WiresManual | SymbolsManual | WordManual) & { scrambled?: boolean };

/**
 * Radio Interference: shuffles only what doesn't change an answer. Wires keep the rule order inside a page
 * (the first match decides), symbol columns keep their order (it's the press order), word rows keep their pairs.
 * Seeded, so every Expert phone shows the same shuffle and they can still point each other to "the third column".
 */
export function scrambleManual(manual: Manual, seed: number): Manual {
  const r = rng(seed);
  switch (manual.module) {
    case "wires":
      return { ...manual, scrambled: true, pages: r.shuffle(manual.pages) };
    case "symbols":
      return { ...manual, scrambled: true, columns: r.shuffle(manual.columns) };
    case "word":
      return { ...manual, scrambled: true, groups: r.shuffle(manual.groups).map((g) => ({ ...g, rows: r.shuffle(g.rows) })) };
  }
}

/** Everything an Expert sees for one module. All Experts of the playing team get the same manual. */
export function manualFor(phase: Phase, module: ModuleNo): Manual {
  if (module === 1)
    return {
      module: "wires",
      pages: Object.entries(wirePages(phase))
        .map(([n, rules]) => ({
          wireCount: Number(n),
          rules: rules.map((r) => ({ text: renderRule(r), isNew: !!r.changed })),
        }))
        .sort((a, b) => a.wireCount - b.wireCount),
    };
  if (module === 2) {
    const { order, columns } = symbolColumns(phase);
    return {
      module: "symbols",
      order,
      orderIsNew: phase === "final" && order !== symbolColumns("round2").order,
      columns: Object.entries(columns).map(([id, symbols]) => ({ id, symbols })),
    };
  }
  return {
    module: "word",
    tableIsNew: phase === "final",
    groups: wordGroups(phase).map((g) => ({
      id: g.id,
      rows: g.words.map((display) => ({ display, press: g.table[display]! })),
    })),
  };
}

/**
 * The Defuser for modules 1–3, from the team ordered by defuser_order.
 * Each round continues the rotation: Round 1 starts at member 1, Round 2 at member 4, the next round
 * (an extra round or the Final) at member 7, wrapping around small teams
 * (5 players: R1 1,2,3 · R2 4,5,1; 4 players: R2 4,1,2; 1 player defuses all three).
 */
export function pickDefusers(memberIds: number[], round: number): number[] {
  if (memberIds.length === 0) return [];
  const start = (round - 1) * 3;
  return [0, 1, 2].map((i) => memberIds[(start + i) % memberIds.length]!);
}

export type TurnForPlay = {
  teamId: number;
  phase: Phase;
  module: ModuleNo;
  defuserIds: number[];
  status: "betting" | "playing" | "paused" | "defused" | "boom" | "voided";
  /** Set while Radio Interference is on: the seed of the shuffle. */
  scrambleSeed?: number | null;
};

export type PlayView =
  | { role: "waiting" }
  | { role: "spectator"; playingTeamId: number }
  | { role: "defuser"; module: ModuleNo }
  | { role: "expert"; module: ModuleNo; manual: Manual };

/**
 * What one phone shows. The manual only ever reaches Experts of the team that is playing,
 * from the moment the team steps up (betting) until the bomb is finished.
 */
export function playView(player: { id: number; teamId: number }, turn: TurnForPlay | null): PlayView {
  const live = turn && (turn.status === "betting" || turn.status === "playing" || turn.status === "paused");
  if (!turn || !live) return { role: "waiting" };
  if (player.teamId !== turn.teamId) return { role: "spectator", playingTeamId: turn.teamId };
  if (turn.defuserIds[turn.module - 1] === player.id) return { role: "defuser", module: turn.module };
  const manual = manualFor(turn.phase, turn.module);
  return { role: "expert", module: turn.module, manual: turn.scrambleSeed == null ? manual : scrambleManual(manual, turn.scrambleSeed) };
}
