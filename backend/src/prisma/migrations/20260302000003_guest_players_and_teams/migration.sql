-- AlterTable: make user_id nullable on match_players
ALTER TABLE "match_players" ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable: add guest-related columns to match_players
ALTER TABLE "match_players" ADD COLUMN "is_guest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "match_players" ADD COLUMN "guest_name" TEXT;
ALTER TABLE "match_players" ADD COLUMN "added_by_id" TEXT;
ALTER TABLE "match_players" ADD COLUMN "team" INTEGER;

-- AlterTable: add team player ID arrays to match_scores
ALTER TABLE "match_scores" ADD COLUMN "team1_player_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "match_scores" ADD COLUMN "team2_player_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Remove the default after adding (Prisma convention)
ALTER TABLE "match_scores" ALTER COLUMN "team1_player_ids" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "match_scores" ALTER COLUMN "team2_player_ids" SET DEFAULT ARRAY[]::TEXT[];

-- Backfill existing match_players
UPDATE "match_players" SET "is_guest" = false WHERE "is_guest" IS NULL;
