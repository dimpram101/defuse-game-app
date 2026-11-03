import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createDb, desc, migrateDb, schema, sql } from "@defuse/db";
import { generateBomb, manualFor, scrambleManual, type ClientMessage, type GmSnapshot, type PlaySnapshot, type ScreenSnapshot, type ServerMessage } from "@defuse/shared";
import { createGmAuth } from "./gm-auth";
import { LiveGame } from "./live";
import { createGame, joinPlayer } from "./lobby";

// Needs the dev database from `bun run db:up`.
const db = createDb(process.env.TEST_DATABASE_URL ?? "postgres://defuse:defuse@localhost:5434/defuse_test");
const gm = createGmAuth("246810", 0);
let token = "";
let clock = 0;
let live: LiveGame;
const inbox = new Map<string, ServerMessage[]>();

function device(id: string) {
  inbox.set(id, []);
  live.connect(id, (m) => inbox.get(id)!.push(m));
  return {
    say: (msg: ClientMessage) => live.handle(id, msg),
    last<T>() {
      const snaps = inbox.get(id)!.filter((m) => m.type === "snapshot");
      return (snaps.at(-1) as { snapshot: T } | undefined)?.snapshot as T;
    },
    errors: () => inbox.get(id)!.filter((m) => m.type === "error").map((m) => (m as { message: string }).message),
  };
}

/** Let the 5 s "Switch Defuser" notice after a module run out (the bomb clock keeps running). */
async function switchDefuser() {
  clock += 5_000;
  expect(await live.tick()).toBe(true);
}

async function setup() {
  await createGame(db, [
    { name: "Red Panda", color: "team-1" },
    { name: "Empty", color: "team-2" },
    { name: "Comets", color: "team-3" },
  ]);
  const ids = (await db.execute<{ id: number }>(sql`select id from teams order by turn_order`)).map((r) => r.id);
  const join = (nickname: string, teamId: number) => joinPlayer(db, { nickname, teamId });
  const red = [await join("Ayu", ids[0]!), await join("Bima", ids[0]!), await join("Citra", ids[0]!)];
  const comets = [await join("Dewi", ids[2]!)];
  await live.changed();
  return { teamIds: ids, red, comets };
}

beforeAll(async () => {
  await migrateDb(db);
  token = (await gm.login("246810"))!;
});
beforeEach(async () => {
  await db.execute(sql`truncate games, teams, players, turns, bets, sabotages, score_events restart identity cascade`);
  clock = 1_000_000;
  live?.close();
  live = new LiveGame(db, gm, "https://defuse.test/play", () => clock);
  inbox.clear();
});
afterAll(() => {
  live.close();
  return db.close();
});

/** Plays every team of the current round by letting the bomb time out, then shows the leaderboard. */
async function timeOutRound(g: ReturnType<typeof device>) {
  for (let k = g.last<GmSnapshot>().next.kind; k === "open_turn" || k === "start_turn"; k = g.last<GmSnapshot>().next.kind) {
    if (k === "open_turn") await g.say({ type: "gm", command: "next" });
    await g.say({ type: "gm", command: "next" });
    clock += 200_000;
    await live.tick();
  }
  await g.say({ type: "gm", command: "next" });
  expect(g.last<GmSnapshot>().game!.status).toBe("leaderboard");
}

