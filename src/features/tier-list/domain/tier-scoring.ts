import type { ChampionTier } from "./champion-entry";

export type TierScoreInput = {
  winRate: number;
  pickRate: number;
  banRate: number;
  kda: number;
  games: number;
};

const metricWeights = {
  winRate: 0.5,
  pickRate: 0.2,
  banRate: 0.2,
  kda: 0.1,
} as const;

const confidencePriorGames = 100;

function percentileRank(values: readonly number[], value: number): number {
  const lowerCount = values.filter((candidate) => candidate < value).length;
  const equalCount = values.filter((candidate) => candidate === value).length;
  return ((lowerCount + equalCount / 2) / values.length) * 100;
}

export function calculateTierScores(
  cohort: readonly TierScoreInput[],
): number[] {
  if (cohort.length === 0) return [];
  if (
    cohort.some(
      (entry) =>
        !Number.isInteger(entry.games) ||
        entry.games < 1 ||
        !Number.isFinite(entry.winRate) ||
        entry.winRate < 0 ||
        entry.winRate > 100 ||
        !Number.isFinite(entry.pickRate) ||
        entry.pickRate < 0 ||
        entry.pickRate > 100 ||
        !Number.isFinite(entry.banRate) ||
        entry.banRate < 0 ||
        entry.banRate > 100 ||
        !Number.isFinite(entry.kda) ||
        entry.kda < 0,
    )
  ) {
    throw new RangeError("Tier score inputs are outside their valid ranges.");
  }

  const percentiles = {
    winRate: cohort.map((entry) => entry.winRate),
    pickRate: cohort.map((entry) => entry.pickRate),
    banRate: cohort.map((entry) => entry.banRate),
    kda: cohort.map((entry) => entry.kda),
  };

  return cohort.map((entry) => {
    const relativeScore =
      percentileRank(percentiles.winRate, entry.winRate) *
        metricWeights.winRate +
      percentileRank(percentiles.pickRate, entry.pickRate) *
        metricWeights.pickRate +
      percentileRank(percentiles.banRate, entry.banRate) *
        metricWeights.banRate +
      percentileRank(percentiles.kda, entry.kda) * metricWeights.kda;
    const confidence =
      entry.games / (entry.games + confidencePriorGames);
    const score = 50 + (relativeScore - 50) * confidence;
    return Math.round(score * 100) / 100;
  });
}

export function tierFromScore(score: number): ChampionTier {
  if (score >= 90) return "S+";
  if (score >= 80) return "S";
  if (score >= 65) return "A";
  if (score >= 50) return "B";
  if (score >= 35) return "C";
  return "D";
}
