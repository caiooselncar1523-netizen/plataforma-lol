-- CreateTable
CREATE TABLE "RankedPlayerSample" (
    "puuid" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'BR1',
    "eloBucket" "EloBucket" NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSampledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankedPlayerSample_pkey" PRIMARY KEY ("puuid")
);

-- CreateIndex
CREATE INDEX "RankedPlayerSample_platform_eloBucket_lastSampledAt_idx" ON "RankedPlayerSample"("platform", "eloBucket", "lastSampledAt");
