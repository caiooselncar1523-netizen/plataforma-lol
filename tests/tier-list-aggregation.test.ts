import assert from "node:assert/strict";
import test from "node:test";
import { aggregateChampionStats } from "../src/features/tier-list/application/aggregate-champion-stats";
import {
  calculateTierScores,
  tierFromScore,
} from "../src/features/tier-list/domain/tier-scoring";
import type { ChampionRole } from "../src/features/tier-list/domain/champion-entry";

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

test("aggregates rates, bans, role share, KDA and minimum sample size", () => {
  const matches = [
    ...Array.from({ length: 10 }, (_, index) =>
      makeMatch(String(index + 1), index === 9 ? "MID" : "TOP", index !== 9),
    ),
  ];
  const stats = aggregateChampionStats([...matches, matches[0]], 2);

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