describe("a full turn", () => {
  test("open, start, defuse, score, skip the empty team, time out, leaderboard, next round", async () => {
    const { teamIds, red } = await setup();
    const gmDev = device("gm");
    const screen = device("screen");
    const [ayu, bima] = red.map((r, i) => device(`p${i}`));
    const dewi = device("dewi");
    await gmDev.say({ type: "hello", role: "gm", gmToken: token });
    await screen.say({ type: "hello", role: "screen", gmToken: token });
    await ayu!.say({ type: "hello", role: "play", deviceToken: red[0]!.deviceToken });
    await bima!.say({ type: "hello", role: "play", deviceToken: red[1]!.deviceToken });

    expect(gmDev.last<GmSnapshot>().next).toEqual({ kind: "open_turn", teamId: teamIds[0]! });
    expect(gmDev.last<GmSnapshot>().warnings).toContain("Empty has no players and will be skipped.");

    await gmDev.say({ type: "gm", command: "next" });
    expect(screen.last<ScreenSnapshot>().game!.turn).toMatchObject({ number: 1, teamId: teamIds[0], status: "betting" });
    // Team is up: module 1's Defuser (Ayu) gets no manual, the others already read it.
    expect(ayu!.last<PlaySnapshot>().view).toEqual({ role: "defuser", module: 1 });
    expect(bima!.last<PlaySnapshot>().view.role).toBe("expert");

    await gmDev.say({ type: "gm", command: "next" });
    const playing = screen.last<ScreenSnapshot>();
    expect(playing.game!.turn).toMatchObject({ status: "playing", module: 1, timer: { running: true, remainingMs: 180_000 } });
    expect(playing.bomb!.view.wires.length).toBeGreaterThan(2);
    expect(JSON.stringify(playing)).not.toMatch(/"answer"|"seed"/);

    // Solve the bomb with its answers, 40 s in, with one wrong cut.
    const turn = (await db.execute<{ id: number; seed: number }>(sql`select id, seed from turns`))[0]!;
    const bomb = generateBomb(turn.seed, "round1");
    clock += 40_000;
    const wrong = bomb.wires.answer === 1 ? 2 : 1;
    await screen.say({ type: "defuser", turnId: turn.id, action: { type: "cut", wire: wrong } });
    await screen.say({ type: "defuser", turnId: turn.id, action: { type: "cut", wire: bomb.wires.answer } });
    expect(bima!.last<PlaySnapshot>().view).toEqual({ role: "defuser", module: 2 });
    expect(ayu!.last<PlaySnapshot>().view.role).toBe("expert");
    await switchDefuser();
    for (const symbol of bomb.symbols.answer) await screen.say({ type: "defuser", turnId: turn.id, action: { type: "press", symbol } });
    await switchDefuser();
    await screen.say({ type: "defuser", turnId: turn.id, action: { type: "word", word: bomb.word.answer } });

    const result = screen.last<ScreenSnapshot>().game!;
    expect(result.status).toBe("result");
    expect(result.turn!.result).toEqual({
      lines: [
        { kind: "defused", points: 100, note: "Bomb defused" },
        { kind: "time_bonus", points: 130, note: "130 s left" },
        { kind: "strike", points: -20, note: "1 strike" },
      ],
      total: 210,
      solvedModules: 3,
      bets: [],
    });
    expect(result.teams[0]!.score).toBe(210);
    expect(ayu!.last<PlaySnapshot>().view).toEqual({ role: "waiting" });

    // Next skips the empty team.
    await gmDev.say({ type: "gm", command: "next" });
    expect(screen.last<ScreenSnapshot>().game!.turn).toMatchObject({ teamId: teamIds[2], status: "betting" });
    expect(ayu!.last<PlaySnapshot>().view).toEqual({ role: "spectator", playingTeamId: teamIds[2] });
    await gmDev.say({ type: "gm", command: "next" });
    // Dewi plays alone: she is the Defuser and nobody is an Expert.
    expect(gmDev.last<GmSnapshot>().warnings).toContain("No Expert of Comets is online.");

    clock += 180_000;
    expect(await live.tick()).toBe(true);
    const boom = screen.last<ScreenSnapshot>().game!;
    expect(boom.turn).toMatchObject({ status: "boom", timer: { running: false, remainingMs: 0 } });
    expect(boom.teams[2]!.score).toBe(0);

    await gmDev.say({ type: "gm", command: "next" });
    expect(screen.last<ScreenSnapshot>().game!.status).toBe("leaderboard");
    await gmDev.say({ type: "gm", command: "next" });
    expect(screen.last<ScreenSnapshot>().game).toMatchObject({ phase: "round2", round: 2, status: "betting", turn: { teamId: teamIds[0], number: 3 } });
    void dewi;
  });
});

