import type { Bomb, Color } from "./bomb";

export const MAX_STRIKES = 3;
export type ModuleNo = 1 | 2 | 3;

/** What /screen may receive: the bomb without any answer, rule, column or group. */
export type BombView = {
  wires: Color[];
  symbols: string[];
  word: { display: string; buttons: string[] };
};

export function toBombView(bomb: Bomb): BombView {
  return {
    wires: [...bomb.wires.colors],
    symbols: [...bomb.symbols.shown],
    word: { display: bomb.word.display, buttons: [...bomb.word.buttons] },
  };
}

export type BombState = {
  module: ModuleNo;
  strikes: number;
  /** 1-based positions of every wire cut so far, right or wrong. */
  cut: number[];
  /** Correct symbols pressed in a row; a wrong press resets it to 0. */
  symbolProgress: number;
  status: "playing" | "defused" | "boom";
};

export type DefuserAction =
  | { type: "cut"; wire: number }
  | { type: "press"; symbol: string }
  | { type: "word"; word: string };

/**
 * correct / wrong change the bomb; ignored means the click didn't count
 * (wrong module, wire already cut, symbol already lit, bomb finished).
 */
export type Outcome = "correct" | "wrong" | "ignored";

export const newBombState = (): BombState => ({ module: 1, strikes: 0, cut: [], symbolProgress: 0, status: "playing" });

const strike = (s: BombState): BombState => {
  const strikes = s.strikes + 1;
  return { ...s, strikes, status: strikes >= MAX_STRIKES ? "boom" : "playing" };
};

export function checkAnswer(bomb: Bomb, state: BombState, action: DefuserAction): { outcome: Outcome; state: BombState } {
  const ignored = { outcome: "ignored" as const, state };
  if (state.status !== "playing") return ignored;

  if (action.type === "cut") {
    if (state.module !== 1) return ignored;
    const n = bomb.wires.colors.length;
    if (!Number.isInteger(action.wire) || action.wire < 1 || action.wire > n || state.cut.includes(action.wire)) return ignored;
    const cut = [...state.cut, action.wire];
    // The answer comes from the original wire layout, so a wrong cut never changes which wire is right.
    if (action.wire === bomb.wires.answer) return { outcome: "correct", state: { ...state, cut, module: 2 } };
    return { outcome: "wrong", state: strike({ ...state, cut }) };
  }

  if (action.type === "press") {
    if (state.module !== 2 || !bomb.symbols.shown.includes(action.symbol)) return ignored;
    const order = bomb.symbols.answer;
    if (order.slice(0, state.symbolProgress).includes(action.symbol)) return ignored;
    if (order[state.symbolProgress] === action.symbol) {
      const symbolProgress = state.symbolProgress + 1;
      const done = symbolProgress === order.length;
      return { outcome: "correct", state: { ...state, symbolProgress, module: done ? 3 : 2 } };
    }
    return { outcome: "wrong", state: strike({ ...state, symbolProgress: 0 }) };
  }

  if (state.module !== 3 || !bomb.word.buttons.includes(action.word)) return ignored;
  if (action.word === bomb.word.answer) return { outcome: "correct", state: { ...state, status: "defused" } };
  return { outcome: "wrong", state: strike(state) };
}

/** Time ran out. */
export const expire = (state: BombState): BombState =>
  state.status === "playing" ? { ...state, status: "boom" } : state;

/** Modules finished, for the LEDs and the +30 per module score on BOOM. */
export const solvedModules = (state: BombState): number =>
  state.status === "defused" ? 3 : state.module - 1;
