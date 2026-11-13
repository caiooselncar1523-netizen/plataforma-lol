import "dotenv/config";
import { collectTierList } from "../src/features/tier-list/application/collect-tier-list";
import { prisma } from "../src/server/db/client";

collectTierList()
  .then((result) => {
    console.info("Tier-list collection completed.", result);
  })
  .catch((error: unknown) => {
    console.error(
      "Tier-list collection failed.",
      error instanceof Error ? error.message : "Unknown collection error.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
