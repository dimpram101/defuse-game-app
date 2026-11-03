ALTER TABLE "bets" ALTER COLUMN "will_defuse" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bets" ALTER COLUMN "strikes_guess" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "turns" ADD COLUMN "cut_ms" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "turns" ADD COLUMN "twists" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "sabotages_one_per_turn" ON "sabotages" USING btree ("turn_id") WHERE "sabotages"."status" <> 'rejected';