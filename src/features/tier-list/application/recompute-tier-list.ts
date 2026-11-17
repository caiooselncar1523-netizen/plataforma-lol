import type { EloBucket } from "@prisma/client";
import { prisma } from "@/server/db/client";
import {
  cumulativeEloBuckets,
  rankedEloBuckets,
} from "../domain/elo-buckets";
import {
  aggregateChampionStats,
  type AggregationMatch,
} from "./aggregate-champion-stats";

export async function recomputeTierListStats(
  patches: readonly string[],
  minimumGames: number,
): Promise<number> {
  if (patches.length === 0) return 0;

  const persistedSamples = await prisma.matchSample.findMany({
    where: {
      match: {
        is: { patch: { in: [...patches] }, queueId: 420 },
      },
    },
    include: {
      match: {
        include: { participants: true, bans: true },
      },
    },
  });
  const cohorts = new Map<string, AggregationMatch[]>();
  const samplesByPatch = new Map<string, Map<EloBucket, AggregationMatch[]>>();
  for (const sample of persistedSamples) {
    const match = sample.match;
    const key = `${match.patch}:${sample.eloBucket}`;
    const cohort = cohorts.get(key) ?? [];
    cohort.push({
      matchId: match.matchId,
      patch: match.patch,
      eloBucket: sample.eloBucket,
      participants: match.participants.map((participant) => ({
        championId: participant.championId,
        championKey: participant.championKey,
        role: participant.role,
        won: participant.won,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
      })),
      bans: match.bans.map(({ championId }) => ({ championId })),
    });
    cohorts.set(key, cohort);

    if (sample.eloBucket !== "ALL") {
      const byBucket = samplesByPatch.get(match.patch) ?? new Map();
      const bucketMatches = byBucket.get(sample.eloBucket) ?? [];
      bucketMatches.push(cohort[cohort.length - 1]!);
      byBucket.set(sample.eloBucket, bucketMatches);
      samplesByPatch.set(match.patch, byBucket);
    }
  }

  for (const [patch, byBucket] of samplesByPatch) {
    for (const { bucket, from } of cumulativeEloBuckets) {
      const startIndex = rankedEloBuckets.indexOf(from);
      const sourceBuckets = rankedEloBuckets.slice(startIndex);
      const matchesById = new Map<string, AggregationMatch>();
      for (const sourceBucket of sourceBuckets) {
        for (const match of byBucket.get(sourceBucket) ?? []) {
          matchesById.set(match.matchId, { ...match, eloBucket: bucket });
        }
      }
      cohorts.set(`${patch}:${bucket}`, [...matchesById.values()]);
    }
  }

  let statsComputed = 0;
  for (const [key, matches] of cohorts) {
    const [patch, eloBucket] = key.split(":");
    const stats = aggregateChampionStats(matches, minimumGames);
    await prisma.$transaction(async (transaction) => {
      await transaction.championStat.deleteMany({
        where: { platform: "BR1", patch, eloBucket: eloBucket as EloBucket },
      });
      if (stats.length > 0) {
        await transaction.championStat.createMany({
          data: stats.map((stat) => ({
            platform: "BR1",
            ...stat,
            eloBucket: eloBucket as EloBucket,
            computedAt: new Date(),
          })),
        });
      }
    });
    statsComputed += stats.length;
  }

  return statsComputed;
}
