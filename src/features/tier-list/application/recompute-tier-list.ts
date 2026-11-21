import type { EloBucket } from "@prisma/client";
import { prisma } from "@/server/db/client";
import {
  cumulativeEloBuckets,
  rankedEloBuckets,
} from "../domain/elo-buckets";
import {
  aggregateChampionStats,
  type AggregationMatch,
  type AggregatedChampionStat,
} from "./aggregate-champion-stats";
import type { ChampionRole } from "../domain/champion-entry";

export type PersistedMatchSample = {
  eloBucket: EloBucket;
  match: {
    matchId: string;
    patch: string;
    participants: Array<{
      championId: number;
      championKey: string;
      role: ChampionRole;
      won: boolean;
      kills: number;
      deaths: number;
      assists: number;
    }>;
    bans: Array<{ championId: number }>;
  };
};

export type TierListStatsRepository = {
  findSamples(patches: readonly string[]): Promise<PersistedMatchSample[]>;
  replaceStats(
    patch: string,
    eloBucket: EloBucket,
    stats: readonly AggregatedChampionStat[],
  ): Promise<void>;
};

export function buildTierListCohorts(
  persistedSamples: readonly PersistedMatchSample[],
): Map<string, AggregationMatch[]> {
  const cohorts = new Map<string, AggregationMatch[]>();
  const samplesByPatch = new Map<string, Map<EloBucket, AggregationMatch[]>>();
  for (const sample of persistedSamples) {
    const match = sample.match;
    const key = `${match.patch}:${sample.eloBucket}`;
    const cohort = cohorts.get(key) ?? [];
    const aggregationMatch: AggregationMatch = {
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
    };
    cohort.push(aggregationMatch);
    cohorts.set(key, cohort);

    if (sample.eloBucket !== "ALL") {
      const byBucket = samplesByPatch.get(match.patch) ?? new Map();
      const bucketMatches = byBucket.get(sample.eloBucket) ?? [];
      bucketMatches.push(aggregationMatch);
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

  return cohorts;
}

const prismaRepository: TierListStatsRepository = {
  async findSamples(patches) {
    const samples = await prisma.matchSample.findMany({
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

    return samples.map(({ eloBucket, match }) => ({
      eloBucket,
      match: {
        matchId: match.matchId,
        patch: match.patch,
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
      },
    }));
  },
  async replaceStats(patch, eloBucket, stats) {
    await prisma.$transaction(async (transaction) => {
      await transaction.championStat.deleteMany({
        where: { platform: "BR1", patch, eloBucket },
      });
      if (stats.length > 0) {
        await transaction.championStat.createMany({
          data: stats.map((stat) => ({
            platform: "BR1",
            ...stat,
            eloBucket,
            computedAt: new Date(),
          })),
        });
      }
    });
  },
};

export async function recomputeTierListStats(
  patches: readonly string[],
  minimumGames: number,
  repository: TierListStatsRepository = prismaRepository,
): Promise<number> {
  if (patches.length === 0) return 0;

  const persistedSamples = await repository.findSamples(patches);
  const cohorts = buildTierListCohorts(persistedSamples);
  let statsComputed = 0;
  for (const [key, matches] of cohorts) {
    const [patch, eloBucket] = key.split(":");
    if (!patch || !eloBucket) {
      throw new Error(`Invalid tier-list cohort key: ${key}.`);
    }
    const stats = aggregateChampionStats(matches, minimumGames);
    await repository.replaceStats(
      patch,
      eloBucket as EloBucket,
      stats,
    );
    statsComputed += stats.length;
  }

  return statsComputed;
}