describe("extra rounds", () => {
  test("after Round 2 the GM picks one more round at Round 2 difficulty, or the Final", async () => {
    await setup();
    const g = device("gm");
    await g.say({ type: "hello", role: "gm", gmToken: token });

    await timeOutRound(g);
    expect(g.last<GmSnapshot>().next).toEqual({ kind: "next_round", round: 2, phase: "round2", extraRound: null });
    await g.say({ type: "gm", command: "extra_round" });
    expect(g.errors()).toEqual(["An extra round can only start from the leaderboard after Round 2."]);
    await g.say({ type: "gm", command: "next" });
    await timeOutRound(g);

    expect(g.last<GmSnapshot>().next).toEqual({ kind: "next_round", round: 3, phase: "final", extraRound: 3 });
    await g.say({ type: "gm", command: "extra_round" });
    expect(g.last<GmSnapshot>().game).toMatchObject({
      phase: "round2", round: 3, status: "betting", turn: { phase: "round2", round: 3, timer: { durationMs: 180_000 } },
    });
    await timeOutRound(g);

    expect(g.last<GmSnapshot>().next).toEqual({ kind: "next_round", round: 4, phase: "final", extraRound: 4 });
    await g.say({ type: "gm", command: "next" });
    expect(g.last<GmSnapshot>().game).toMatchObject({
      phase: "final", round: 4, turn: { phase: "final", round: 4, timer: { durationMs: 150_000 } },
    });
    await timeOutRound(g);
    expect(g.last<GmSnapshot>().next).toEqual({ kind: "finish" });
  });
});

describe("timer", () => {
  async function startFirstTurn() {
    await setup();
    const g = device("gm");
    await g.say({ type: "hello", role: "gm", gmToken: token });
    await g.say({ type: "gm", command: "next" });
    await g.say({ type: "gm", command: "next" });
    return g;
  }
  const remaining = (g: ReturnType<typeof device>) => g.last<GmSnapshot>().game!.turn!.timer;

  test("pause stops the clock, also across a server restart", async () => {
    const g = await startFirstTurn();
    clock += 30_000;
    await g.say({ type: "gm", command: "pause" });
    expect(remaining(g)).toMatchObject({ running: false, paused: true, remainingMs: 150_000 });

    clock += 60_000;
    live.close();
    live = new LiveGame(db, gm, "https://defuse.test/play", () => clock);
    await live.init();
    const g2 = device("gm2");
    await g2.say({ type: "hello", role: "gm", gmToken: token });
    expect(remaining(g2)).toMatchObject({ paused: true, remainingMs: 150_000 });

    await g2.say({ type: "gm", command: "resume" });
    clock += 10_000;
    await live.changed();
    expect(remaining(g2)).toMatchObject({ running: true, remainingMs: 140_000 });
  });

  test("a restart mid-turn keeps counting from the stored start; if time ran out meanwhile it's BOOM", async () => {
    await startFirstTurn();
    clock += 200_000;
    live.close();
    live = new LiveGame(db, gm, "https://defuse.test/play", () => clock);
    await live.init();
    const g = device("gm2");
    await g.say({ type: "hello", role: "gm", gmToken: token });
    expect(g.last<GmSnapshot>().game!.turn!.status).toBe("boom");
  });

  test("third strike explodes and scores modules done minus strikes", async () => {
    const g = await startFirstTurn();
    const screen = device("screen");
    await screen.say({ type: "hello", role: "screen", gmToken: token });
    const turn = (await db.execute<{ id: number; seed: number }>(sql`select id, seed from turns`))[0]!;
    const bomb = generateBomb(turn.seed, "round1");
    await screen.say({ type: "defuser", turnId: turn.id, action: { type: "cut", wire: bomb.wires.answer } });
    await switchDefuser();
    const wrong = bomb.symbols.answer[1]!;
    for (let i = 0; i < 3; i++) await screen.say({ type: "defuser", turnId: turn.id, action: { type: "press", symbol: wrong } });
    expect(g.last<GmSnapshot>().game!.turn!.result).toMatchObject({
      lines: [{ kind: "module", points: 30 }, { kind: "strike", points: -60 }],
      total: -30,
    });
  });
});

