ALTER TABLE "games" ADD COLUMN "final_team_ids" jsonb;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "review_turn_id" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "best_defuser" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "best_expert" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "sound_on" boolean DEFAULT true NOT NULL;