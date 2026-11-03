import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDb, migrateDb, sql } from "@defuse/db";
import { manualFor, type PublicGame } from "@defuse/shared";
import { createApp } from "./app";
import { createGmAuth } from "./gm-auth";

// Needs the dev database from `bun run db:up` (it creates `defuse_test` on first start).
const db = createDb(process.env.TEST_DATABASE_URL ?? "postgres://defuse:defuse@localhost:5434/defuse_test");
const PIN = "246810";
const JOIN_URL = "https://defuse.test/play";

const dist = mkdtempSync(join(tmpdir(), "defuse-dist-"));
writeFileSync(join(dist, "index.html"), "<!doctype html><title>Defuse!</title>");
writeFileSync(join(dist, "app.js"), "console.log(1)");

const app = createApp({ db, gm: createGmAuth(PIN, 0), joinUrl: JOIN_URL, webDist: dist });

async function call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await app.handle(new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

const teams3 = [
  { name: "Red Panda", color: "team-1" },
  { name: "Night Owls", color: "team-2" },
  { name: "Comets", color: "team-3" },
];

async function gmToken() {
  return (await call("POST", "/api/gm/login", { pin: PIN })).json.token as string;
}
async function newGame(teams = teams3) {
  const res = await call("POST", "/api/gm/games", { teams }, { authorization: `Bearer ${await gmToken()}` });
  return res.json as PublicGame;
}

beforeAll(async () => { await migrateDb(db); });
beforeEach(async () => {
  await db.execute(sql`truncate games, teams, players, turns, bets, sabotages, score_events restart identity cascade`);
});
afterAll(() => db.close());

test("health reports the database is reachable", async () => {
  expect(await call("GET", "/health")).toMatchObject({ status: 200, json: { ok: true } });
});

describe("GM", () => {
  test("wrong PIN is refused, right PIN returns a token", async () => {
    expect((await call("POST", "/api/gm/login", { pin: "000000" })).status).toBe(401);
    const token = await gmToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect((await call("GET", "/api/gm/check", undefined, { authorization: `Bearer ${token}` })).status).toBe(200);
    expect((await call("GET", "/api/gm/check", undefined, { authorization: "Bearer nope" })).status).toBe(401);
  });

  test("creating a session needs the token", async () => {
    expect((await call("POST", "/api/gm/games", { teams: teams3 })).status).toBe(401);
  });

  test("session needs 3–4 teams with distinct names and colors", async () => {
    const auth = { authorization: `Bearer ${await gmToken()}` };
    expect((await call("POST", "/api/gm/games", { teams: teams3.slice(0, 2) }, auth)).status).toBe(422);
    const sameColor = [...teams3.slice(0, 2), { name: "Comets", color: "team-1" }];
    expect(await call("POST", "/api/gm/games", { teams: sameColor }, auth))
      .toMatchObject({ status: 400, json: { error: "Each team needs its own color." } });
    const blank = [...teams3.slice(0, 2), { name: "   ", color: "team-3" }];
    expect((await call("POST", "/api/gm/games", { teams: blank }, auth)).status).toBe(400);
  });

  test("a new session ends the previous one", async () => {
    const first = await newGame();
    const joined = await call("POST", "/api/players", { nickname: "Ayu", teamId: first.teams[0]!.id });
    const second = await newGame();
    expect(second.id).not.toBe(first.id);
    expect((await call("GET", "/api/game")).json.id).toBe(second.id);
    // The old device token no longer belongs to the active session.
    expect((await call("GET", "/api/players/me", undefined, { "x-device-token": joined.json.deviceToken })).status).toBe(404);
  });
});

describe("manual preview", () => {
  test("GM only, validated, same content as manualFor", async () => {
    expect((await call("GET", "/api/gm/manual?phase=round1&module=1")).status).toBe(401);
    const auth = { authorization: `Bearer ${await gmToken()}` };
    expect((await call("GET", "/api/gm/manual?phase=round9&module=1", undefined, auth)).status).toBe(422);
    expect((await call("GET", "/api/gm/manual?phase=final&module=4", undefined, auth)).status).toBe(422);
    const res = await call("GET", "/api/gm/manual?phase=final&module=2", undefined, auth);
    expect(res.json).toEqual(manualFor("final", 2));
  });
});

describe("players", () => {
  test("no session yet", async () => {
    expect((await call("GET", "/api/game")).status).toBe(404);
    expect((await call("POST", "/api/players", { nickname: "Ayu", teamId: 1 })).status).toBe(400);
  });

  test("join, then the device token finds the same player", async () => {
    const game = await newGame();
    const team = game.teams[1]!;
    const res = await call("POST", "/api/players", { nickname: "  Ayu  ", teamId: team.id });
    expect(res.status).toBe(200);
    expect(res.json.me).toEqual({
      player: { id: expect.any(Number), nickname: "Ayu" },
      team: { id: team.id, name: "Night Owls", color: "team-2" },
    });
    const me = await call("GET", "/api/players/me", undefined, { "x-device-token": res.json.deviceToken });
    expect(me.json).toEqual(res.json.me);
  });

  test("players are listed per team in join order", async () => {
    const game = await newGame();
    const teamId = game.teams[0]!.id;
    for (const nickname of ["Ayu", "Bima", "Citra"]) await call("POST", "/api/players", { nickname, teamId });
    const after = (await call("GET", "/api/game")).json as PublicGame;
    expect(after.joinUrl).toBe(JOIN_URL);
    expect(after.teams[0]!.players.map((p) => p.nickname)).toEqual(["Ayu", "Bima", "Citra"]);
    expect(after.teams[1]!.players).toEqual([]);
  });

  test("rejects blank nicknames, long nicknames and teams from another session", async () => {
    const old = await newGame();
    await newGame();
    expect((await call("POST", "/api/players", { nickname: "   ", teamId: old.teams[0]!.id })).status).toBe(400);
    expect((await call("POST", "/api/players", { nickname: "x".repeat(21), teamId: old.teams[0]!.id })).status).toBe(422);
    expect(await call("POST", "/api/players", { nickname: "Ayu", teamId: old.teams[0]!.id }))
      .toMatchObject({ status: 400, json: { error: "That team is not in this session." } });
  });

  test("malformed device tokens are simply unknown", async () => {
    await newGame();
    expect((await call("GET", "/api/players/me", undefined, { "x-device-token": "not-a-uuid" })).status).toBe(404);
    expect((await call("GET", "/api/players/me")).status).toBe(404);
  });
});

describe("static web build", () => {
  test("serves files, falls back to index.html, never leaves the dist folder", async () => {
    expect((await call("GET", "/app.js")).text).toBe("console.log(1)");
    expect((await call("GET", "/play")).text).toContain("<title>Defuse!</title>");
    expect((await call("GET", "/%2e%2e/%2e%2e/etc/passwd")).text).toContain("<title>Defuse!</title>");
    expect((await call("GET", "/api/unknown")).status).toBe(404);
  });
});
