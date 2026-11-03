import { describe, expect, test } from "bun:test";
import samples from "../../content/samples.json";
import { generateBomb, type Bomb } from "./bomb";
import { checkAnswer, expire, newBombState, solvedModules, toBombView, type BombState, type DefuserAction } from "./play";

const bomb = generateBomb(102, "round1"); // blue, red, black, white → cut 4th
const wrongWire = bomb.wires.answer === 1 ? 2 : 1;
const wrongSymbol = (b: Bomb, progress: number) => b.symbols.answer.slice(progress + 1)[0]!;

function run(b: Bomb, actions: DefuserAction[], state = newBombState()) {
  const outcomes: string[] = [];
  for (const a of actions) {
    const r = checkAnswer(b, state, a);
    outcomes.push(r.outcome);
    state = r.state;
  }
  return { state, outcomes };
}

const solveWires = (b: Bomb): DefuserAction[] => [{ type: "cut", wire: b.wires.answer }];
const solveSymbols = (b: Bomb): DefuserAction[] => b.symbols.answer.map((symbol) => ({ type: "press", symbol }));
const solveWord = (b: Bomb): DefuserAction[] => [{ type: "word", word: b.word.answer }];

test("bomb view carries no answers", () => {
  const view = toBombView(bomb);
  expect(Object.keys(view).sort()).toEqual(["symbols", "wires", "word"]);
  expect(Object.keys(view.word).sort()).toEqual(["buttons", "display"]);
  expect(JSON.stringify(view)).not.toMatch(/answer|rule|column|group|seed/);
});

describe("wires", () => {
  test("right wire solves the module", () => {
    const { state, outcomes } = run(bomb, solveWires(bomb));
    expect(outcomes).toEqual(["correct"]);
    expect(state).toMatchObject({ module: 2, strikes: 0, cut: [bomb.wires.answer] });
  });

  test("wrong cut: strike, wire stays cut, module continues, right wire still works", () => {
    const { state, outcomes } = run(bomb, [{ type: "cut", wire: wrongWire }, { type: "cut", wire: bomb.wires.answer }]);
    expect(outcomes).toEqual(["wrong", "correct"]);
    expect(state).toMatchObject({ module: 2, strikes: 1, cut: [wrongWire, bomb.wires.answer] });
  });

  test("clicking a cut wire, or a wire that doesn't exist, is ignored without a strike", () => {
    const { state, outcomes } = run(bomb, [
      { type: "cut", wire: wrongWire },
      { type: "cut", wire: wrongWire },
      { type: "cut", wire: 0 },
      { type: "cut", wire: bomb.wires.colors.length + 1 },
    ]);
    expect(outcomes).toEqual(["wrong", "ignored", "ignored", "ignored"]);
    expect(state.strikes).toBe(1);
  });
});

describe("symbols", () => {
  const atSymbols = run(bomb, solveWires(bomb)).state;

  test("the four symbols in order solve the module", () => {
    const { state, outcomes } = run(bomb, solveSymbols(bomb), atSymbols);
    expect(outcomes).toEqual(["correct", "correct", "correct", "correct"]);
    expect(state).toMatchObject({ module: 3, symbolProgress: 4 });
  });

  test("a wrong press strikes and resets the progress", () => {
    const [first] = solveSymbols(bomb);
    const { state, outcomes } = run(bomb, [first!, { type: "press", symbol: wrongSymbol(bomb, 1) }], atSymbols);
    expect(outcomes).toEqual(["correct", "wrong"]);
    expect(state).toMatchObject({ module: 2, symbolProgress: 0, strikes: 1 });
    // Starting over from the first symbol works.
    expect(run(bomb, solveSymbols(bomb), state).state.module).toBe(3);
  });

  test("pressing a lit symbol again is ignored", () => {
    const [first] = solveSymbols(bomb);
    const { state, outcomes } = run(bomb, [first!, first!], atSymbols);
    expect(outcomes).toEqual(["correct", "ignored"]);
    expect(state).toMatchObject({ symbolProgress: 1, strikes: 0 });
  });

  test("symbols are ignored while the wires module is active", () => {
    expect(run(bomb, solveSymbols(bomb)).outcomes).toEqual(["ignored", "ignored", "ignored", "ignored"]);
  });
});

describe("say the word", () => {
  const atWord = run(bomb, [...solveWires(bomb), ...solveSymbols(bomb)]).state;

  test("right button defuses the bomb", () => {
    const { state } = run(bomb, solveWord(bomb), atWord);
    expect(state.status).toBe("defused");
    expect(solvedModules(state)).toBe(3);
  });

  test("wrong button strikes and keeps the module", () => {
    const wrong = bomb.word.buttons.find((w) => w !== bomb.word.answer)!;
    const { state, outcomes } = run(bomb, [{ type: "word", word: wrong }], atWord);
    expect(outcomes).toEqual(["wrong"]);
    expect(state).toMatchObject({ module: 3, strikes: 1, status: "playing" });
  });
});

describe("BOOM", () => {
  test("third strike explodes, even in the middle of the symbol order, and nothing counts afterwards", () => {
    const strikes2: BombState = { ...newBombState(), module: 2, strikes: 2, cut: [bomb.wires.answer] };
    const [first] = solveSymbols(bomb);
    const { state, outcomes } = run(bomb, [first!, { type: "press", symbol: wrongSymbol(bomb, 1) }, ...solveSymbols(bomb)], strikes2);
    expect(outcomes).toEqual(["correct", "wrong", "ignored", "ignored", "ignored", "ignored"]);
    expect(state).toMatchObject({ status: "boom", strikes: 3 });
    expect(solvedModules(state)).toBe(1);
  });

  test("time running out explodes a live bomb and leaves a finished one alone", () => {
    expect(expire(newBombState()).status).toBe("boom");
    const defused = { ...newBombState(), status: "defused" as const };
    expect(expire(defused)).toBe(defused);
  });
});

test("every printed sample bomb can be played from start to DEFUSED with its answers", () => {
  const all = Object.values(samples as Record<string, Bomb[]>).flat();
  expect(all.length).toBe(35);
  for (const sample of all) {
    const b = generateBomb(sample.seed, sample.phase);
    expect(b).toEqual(sample);
    const { state } = run(b, [...solveWires(b), ...solveSymbols(b), ...solveWord(b)]);
    expect(state).toMatchObject({ status: "defused", strikes: 0 });
  }
});
