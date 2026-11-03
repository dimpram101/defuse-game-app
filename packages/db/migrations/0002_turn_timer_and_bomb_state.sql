ALTER TABLE "turns" ADD COLUMN "paused_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "turns" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "turns" ADD COLUMN "bomb_state" jsonb;