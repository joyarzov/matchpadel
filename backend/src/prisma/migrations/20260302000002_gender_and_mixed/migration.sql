-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "GenderMode" AS ENUM ('MALE_ONLY', 'FEMALE_ONLY', 'MIXED', 'ANY');

-- AlterTable: Add gender to users with default for existing rows
ALTER TABLE "users" ADD COLUMN "gender" "Gender" NOT NULL DEFAULT 'MALE';

-- AlterTable: Add gender mode fields to matches
ALTER TABLE "matches" ADD COLUMN "gender_mode" "GenderMode" NOT NULL DEFAULT 'ANY';
ALTER TABLE "matches" ADD COLUMN "required_males" INTEGER;
ALTER TABLE "matches" ADD COLUMN "required_females" INTEGER;
