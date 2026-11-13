import "dotenv/config";
import { PgBoss } from "pg-boss";
import { collectTierList } from "../src/features/tier-list/application/collect-tier-list";

const tierListCollectionQueue = "tier-list.collect";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL must be configured before starting the worker.");
  }

  const boss = new PgBoss({ connectionString });

  boss.on("error", (error: Error) => {
    console.error("Worker queue error.", error);
  });

  await boss.start();
  console.info("Ahriademia worker started and connected to PostgreSQL.");

  await boss.createQueue(tierListCollectionQueue);
  await boss.work(tierListCollectionQueue, async () => {
    const result = await collectTierList();
    console.info("Scheduled tier-list collection completed.", result);
  });
  await boss.schedule(tierListCollectionQueue, "0 */12 * * *");
  console.info("Tier-list collection scheduled every 12 hours.");

  let stopping = false;
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (stopping) {
      return;
    }

    stopping = true;
    console.info(`Received ${signal}; stopping worker.`);
    await boss.stop({ graceful: true, timeout: 5_000 });
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT").catch((error: unknown) => {
      console.error("Failed to stop worker gracefully.", error);
      process.exitCode = 1;
    });
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM").catch((error: unknown) => {
      console.error("Failed to stop worker gracefully.", error);
      process.exitCode = 1;
    });
  });
}

void main().catch((error: unknown) => {
  console.error("Worker failed to start.", error);
  process.exitCode = 1;
});
