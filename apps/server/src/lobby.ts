import { and, asc, desc, eq, ne, schema, type Db } from "@defuse/db";
import type { Me, NewTeam, PublicGame, TeamColor } from "@defuse/shared";

const { games, teams, players } = schema;

export class LobbyError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Only one session is active at a time: the newest one that hasn't finished. */
export async function getActiveGame(db: Db) {
  const [game] = await db.select().from(games).where(ne(games.status, "finished"))
    .orderBy(desc(games.id)).limit(1);
  return game ?? null;
}

export async function getPublicGame(db: Db, joinUrl: string): Promise<PublicGame | null> {
  const game = await getActiveGame(db);
  if (!game) return null;
  const teamRows = await db.select().from(teams).where(eq(teams.gameId, game.id)).orderBy(asc(teams.turnOrder));
  const playerRows = await db.select({ id: players.id, nickname: players.nickname, teamId: players.teamId })
    .from(players).where(eq(players.gameId, game.id)).orderBy(asc(players.defuserOrder), asc(players.id));
  return {
    id: game.id,
    status: game.status,
    phase: game.phase,
    joinUrl,
    teams: teamRows.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color as TeamColor,
      players: playerRows.filter((p) => p.teamId === t.id).map(({ id, nickname }) => ({ id, nickname })),
    })),
  };
}

/** Starts a new session and ends any session still running. */
export async function createGame(db: Db, newTeams: NewTeam[]) {
  const cleaned = newTeams.map((t) => ({ name: t.name.trim(), color: t.color }));
  if (cleaned.length < 3 || cleaned.length > 4) throw new LobbyError("A session needs 3 or 4 teams.");
  if (cleaned.some((t) => !t.name)) throw new LobbyError("Every team needs a name.");
  if (new Set(cleaned.map((t) => t.name.toLowerCase())).size !== cleaned.length)
    throw new LobbyError("Team names must be different.");
  if (new Set(cleaned.map((t) => t.color)).size !== cleaned.length)
    throw new LobbyError("Each team needs its own color.");

  return db.transaction(async (tx) => {
    await tx.update(games).set({ status: "finished" }).where(ne(games.status, "finished"));
    const [game] = await tx.insert(games).values({}).returning();
    await tx.insert(teams).values(cleaned.map((t, i) => ({ ...t, gameId: game!.id, turnOrder: i + 1 })));
    return game!;
  });
}

export async function joinPlayer(db: Db, input: { nickname: string; teamId: number }) {
  const nickname = input.nickname.trim();
  if (!nickname) throw new LobbyError("Please enter a nickname.");
  const game = await getActiveGame(db);
  if (!game) throw new LobbyError("There is no session to join yet.");

  return db.transaction(async (tx) => {
    const [team] = await tx.select().from(teams)
      .where(and(eq(teams.id, input.teamId), eq(teams.gameId, game.id))).for("update");
    if (!team) throw new LobbyError("That team is not in this session.");
    const members = await tx.select({ id: players.id }).from(players).where(eq(players.teamId, team.id));
    const [player] = await tx.insert(players)
      .values({ gameId: game.id, teamId: team.id, nickname, defuserOrder: members.length + 1 })
      .returning();
    const me: Me = {
      player: { id: player!.id, nickname: player!.nickname },
      team: { id: team.id, name: team.name, color: team.color as TeamColor },
    };
    return { deviceToken: player!.deviceToken, me };
  });
}

/** The player behind a device token, if they belong to the active session. */
export async function findMe(db: Db, deviceToken: string | null | undefined): Promise<Me | null> {
  if (!deviceToken || !UUID.test(deviceToken)) return null;
  const game = await getActiveGame(db);
  if (!game) return null;
  const [row] = await db.select({ player: players, team: teams }).from(players)
    .innerJoin(teams, eq(teams.id, players.teamId))
    .where(and(eq(players.deviceToken, deviceToken), eq(players.gameId, game.id)));
  if (!row) return null;
  return {
    player: { id: row.player.id, nickname: row.player.nickname },
    team: { id: row.team.id, name: row.team.name, color: row.team.color as TeamColor },
  };
}
