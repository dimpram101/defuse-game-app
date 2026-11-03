ALTER TABLE "games" ADD COLUMN "round" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "turns" ADD COLUMN "round" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE "games" SET "round" = CASE "phase" WHEN 'round2' THEN 2 WHEN 'final' THEN 3 ELSE 1 END;--> statement-breakpoint
UPDATE "turns" SET "round" = CASE "phase" WHEN 'round2' THEN 2 WHEN 'final' THEN 3 ELSE 1 END;
