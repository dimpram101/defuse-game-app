import { resolve, sep } from "node:path";
import { Elysia, t } from "elysia";
import { sql, type Db } from "@defuse/db";
import { manualFor, NICKNAME_MAX, TEAM_COLORS, TEAM_NAME_MAX } from "@defuse/shared";
import type { GmAuth } from "./gm-auth";
import { createGame, findMe, getPublicGame, joinPlayer, LobbyError } from "./lobby";

type Deps = { db: Db; gm: GmAuth; joinUrl: string; webDist?: string };

export function createApp({ db, gm, joinUrl, webDist }: Deps) {
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
    .get("/api/gm/check", ({ headers, status }) =>
      gm.verify(headers.authorization) ? { ok: true } : status(401, { error: "Enter the GM PIN again." }))
    .get("/api/game", async ({ status }) =>
      (await getPublicGame(db, joinUrl)) ?? status(404, { error: "No active session." }))
    .post("/api/players", ({ body }) => joinPlayer(db, body), {
      body: t.Object({
        nickname: t.String({ maxLength: NICKNAME_MAX }),
        teamId: t.Integer({ minimum: 1 }),
      }),
    })
    .get("/api/players/me", async ({ headers, status }) =>
      (await findMe(db, headers["x-device-token"])) ?? status(404, { error: "Not in the current session." }));

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
