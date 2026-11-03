CREATE TYPE "public"."game_status" AS ENUM('lobby', 'betting', 'playing', 'paused', 'result', 'leaderboard', 'finished');--> statement-breakpoint
CREATE TYPE "public"."phase" AS ENUM('round1', 'round2', 'final');--> statement-breakpoint
CREATE TYPE "public"."sabotage_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."sabotage_type" AS ENUM('speed_up', 'silent_expert', 'radio_interference');--> statement-breakpoint
CREATE TYPE "public"."turn_status" AS ENUM('betting', 'playing', 'paused', 'defused', 'boom', 'voided');--> statement-breakpoint
CREATE TABLE "bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"turn_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"will_defuse" boolean NOT NULL,
	"strikes_guess" smallint NOT NULL,
	CONSTRAINT "bets_turn_id_team_id_unique" UNIQUE("turn_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" "game_status" DEFAULT 'lobby' NOT NULL,
	"phase" "phase" DEFAULT 'round1' NOT NULL,
	"current_turn_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"nickname" text NOT NULL,
	"defuser_order" smallint NOT NULL,
	"device_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_device_token_unique" UNIQUE("device_token")
);
--> statement-breakpoint
CREATE TABLE "sabotages" (
	"id" serial PRIMARY KEY NOT NULL,
	"turn_id" integer NOT NULL,
	"by_team_id" integer NOT NULL,
	"type" "sabotage_type" NOT NULL,
	"cost" smallint NOT NULL,
	"status" "sabotage_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"turn_id" integer,
	"kind" text NOT NULL,
	"points" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"turn_order" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turns" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"phase" "phase" NOT NULL,
	"seed" integer NOT NULL,
	"status" "turn_status" DEFAULT 'betting' NOT NULL,
	"started_at" timestamp with time zone,
	"duration_sec" smallint NOT NULL,
	"paused_ms" integer DEFAULT 0 NOT NULL,
	"current_module" smallint DEFAULT 1 NOT NULL,
	"strikes" smallint DEFAULT 0 NOT NULL,
	"defuser_ids" jsonb
);
--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_turn_id_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sabotages" ADD CONSTRAINT "sabotages_turn_id_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sabotages" ADD CONSTRAINT "sabotages_by_team_id_teams_id_fk" FOREIGN KEY ("by_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_events" ADD CONSTRAINT "score_events_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_events" ADD CONSTRAINT "score_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_events" ADD CONSTRAINT "score_events_turn_id_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;