describe("Defuser switch", () => {
  async function playing() {
    await setup();
    const g = device("gm");
    const screen = device("screen");
    await g.say({ type: "hello", role: "gm", gmToken: token });
    await screen.say({ type: "hello", role: "screen", gmToken: token });
    await g.say({ type: "gm", command: "next" });
    await g.say({ type: "gm", command: "next" });
    const turn = (await db.execute<{ id: number; seed: number }>(sql`select id, seed from turns`))[0]!;
    return { g, screen, turn, bomb: generateBomb(turn.seed, "round1") };
  }

  test("solving a module shows the switch notice for 5 s; the bomb stays playable and the clock runs, also across a restart", async () => {
    const { screen, turn, bomb } = await playing();
    clock += 20_000;
    await screen.say({ type: "defuser", turnId: turn.id, action: { type: "cut", wire: bomb.wires.answer } });
    const timer = () => screen.last<ScreenSnapshot>().game!.turn!.timer;
    expect(timer()).toMatchObject({ running: true, remainingMs: 160_000, handoverMs: 5_000 });
    expect(screen.last<ScreenSnapshot>().bomb!.state.module).toBe(2);

    // Clicks during the notice count as usual.
    clock += 2_000;
    await screen.say({ type: "defuser", turnId: turn.id, action: { type: "press", symbol: bomb.symbols.answer[0]! } });
    expect(screen.last<ScreenSnapshot>().bomb!.state.symbolProgress).toBe(1);
    expect(await live.tick()).toBe(false);

    live.close();
    live = new LiveGame(db, gm, "https://defuse.test/play", () => clock);
    await live.init();
    const s2 = device("screen2");
    await s2.say({ type: "hello", role: "screen", gmToken: token });
    expect(s2.last<ScreenSnapshot>().game!.turn!.timer).toMatchObject({ handoverMs: 3_000, remainingMs: 158_000 });

    clock += 3_000;
    expect(await live.tick()).toBe(true);
    expect(s2.last<ScreenSnapshot>().game!.turn!.timer).toMatchObject({ running: true, handoverMs: null, remainingMs: 155_000 });
  });

  test("time can run out during the switch: BOOM with the module that was finished", async () => {
    const { g, screen, turn, bomb } = await playing();
    clock += 177_000;
    await screen.say({ type: "defuser", turnId: turn.id, action: { type: "cut", wire: bomb.wires.answer } });
    clock += 3_000;
    expect(await live.tick()).toBe(true);
    expect(g.last<GmSnapshot>().game!.turn).toMatchObject({ status: "boom", timer: { remainingMs: 0, handoverMs: null } });
    expect(g.last<GmSnapshot>().game!.turn!.result!.lines).toEqual([{ kind: "module", points: 30, note: "1 module done" }]);
  });

  test("a GM pause during the switch ends the switch; resume continues the clock", async () => {
    const { g, screen, turn, bomb } = await playing();
    clock += 30_000;
    await screen.say({ type: "defuser", turnId: turn.id, action: { type: "cut", wire: bomb.wires.answer } });
    clock += 1_000;
    await g.say({ type: "gm", command: "pause" });
    clock += 60_000;
    await g.say({ type: "gm", command: "resume" });
    expect(g.last<GmSnapshot>().game!.turn!.timer).toMatchObject({ running: true, handoverMs: null, remainingMs: 149_000 });
  });
});

