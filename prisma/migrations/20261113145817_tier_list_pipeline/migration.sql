-- CreateEnum
CREATE TYPE "GameRole" AS ENUM ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT');

-- CreateEnum
CREATE TYPE "EloBucket" AS ENUM ('ALL', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER_PLUS');

-- CreateTable
CREATE TABLE "MatchRecord" (
    "matchId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'BR1',
    "queueId" INTEGER NOT NULL,
    "gameVersion" TEXT NOT NULL,
    "patch" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchRecord_pkey" PRIMARY KEY ("matchId")
);

-- CreateTable
CREATE TABLE "MatchSample" (
    "matchId" TEXT NOT NULL,
    "eloBucket" "EloBucket" NOT NULL,
    "sampledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchSample_pkey" PRIMARY KEY ("matchId","eloBucket")
);

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "matchId" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "championId" INTEGER NOT NULL,
    "championKey" TEXT NOT NULL,
    "role" "GameRole" NOT NULL,
    "won" BOOLEAN NOT NULL,
    "kills" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("matchId","puuid")
);

-- CreateTable
CREATE TABLE "MatchBan" (
    "matchId" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "championId" INTEGER NOT NULL,

    CONSTRAINT "MatchBan_pkey" PRIMARY KEY ("matchId","teamId","championId")
);

-- CreateTable
CREATE TABLE "ChampionStat" (
    "platform" TEXT NOT NULL,
    "patch" TEXT NOT NULL,
    "eloBucket" "EloBucket" NOT NULL,
    "championId" INTEGER NOT NULL,
    "championKey" TEXT NOT NULL,
    "role" "GameRole" NOT NULL,
    "tier" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "pickRate" DOUBLE PRECISION NOT NULL,
    "banRate" DOUBLE PRECISION NOT NULL,
    "kda" DOUBLE PRECISION NOT NULL,
    "games" INTEGER NOT NULL,
    "roleRate" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChampionStat_pkey" PRIMARY KEY ("platform","patch","eloBucket","championId","role")
);

-- CreateIndex
CREATE INDEX "MatchRecord_platform_queueId_patch_idx" ON "MatchRecord"("platform", "queueId", "patch");

-- CreateIndex
CREATE INDEX "MatchRecord_startedAt_idx" ON "MatchRecord"("startedAt");

-- CreateIndex
CREATE INDEX "MatchSample_eloBucket_sampledAt_idx" ON "MatchSample"("eloBucket", "sampledAt");

-- CreateIndex
CREATE INDEX "MatchParticipant_championId_role_idx" ON "MatchParticipant"("championId", "role");

-- CreateIndex
CREATE INDEX "MatchBan_championId_idx" ON "MatchBan"("championId");

-- CreateIndex
CREATE INDEX "ChampionStat_platform_patch_eloBucket_tier_score_idx" ON "ChampionStat"("platform", "patch", "eloBucket", "tier", "score");

-- AddForeignKey
ALTER TABLE "MatchSample" ADD CONSTRAINT "MatchSample_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchRecord"("matchId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchRecord"("matchId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchBan" ADD CONSTRAINT "MatchBan_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchRecord"("matchId") ON DELETE CASCADE ON UPDATE CASCADE;
