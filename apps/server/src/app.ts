import { resolve, sep } from "node:path";
import { Elysia, t } from "elysia";
import { sql, type Db } from "@defuse/db";
import { generateBomb, manualFor, AWARD_MAX, CORRECTION_MAX, NICKNAME_MAX, NOTE_MAX, TEAM_COLORS, TEAM_NAME_MAX } from "@defuse/shared";
import type { GmAuth } from "./gm-auth";
import type { LiveGame } from "./live";
import { createGame, findMe, getPublicGame, joinPlayer, LobbyError } from "./lobby";

type Deps = { db: Db; gm: GmAuth; live: LiveGame; joinUrl: string; webDist?: string };

const defuserAction = t.Union([
  t.Object({ type: t.Literal("cut"), wire: t.Integer() }),
  t.Object({ type: t.Literal("press"), symbol: t.String({ maxLength: 40 }) }),
  t.Object({ type: t.Literal("word"), word: t.String({ maxLength: 40 }) }),
]);
const twistType = t.UnionEnum(["speed_up", "silent_expert", "radio_interference"]);
const clientMessage = t.Union([
  t.Object({
    type: t.Literal("hello"),
    role: t.UnionEnum(["screen", "gm", "play"]),
    deviceToken: t.Optional(t.String({ maxLength: 100 })),
    gmToken: t.Optional(t.String({ maxLength: 200 })),
  }),
  t.Object({ type: t.Literal("defuser"), turnId: t.Integer(), action: defuserAction }),
  t.Object({ type: t.Literal("gm"), command: t.UnionEnum(["next", "extra_round", "final_top2", "pause", "resume", "end"]) }),
  t.Object({ type: t.Literal("gm_twist"), twist: twistType }),
  t.Object({ type: t.Literal("gm_sabotage"), sabotageId: t.Integer(), approve: t.Boolean() }),
  t.Object({
    type: t.Literal("bet"),
    willDefuse: t.Optional(t.Boolean()),
    strikes: t.Optional(t.Union([t.Literal(0), t.Literal(1), t.Literal(2)])),
  }),
  t.Object({ type: t.Literal("sabotage"), twist: twistType }),
  t.Object({ type: t.Literal("gm_penalty"), penalty: t.UnionEnum(["english", "peeking", "hint"]), teamId: t.Optional(t.Integer()) }),
  t.Object({ type: t.Literal("gm_talk_bonus") }),
  t.Object({
    type: t.Literal("gm_correction"),
    teamId: t.Integer(),
    points: t.Integer({ minimum: -CORRECTION_MAX, maximum: CORRECTION_MAX }),
    // Longer notes are cut to NOTE_MAX by the server.
    note: t.String({ maxLength: NOTE_MAX * 2 }),
  }),
  t.Object({ type: t.Literal("gm_replay") }),
  t.Object({ type: t.Literal("gm_review"), turnId: t.Union([t.Integer(), t.Null()]) }),
  t.Object({
    type: t.Literal("gm_player"),
    playerId: t.Integer(),
    action: t.UnionEnum(["up", "down", "delete", "move"]),
    teamId: t.Optional(t.Integer()),
  }),
  t.Object({ type: t.Literal("gm_awards"), bestDefuser: t.String({ maxLength: AWARD_MAX * 2 }), bestExpert: t.String({ maxLength: AWARD_MAX * 2 }) }),
  t.Object({ type: t.Literal("gm_sound"), on: t.Boolean() }),
]);

export function createApp({ db, gm, live, joinUrl, webDist }: Deps) {
  const app = new Elysia()
    .error({ LobbyError })
    .onError(({ code, error, status }) => {
      if (code === "LobbyError") return status(400, { error: error.message });
    })
    .get("/health", async ({ status }) => {
      try {
        await db.execute(sql`select 1`);
        return { ok: true };
      } catch {
        return status(503, { ok: false, error: "Database unreachable" });
      }
    })
    .post("/api/gm/login", async ({ body, status }) => {
      const token = await gm.login(body.pin);
      return token ? { token } : status(401, { error: "Wrong PIN." });
    }, { body: t.Object({ pin: t.String({ maxLength: 200 }) }) })
    .post("/api/gm/games", async ({ body, headers, status }) => {
      if (!gm.verify(headers.authorization)) return status(401, { error: "Enter the GM PIN again." });
      await createGame(db, body.teams);
      await live.changed();
      return (await getPublicGame(db, joinUrl))!;
    }, {
      body: t.Object({
        teams: t.Array(t.Object({
          name: t.String({ maxLength: TEAM_NAME_MAX }),
          color: t.UnionEnum(TEAM_COLORS),
        }), { minItems: 3, maxItems: 4 }),
      }),
    })
    // Lets the GM preview exactly what Experts will see. Real turns send the manual over the WebSocket (phase 4).
    .get("/api/gm/manual", ({ headers, query, status }) => {
      if (!gm.verify(headers.authorization)) return status(401, { error: "Enter the GM PIN again." });
      return manualFor(query.phase, query.module as 1 | 2 | 3);
    }, {
      query: t.Object({
        phase: t.UnionEnum(["round1", "round2", "final"]),
        module: t.Numeric({ minimum: 1, maximum: 3, multipleOf: 1 }),
      }),
    })
    // Practice bomb with its answers: /screen?practice checks clicks in the browser. GM only, so the
    // question bank never ships in the public web bundle.
    .get("/api/gm/practice-bomb", ({ headers, query, status }) => {
      if (!gm.verify(headers.authorization)) return status(401, { error: "Enter the GM PIN again." });
      return generateBomb(query.seed, query.phase);
    }, {
      query: t.Object({
        phase: t.UnionEnum(["round1", "round2", "final"]),
        seed: t.Numeric({ minimum: 1, maximum: 2_147_483_647, multipleOf: 1 }),
      }),
    })
    .get("/api/gm/check", ({ headers, status }) =>
      gm.verify(headers.authorization) ? { ok: true } : status(401, { error: "Enter the GM PIN again." }))
    .get("/api/game", async ({ status }) =>
      (await getPublicGame(db, joinUrl)) ?? status(404, { error: "No active session." }))
    .post("/api/players", async ({ body }) => {
      const joined = await joinPlayer(db, body);
      await live.changed();
      return joined;
    }, {
      body: t.Object({
        nickname: t.String({ maxLength: NICKNAME_MAX }),
        teamId: t.Integer({ minimum: 1 }),
      }),
    })
    .get("/api/players/me", async ({ headers, status }) =>
      (await findMe(db, headers["x-device-token"])) ?? status(404, { error: "Not in the current session." }))
    // Live game: every device sends `hello`, then receives a snapshot after every change.
    .ws("/ws", {
      body: clientMessage,
      open(ws) {
        live.connect(ws.id, (msg) => ws.send(msg));
      },
      async message(ws, msg) {
        await live.handle(ws.id, msg);
      },
      close(ws) {
        live.disconnect(ws.id);
      },
    });

  if (!webDist) return app;

  const root = resolve(webDist);
  const index = Bun.file(resolve(root, "index.html"));
  // Static build of apps/web. Unknown paths fall back to index.html so /screen, /play and /gm load the SPA.
  return app.get("/*", async ({ path, status }) => {
    if (path.startsWith("/api/")) return status(404, { error: "Not found." });
    let decoded = path;
    try { decoded = decodeURIComponent(path); } catch {}
    const target = resolve(root, "." + decoded);
    if (target.startsWith(root + sep)) {
      const file = Bun.file(target);
      if (await file.exists()) return file;
    }
    return index;
  });
}
