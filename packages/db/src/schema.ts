import {
  boolean, integer, jsonb, pgEnum, pgTable, serial, smallint, text, timestamp, unique, uuid,
} from "drizzle-orm/pg-core";

export const gameStatus = pgEnum("game_status", [
  "lobby", "betting", "playing", "paused", "result", "leaderboard", "finished",
]);
export const phase = pgEnum("phase", ["round1", "round2", "final"]);
export const turnStatus = pgEnum("turn_status", [
  "betting", "playing", "paused", "defused", "boom", "voided",
]);
export const sabotageType = pgEnum("sabotage_type", ["speed_up", "silent_expert", "radio_interference"]);
export const sabotageStatus = pgEnum("sabotage_status", ["pending", "approved", "rejected"]);

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  status: gameStatus("status").notNull().default("lobby"),
  phase: phase("phase").notNull().default("round1"),
  // No FK: turns references games, and the cycle isn't worth the migration ordering.
  currentTurnId: integer("current_turn_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  turnOrder: smallint("turn_order").notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  defuserOrder: smallint("defuser_order").notNull(),
  deviceToken: uuid("device_token").notNull().unique().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const turns = pgTable("turns", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  phase: phase("phase").notNull(),
  seed: integer("seed").notNull(),
  status: turnStatus("status").notNull().default("betting"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  durationSec: smallint("duration_sec").notNull(),
  pausedMs: integer("paused_ms").notNull().default(0),
  // Set while paused, so a restart during a pause keeps the remaining time.
  pausedAt: timestamp("paused_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  // "Switch Defuser" notice after a module is shown until this moment (informational only).
  handoverUntil: timestamp("handover_until", { withTimezone: true }),
  // Module, strikes, cut wires and symbol progress (BombState from @defuse/shared).
  bombState: jsonb("bomb_state").$type<{
    module: 1 | 2 | 3;
    strikes: number;
    cut: number[];
    symbolProgress: number;
    status: "playing" | "defused" | "boom";
  }>(),
  defuserIds: jsonb("defuser_ids").$type<number[]>(),
});

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  turnId: integer("turn_id").notNull().references(() => turns.id, { onDelete: "cascade" }),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  willDefuse: boolean("will_defuse").notNull(),
  // 0, 1, or 2 meaning "2 or more"
  strikesGuess: smallint("strikes_guess").notNull(),
}, (t) => [unique().on(t.turnId, t.teamId)]);

export const sabotages = pgTable("sabotages", {
  id: serial("id").primaryKey(),
  turnId: integer("turn_id").notNull().references(() => turns.id, { onDelete: "cascade" }),
  byTeamId: integer("by_team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  type: sabotageType("type").notNull(),
  cost: smallint("cost").notNull(),
  status: sabotageStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scoreEvents = pgTable("score_events", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  turnId: integer("turn_id").references(() => turns.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  points: integer("points").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
