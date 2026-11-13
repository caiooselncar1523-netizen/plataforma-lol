-- CreateTable
CREATE TABLE "ChampionBenchmark" (
    "platform" TEXT NOT NULL,
    "patch" TEXT NOT NULL,
    "eloBucket" "EloBucket" NOT NULL,
    "championId" INTEGER NOT NULL,
    "championKey" TEXT NOT NULL,
    "role" "GameRole" NOT NULL,
    "metric" TEXT NOT NULL,
    "average" DOUBLE PRECISION NOT NULL,
    "stddev" DOUBLE PRECISION NOT NULL,
    "games" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChampionBenchmark_pkey" PRIMARY KEY ("platform","patch","eloBucket","championId","role","metric")
);

-- CreateIndex
CREATE INDEX "ChampionBenchmark_platform_patch_eloBucket_championId_role_idx" ON "ChampionBenchmark"("platform", "patch", "eloBucket", "championId", "role");
