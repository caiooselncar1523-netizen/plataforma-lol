CREATE TABLE "PlayerProfile" (
    "puuid" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'BR1',
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "profileIconId" INTEGER NOT NULL,
    "summonerLevel" INTEGER NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("puuid")
);

CREATE TABLE "PlayerRankedEntry" (
    "profilePuuid" TEXT NOT NULL,
    "queueType" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "leaguePoints" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,

    CONSTRAINT "PlayerRankedEntry_pkey" PRIMARY KEY ("profilePuuid", "queueType")
);

CREATE INDEX "PlayerProfile_platform_gameName_tagLine_idx"
    ON "PlayerProfile"("platform", "gameName", "tagLine");

CREATE INDEX "PlayerRankedEntry_queueType_tier_idx"
    ON "PlayerRankedEntry"("queueType", "tier");

ALTER TABLE "PlayerRankedEntry"
    ADD CONSTRAINT "PlayerRankedEntry_profilePuuid_fkey"
    FOREIGN KEY ("profilePuuid") REFERENCES "PlayerProfile"("puuid")
    ON DELETE CASCADE ON UPDATE CASCADE;
