-- CreateTable
CREATE TABLE "match_scores" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "reported_by_id" TEXT NOT NULL,
    "set1_team1" INTEGER NOT NULL,
    "set1_team2" INTEGER NOT NULL,
    "set2_team1" INTEGER NOT NULL,
    "set2_team2" INTEGER NOT NULL,
    "set3_team1" INTEGER,
    "set3_team2" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_scores_match_id_reported_by_id_key" ON "match_scores"("match_id", "reported_by_id");

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