describe("permissions", () => {
  test("only an unlocked /screen plays the bomb, only the GM runs the game, stale turn ids are ignored", async () => {
    await setup();
    const g = device("gm");
    await g.say({ type: "hello", role: "gm", gmToken: token });
    await g.say({ type: "gm", command: "next" });
    await g.say({ type: "gm", command: "next" });
    const turn = (await db.execute<{ id: number; seed: number }>(sql`select id, seed from turns`))[0]!;
    const answer = generateBomb(turn.seed, "round1").wires.answer;

    const viewer = device("viewer");
    await viewer.say({ type: "hello", role: "screen" });
    expect(viewer.last<ScreenSnapshot>().canAct).toBe(false);
    await viewer.say({ type: "defuser", turnId: turn.id, action: { type: "cut", wire: answer } });
    expect(viewer.errors()).toEqual(["Only the unlocked /screen can play the bomb."]);

    const phone = device("phone");
    await phone.say({ type: "hello", role: "play" });
    await phone.say({ type: "gm", command: "end" });
    expect(phone.errors()).toEqual(["Enter the GM PIN again."]);
    expect(JSON.stringify(phone.last<PlaySnapshot>())).not.toMatch(/"wires"|"symbols"/);

    const fakeGm = device("fake");
    await fakeGm.say({ type: "hello", role: "gm", gmToken: "nope" });
    expect(fakeGm.errors()).toEqual(["Enter the GM PIN again."]);

    const screen = device("screen");
    await screen.say({ type: "hello", role: "screen", gmToken: token });
    await screen.say({ type: "defuser", turnId: turn.id + 99, action: { type: "cut", wire: answer } });
    expect(screen.last<ScreenSnapshot>().bomb!.state.module).toBe(1);
  });

  test("End voids a running turn; the finished session stays on screen", async () => {
    await setup();
    const g = device("gm");
    await g.say({ type: "hello", role: "gm", gmToken: token });
    await g.say({ type: "gm", command: "next" });
    await g.say({ type: "gm", command: "next" });
    await g.say({ type: "gm", command: "end" });
    const snap = g.last<GmSnapshot>();
    expect(snap.game).toMatchObject({ status: "finished", turn: { status: "voided" } });
    expect(snap.next.kind).toBe("none");
    expect((await db.execute(sql`select * from score_events`)).length).toBe(0);
  });
});

