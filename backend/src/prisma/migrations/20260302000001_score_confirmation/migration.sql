-- CreateEnum
CREATE TYPE "ScoreStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex (remove old unique constraint allowing multiple scores per match)
DROP INDEX "match_scores_match_id_reported_by_id_key";

-- AlterTable: add status, winner_team, updated_at to match_scores
ALTER TABLE "match_scores" ADD COLUMN "status" "ScoreStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "match_scores" ADD COLUMN "winner_team" INTEGER;
ALTER TABLE "match_scores" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "score_approvals" (
    "id" TEXT NOT NULL,
    "score_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "score_approvals_score_id_user_id_key" ON "score_approvals"("score_id", "user_id");

-- AddForeignKey
ALTER TABLE "score_approvals" ADD CONSTRAINT "score_approvals_score_id_fkey" FOREIGN KEY ("score_id") REFERENCES "match_scores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_approvals" ADD CONSTRAINT "score_approvals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
