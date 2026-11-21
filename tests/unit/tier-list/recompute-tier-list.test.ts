import assert from "node:assert/strict";
import { test } from "vitest";
import {
  buildTierListCohorts,
  recomputeTierListStats,
  type PersistedMatchSample,
  type TierListStatsRepository,
} from "../../../src/features/tier-list/application/recompute-tier-list";

function makeSample(
  matchId: string,
  eloBucket: PersistedMatchSample["eloBucket"],
): PersistedMatchSample {
  return {
    eloBucket,
    match: {
      matchId,
      patch: "16.23",
      participants: [
        {
          championId: 1,
          championKey: "Annie",
          role: "MID",
          won: true,
          kills: 4,
          deaths: 2,
          assists: 6,
        },
      ],
      bans: [{ championId: 1 }],
    },
  };
}

test("builds cumulative elo cohorts without counting a match twice", () => {
  const cohorts = buildTierListCohorts([
    makeSample("diamond-match", "ALL"),
    makeSample("diamond-match", "DIAMOND"),
    makeSample("diamond-match", "MASTER_PLUS"),
    makeSample("another-diamond-match", "ALL"),
    makeSample("another-diamond-match", "DIAMOND"),
  ]);

  assert.deepEqual(
    cohorts.get("16.23:DIAMOND_PLUS")?.map(({ matchId }) => matchId).sort(),
    ["another-diamond-match", "diamond-match"],
  );
  assert.deepEqual(
    cohorts.get("16.23:MASTER_PLUS")?.map(({ matchId }) => matchId),
    ["diamond-match"],
  );
  assert.equal(cohorts.get("16.23:ALL")?.length, 2);
});

test("recomputes and replaces stats for each raw and cumulative cohort", async () => {
  const participants = [1, 2, 3, 4, 5].map((championId) => ({
    championId,
    championKey: `Champion${championId}`,
    role: "MID" as const,
    won: championId % 2 === 0,
    kills: championId,
    deaths: 2,
    assists: 3,
  }));
  const samples: PersistedMatchSample[] = Array.from(
    { length: 50 },
    (_, index) => {
      const match = {
        matchId: `match-${index}`,
        patch: "16.23",
        participants,
        bans: [{ championId: 1 }],
      };
      return [
        { eloBucket: "ALL" as const, match },
        { eloBucket: "DIAMOND" as const, match },
      ];
    },
  ).flat();
  const writes: Array<{
    patch: string;
    bucket: PersistedMatchSample["eloBucket"];
    stats: number;
  }> = [];
  const repository: TierListStatsRepository = {
    async findSamples(patches) {
      assert.deepEqual(patches, ["16.23"]);
      return samples;
    },
    async replaceStats(patch, bucket, stats) {
      writes.push({ patch, bucket, stats: stats.length });
    },
  };

  const statsComputed = await recomputeTierListStats(
    ["16.23"],
    50,
    repository,
  );

  assert.equal(statsComputed, 40);
  assert.equal(writes.length, 8);
  assert.ok(writes.every(({ patch }) => patch === "16.23"));
  assert.deepEqual(
    writes
      .filter(({ stats }) => stats === 5)
      .map(({ bucket }) => bucket)
      .sort(),
    [
      "ALL",
      "BRONZE_PLUS",
      "DIAMOND",
      "DIAMOND_PLUS",
      "EMERALD_PLUS",
      "GOLD_PLUS",
      "PLATINUM_PLUS",
      "SILVER_PLUS",
    ],
  );
});