describe("spectators", () => {
  /** Four teams: Red plays (Ayu, Bima, Citra), Blue, Green and Gold watch with one phone each. */
  async function setup4() {
    await createGame(db, [
      { name: "Red", color: "team-1" },
      { name: "Blue", color: "team-2" },
      { name: "Green", color: "team-3" },
      { name: "Gold", color: "team-4" },
    ]);
    const ids = (await db.execute<{ id: number }>(sql`select id from teams order by turn_order`)).map((r) => r.id);
    const join = (nickname: string, teamId: number) => joinPlayer(db, { nickname, teamId });
    const red = [await join("Ayu", ids[0]!), await join("Bima", ids[0]!), await join("Citra", ids[0]!)];
    const others = [await join("Dewi", ids[1]!), await join("Eka", ids[2]!), await join("Fajar", ids[3]!)];
    await live.changed();
    const g = device("gm");
    const screen = device("screen");
    await g.say({ type: "hello", role: "gm", gmToken: token });
    await screen.say({ type: "hello", role: "screen", gmToken: token });
    const phone = async (id: string, deviceToken: string) => {
      const d = device(id);
      await d.say({ type: "hello", role: "play", deviceToken });
      return d;
    };
    const [ayu, bima, citra] = [await phone("ayu", red[0]!.deviceToken), await phone("bima", red[1]!.deviceToken), await phone("citra", red[2]!.deviceToken)];
    const [blue, green, gold] = [await phone("blue", others[0]!.deviceToken), await phone("green", others[1]!.deviceToken), await phone("gold", others[2]!.deviceToken)];
    return { ids, g, screen, ayu: ayu!, bima: bima!, citra: citra!, blue: blue!, green: green!, gold: gold! };
  }

  async function givePoints(gameTeamIds: number[], points: number) {
    const [game] = await db.select({ id: schema.games.id }).from(schema.games).orderBy(desc(schema.games.id)).limit(1);
    const gameId = game!.id;
    for (const teamId of gameTeamIds)
      await db.execute(sql`insert into score_events (game_id, team_id, kind, points) values (${gameId}, ${teamId}, 'test', ${points})`);
    await live.changed();
  }

  test("Bets: saved per team while betting, locked at Start, scored at the result", async () => {
    const { ids, g, ayu, blue, green, gold } = await setup4();
    await g.say({ type: "gm", command: "next" });
    expect(blue.last<PlaySnapshot>().spectator).toMatchObject({ betOpen: true, bet: { willDefuse: null, strikes: null }, sabotage: null });
    expect(ayu.last<PlaySnapshot>().spectator).toBeNull();

    await blue.say({ type: "bet", willDefuse: true });
    await blue.say({ type: "bet", strikes: 1 });
    await blue.say({ type: "bet", willDefuse: false });
    await green.say({ type: "bet", willDefuse: false, strikes: 0 });
    await gold.say({ type: "bet", strikes: 2 });
    expect(blue.last<PlaySnapshot>().spectator!.bet).toEqual({ willDefuse: false, strikes: 1 });
    expect(g.last<GmSnapshot>().game!.turn!.betTeamIds.sort()).toEqual([ids[1], ids[2]].sort());
    await ayu.say({ type: "bet", willDefuse: true });
    expect(ayu.errors()).toEqual(["Your team is playing this turn."]);

    await g.say({ type: "gm", command: "next" });
    await blue.say({ type: "bet", willDefuse: true });
    expect(blue.errors()).toEqual(["Bets are closed. The bomb has started."]);

    clock += 200_000;
    await live.tick();
    const game = g.last<GmSnapshot>().game!;
    // BOOM with 0 strikes: Blue right on the outcome only, Green right on both, Gold wrong.
    expect(game.turn!.result!.bets).toEqual([{ teamId: ids[1], points: 20 }, { teamId: ids[2], points: 30 }]);
    expect(game.teams.map((t) => t.score)).toEqual([0, 20, 30, 0]);
  });

  test("Sabotage: closed in Round 1, first request wins, GM approves, cost and limits apply", async () => {
    const { ids, g, screen, blue, green, gold } = await setup4();
    await g.say({ type: "gm", command: "next" });
    await g.say({ type: "gm", command: "next" });
    await blue.say({ type: "sabotage", twist: "speed_up" });
    expect(blue.errors()).toEqual(["Sabotage opens in Round 2."]);
    clock += 200_000;
    await live.tick();
    await timeOutRound(g);
    await g.say({ type: "gm", command: "next" });
    await givePoints([ids[1]!, ids[2]!], 100);

    // Round 2, Red steps up: Sabotage waits for the bomb.
    expect(blue.last<PlaySnapshot>().spectator!.sabotage!.options[0]).toEqual({ type: "speed_up", cost: 40, reason: "Opens when the bomb starts." });
    await g.say({ type: "gm", command: "next" });
    expect(gold.last<PlaySnapshot>().spectator!.sabotage!.options[0]!.reason).toBe("Needs 40 points. You have 0.");

    // Two teams at the same moment: only one request goes in.
    await Promise.all([blue.say({ type: "sabotage", twist: "speed_up" }), green.say({ type: "sabotage", twist: "radio_interference" })]);
    expect(green.errors()).toEqual(["Another team already sabotaged this turn."]);
    const [pending] = g.last<GmSnapshot>().sabotages;
    expect(pending).toMatchObject({ byTeamId: ids[1], type: "speed_up", cost: 40 });
    expect(blue.last<PlaySnapshot>().spectator!.sabotage!.mine).toEqual({ type: "speed_up", status: "pending" });

    // Rejected: the slot opens again.
    await g.say({ type: "gm_sabotage", sabotageId: pending!.id, approve: false });
    expect(green.last<PlaySnapshot>().spectator!.sabotage!.options[2]!.reason).toBeNull();
    await green.say({ type: "sabotage", twist: "speed_up" });
    const before = screen.last<ScreenSnapshot>().game!.turn!.timer.remainingMs;
    await g.say({ type: "gm_sabotage", sabotageId: g.last<GmSnapshot>().sabotages[0]!.id, approve: true });

    const turn = screen.last<ScreenSnapshot>().game!.turn!;
    expect(before - turn.timer.remainingMs).toBe(30_000);
    expect(turn.twists).toEqual([{ type: "speed_up", byTeamId: ids[2], target: null, msLeft: 5_000, durationMs: 5_000, running: true }]);
    expect(screen.last<ScreenSnapshot>().game!.teams[2]!.score).toBe(60);
    expect(blue.last<PlaySnapshot>().spectator!.sabotage!.options[0]!.reason).toBe("Another team already sabotaged this turn.");

    // The announcement ends on the bomb clock.
    clock += 5_000;
    expect(await live.tick()).toBe(true);
    expect(screen.last<ScreenSnapshot>().game!.turn!.twists).toEqual([]);

    // Next team's turn in the same round: Green has used its Sabotage for Round 2.
    clock += 200_000;
    await live.tick();
    await g.say({ type: "gm", command: "next" });
    await g.say({ type: "gm", command: "next" });
    expect(green.last<PlaySnapshot>().view.role).toBe("spectator");
    expect(green.last<PlaySnapshot>().spectator!.sabotage!.options[0]!.reason).toBe("Your team already used its Sabotage in Round 2.");
  });

  test("GM twists: Speed Up keeps 5 s, Silent Expert mutes one Expert, Radio Interference shuffles the manual", async () => {
    const { g, screen, ayu, bima, citra } = await setup4();
    await g.say({ type: "gm", command: "next" });
    await g.say({ type: "gm_twist", twist: "speed_up" });
    expect(g.errors()).toEqual(["Twists only work while the bomb is running."]);
    await g.say({ type: "gm", command: "next" });

    clock += 160_000;
    await g.say({ type: "gm_twist", twist: "speed_up" });
    expect(screen.last<ScreenSnapshot>().game!.turn!.timer.remainingMs).toBe(5_000);

    await g.say({ type: "gm_twist", twist: "silent_expert" });
    const muted = [bima, citra].filter((p) => p.last<PlaySnapshot>().muted !== null);
    expect(muted.length).toBe(1);
    expect(muted[0]!.last<PlaySnapshot>().muted).toEqual({ msLeft: 45_000, running: true });
    expect(ayu.last<PlaySnapshot>().muted).toBeNull(); // Ayu is the Defuser of module 1

    // Paused: twists stop with the bomb clock.
    await g.say({ type: "gm", command: "pause" });
    clock += 60_000;
    await live.tick();
    expect(muted[0]!.last<PlaySnapshot>().muted).toEqual({ msLeft: 45_000, running: false });
    await g.say({ type: "gm", command: "resume" });

    await g.say({ type: "gm_twist", twist: "radio_interference" });
    const view = bima.last<PlaySnapshot>().view;
    expect(view.role).toBe("expert");
    expect(view.role === "expert" && view.manual.scrambled).toBe(true);
    expect(view.role === "expert" && view.manual).toEqual(scrambleManual(manualFor("round1", 1), await radioSeed()));

    // The shuffle lasts 60 s on the bomb clock, but this bomb has 5 s left: it ends with the turn.
    clock += 5_000;
    await live.tick();
    expect(bima.last<PlaySnapshot>().view.role).toBe("waiting");
    expect(screen.last<ScreenSnapshot>().game!.turn!.twists).toEqual([]);
  });
});

async function radioSeed() {
  const [row] = await db.select({ twists: schema.turns.twists }).from(schema.turns).orderBy(desc(schema.turns.id)).limit(1);
  return row!.twists.find((t) => t.type === "radio_interference")!.seed;
}
