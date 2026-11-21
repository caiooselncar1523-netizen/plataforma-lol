import assert from "node:assert/strict";
import { test } from "vitest";
import { chooseRankedPlayers } from "../../../src/features/tier-list/application/choose-ranked-players";

test("selects never-sampled players before recently sampled players in each bucket", () => {
  const playersByBucket = new Map([
    ["GOLD", ["gold-1", "gold-2"]],
    ["DIAMOND", ["diamond-1", "diamond-2"]],
  ]);
  const recentlySampled = new Map([
    ["gold-1", new Date("2026-11-20T10:00:00Z")],
    ["diamond-1", new Date("2026-11-20T10:00:00Z")],
  ]);

  assert.deepEqual(
    chooseRankedPlayers(
      playersByBucket,
      ["GOLD", "DIAMOND"],
      2,
      recentlySampled,
    ),
    [
      { puuid: "gold-2", eloBucket: "GOLD" },
      { puuid: "diamond-2", eloBucket: "DIAMOND" },
    ],
  );
});

test("rotates to older samples and does not select a player twice across buckets", () => {
  const playersByBucket = new Map([
    ["GOLD", ["shared", "gold-2"]],
    ["DIAMOND", ["shared", "diamond-2"]],
  ]);
  const lastSampledAt = new Map([
    ["shared", new Date("2026-11-20T10:00:00Z")],
    ["gold-2", new Date("2026-11-20T09:00:00Z")],
    ["diamond-2", new Date("2026-11-20T09:00:00Z")],
  ]);

  assert.deepEqual(
    chooseRankedPlayers(
      playersByBucket,
      ["GOLD", "DIAMOND"],
      3,
      lastSampledAt,
    ),
    [
      { puuid: "gold-2", eloBucket: "GOLD" },
      { puuid: "diamond-2", eloBucket: "DIAMOND" },
      { puuid: "shared", eloBucket: "GOLD" },
    ],
  );
});
