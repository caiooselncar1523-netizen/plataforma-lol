import type { EloBucket } from "@prisma/client";

export const rankedEloBuckets = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER_PLUS",
] as const satisfies readonly EloBucket[];
type RankedEloBucket = (typeof rankedEloBuckets)[number];

export const cumulativeEloBuckets = [
  { bucket: "BRONZE_PLUS", from: "BRONZE" },
  { bucket: "SILVER_PLUS", from: "SILVER" },
  { bucket: "GOLD_PLUS", from: "GOLD" },
  { bucket: "PLATINUM_PLUS", from: "PLATINUM" },
  { bucket: "EMERALD_PLUS", from: "EMERALD" },
  { bucket: "DIAMOND_PLUS", from: "DIAMOND" },
] as const satisfies readonly { bucket: EloBucket; from: EloBucket }[];

const cumulativeStartBuckets: Partial<Record<EloBucket, RankedEloBucket>> = {
  BRONZE_PLUS: "BRONZE",
  SILVER_PLUS: "SILVER",
  GOLD_PLUS: "GOLD",
  PLATINUM_PLUS: "PLATINUM",
  EMERALD_PLUS: "EMERALD",
  DIAMOND_PLUS: "DIAMOND",
};

export function sourceBucketsForEloBucket(
  eloBucket: EloBucket,
): EloBucket[] {
  if (eloBucket === "ALL") return ["ALL"];

  const firstBucket = cumulativeStartBuckets[eloBucket];
  if (!firstBucket) return [eloBucket];

  return rankedEloBuckets.slice(rankedEloBuckets.indexOf(firstBucket));
}
