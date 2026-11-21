import assert from "node:assert/strict";
import { test } from "vitest";
import { aggregateChampionStats } from "../../../src/features/tier-list/application/aggregate-champion-stats";
import {
  calculateTierScores,
  tierFromScore,
} from "../../../src/features/tier-list/domain/tier-scoring";
import { sourceBucketsForEloBucket } from "../../../src/features/tier-list/domain/elo-buckets";
import type { ChampionRole } from "../../../src/features/tier-list/domain/champion-entry";

const roles: ChampionRole[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

function makeMatch(
  matchId: string,
  aatroxRole: ChampionRole,
  aatroxWon: boolean,
) {
  const matchNumber = Number(matchId);
  return {
    matchId,
    patch: "16.22",
    eloBucket: "GOLD",
    participants: Array.from({ length: 10 }, (_, index) => {
      const isAatrox = index === 0;
      return {
        championId:
          isAatrox
            ? 266
            : index === 1
              ? 1001 + Math.floor((matchNumber - 1) / 2)
              : 1000 + index,
        championKey:
          isAatrox
            ? "Aatrox"
            : index === 1
              ? `Top${Math.floor((matchNumber - 1) / 2)}`
              : `Champion${index}`,
        role: isAatrox ? aatroxRole : roles[(index - 1) % roles.length],
        won: isAatrox ? aatroxWon : index < 5,
        kills: isAatrox ? 3 : 1,
        deaths: isAatrox ? 2 : 2,
        assists: isAatrox ? 4 : 1,
      };
    }),
    bans:
      matchId === "1" || matchId === "2"
        ? [{ championId: 266 }, { championId: 266 }]
        : [],
  };
}

test("scores champions by role-cohort percentiles and shrinks low-sample scores", () => {
  assert.deepEqual(
    calculateTierScores([
      { winRate: 50, pickRate: 10, banRate: 5, kda: 2, games: 1 },
      { winRate: 50, pickRate: 10, banRate: 5, kda: 2, games: 100 },
    ]),
    [50, 50],
  );
  const scores = calculateTierScores([
    { winRate: 40, pickRate: 5, banRate: 2, kda: 1, games: 1000 },
    { winRate: 50, pickRate: 10, banRate: 5, kda: 2, games: 1000 },
    { winRate: 60, pickRate: 20, banRate: 10, kda: 4, games: 1000 },
  ]);
  assert.deepEqual(scores, [19.7, 50, 80.3]);
  assert.deepEqual(
    [90, 80, 65, 50, 35, 34.99].map(tierFromScore),
    ["S+", "S", "A", "B", "C", "D"],
  );

  const confidenceScores = calculateTierScores([
    { winRate: 40, pickRate: 5, banRate: 2, kda: 1, games: 1 },
    { winRate: 60, pickRate: 20, banRate: 10, kda: 4, games: 1000 },
  ]);
  assert.ok(Math.abs((confidenceScores[0] ?? 50) - 50) < 1);
  assert.ok((confidenceScores[1] ?? 50) > 70);
});

test("applies the documented metric weights to isolated percentile changes", () => {
  const scorePair = (
    metric: "winRate" | "pickRate" | "banRate" | "kda",
    lower: number,
    higher: number,
  ) => {
    const baseline = {
      winRate: 50,
      pickRate: 10,
      banRate: 5,
      kda: 2,
      games: 1000,
    };
    return calculateTierScores([
      { ...baseline, [metric]: lower },
      { ...baseline, [metric]: higher },
    ]);
  };

  assert.deepEqual(scorePair("winRate", 40, 60), [38.64, 61.36]);
  assert.deepEqual(scorePair("pickRate", 10, 20), [45.45, 54.55]);
  assert.deepEqual(scorePair("banRate", 5, 15), [45.45, 54.55]);
  assert.deepEqual(scorePair("kda", 1, 3), [47.73, 52.27]);
});

test("aggregates rates, bans, role share, KDA and minimum sample size", () => {
  const matches = [
    ...Array.from({ length: 10 }, (_, index) =>
      makeMatch(String(index + 1), index === 9 ? "MID" : "TOP", index !== 9),
    ),
  ];
  const stats = aggregateChampionStats(
    [...matches, matches[0], { ...matches[0], eloBucket: "MASTER_PLUS" }],
    2,
  );

  const top = stats.find((stat) => stat.championId === 266 && stat.role === "TOP");
  assert.ok(top);
  assert.equal(top.games, 9);
  assert.equal(top.winRate, 100);
  assert.equal(top.pickRate, 90);
  assert.equal(top.banRate, 20);
  assert.equal(top.kda, 3.5);
  assert.equal(top.roleRate, 90);
  assert.equal(top.patch, "16.22");
  assert.equal(top.eloBucket, "GOLD");
  assert.deepEqual(
    aggregateChampionStats(matches, 2)
      .filter((stat) => stat.championId === 266)
      .map((stat) => stat.role),
    ["TOP"],
  );
  assert.deepEqual(aggregateChampionStats(matches, 5), []);
});

test("produces official candidates at the 50-game minimum only with role diversity", () => {
  const championIds = [1, 2, 3, 4, 5];
  const matches = Array.from({ length: 50 }, (_, index) => ({
    matchId: `minimum-${index}`,
    patch: "16.23",
    eloBucket: "DIAMOND",
    participants: championIds.map((championId) => ({
      championId,
      championKey: `Champion${championId}`,
      role: "MID" as const,
      won: championId % 2 === 0,
      kills: championId,
      deaths: 2,
      assists: 3,
    })),
    bans: [{ championId: 1 }],
  }));
  const stats = aggregateChampionStats(matches, 50);

  assert.equal(stats.length, 5);
  assert.ok(stats.every((stat) => stat.games === 50));
  assert.ok(stats.every((stat) => stat.role === "MID"));
  assert.ok(stats.every((stat) => stat.patch === "16.23"));
  assert.ok(stats.every((stat) => stat.eloBucket === "DIAMOND"));
  assert.deepEqual(aggregateChampionStats(matches.slice(0, 49), 50), []);
  assert.deepEqual(aggregateChampionStats(matches, 51), []);
});

test("averages per-match KDA and uses one as the minimum death denominator", () => {
  const matches = Array.from({ length: 10 }, (_, index) =>
    makeMatch(String(index + 1), "TOP", true),
  );
  const firstParticipant = matches[0]?.participants[0];
  const secondParticipant = matches[1]?.participants[0];
  assert.ok(firstParticipant);
  assert.ok(secondParticipant);
  firstParticipant.kills = 10;
  firstParticipant.deaths = 0;
  firstParticipant.assists = 0;
  secondParticipant.kills = 0;
  secondParticipant.deaths = 10;
  secondParticipant.assists = 0;

  const aatrox = aggregateChampionStats(matches, 2).find(
    (stat) => stat.championId === 266 && stat.role === "TOP",
  );

  assert.ok(aatrox);
  assert.equal(aatrox.kda, 3.8);
});

test("cumulative elo filters include the selected rank and every higher rank", () => {
  assert.deepEqual(sourceBucketsForEloBucket("ALL"), ["ALL"]);
  assert.deepEqual(sourceBucketsForEloBucket("BRONZE_PLUS"), [
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "EMERALD",
    "DIAMOND",
    "MASTER_PLUS",
  ]);
  assert.deepEqual(sourceBucketsForEloBucket("DIAMOND_PLUS"), [
    "DIAMOND",
    "MASTER_PLUS",
  ]);
  assert.deepEqual(sourceBucketsForEloBucket("MASTER_PLUS"), ["MASTER_PLUS"]);
});

test("rejects a non-positive minimum sample size", () => {
  assert.throws(() => aggregateChampionStats([], 0), RangeError);
  assert.throws(
    () => calculateTierScores([
      { winRate: 50, pickRate: 10, banRate: 5, kda: 2, games: 0 },
    ]),
    RangeError,
  );
  assert.throws(
    () => calculateTierScores([
      { winRate: Number.NaN, pickRate: 10, banRate: 5, kda: 2, games: 1 },
    ]),
    RangeError,
  );
});
