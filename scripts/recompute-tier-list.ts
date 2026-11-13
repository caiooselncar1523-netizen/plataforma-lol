import "dotenv/config";
import { prisma } from "../src/server/db/client";
import { recomputeTierListStats } from "../src/features/tier-list/application/recompute-tier-list";

async function main(): Promise<void> {
  const matches = await prisma.matchRecord.findMany({
    where: { platform: "BR1", queueId: 420 },
    select: { patch: true },
    distinct: ["patch"],
  });
  const minimumGames = Number(process.env.RIOT_MIN_CHAMPION_GAMES ?? 50);
  if (!Number.isInteger(minimumGames) || minimumGames < 1) {
    throw new Error("RIOT_MIN_CHAMPION_GAMES must be a positive integer.");
  }
  const statsComputed = await recomputeTierListStats(
    matches.map(({ patch }) => patch),
    minimumGames,
  );
  console.info("Tier-list aggregation completed.", {
    patchesProcessed: matches.length,
    statsComputed,
  });
}

main()
  .catch((error: unknown) => {
    console.error(
      "Tier-list aggregation failed.",
      error instanceof Error ? error.message : "Unknown aggregation error.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
