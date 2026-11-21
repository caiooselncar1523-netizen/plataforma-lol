import assert from "node:assert/strict";
import { test } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../../../src/server/db/client";
import { GET } from "../../../src/app/api/v1/tier-list/route";

test("tier-list endpoint rejects unsupported filters without caching errors", async () => {
  const cases = [
    "regiao=na",
    "funcao=carry",
    "elo=challenger",
    "patch=not-a-patch",
  ];

  for (const query of cases) {
    const response = await GET(
      new NextRequest(`http://localhost/api/v1/tier-list?${query}`),
    );
    assert.equal(response.status, 400, query);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.ok((await response.json()).error);
  }
});

test("CT-04 filters the champion list and compares official patch scores", async () => {
  const originalChampionStatFindMany = prisma.championStat.findMany;
  const originalMatchRecordFindMany = prisma.matchRecord.findMany;
  const originalMatchRecordFindFirst = prisma.matchRecord.findFirst;
  const originalMatchSampleFindMany = prisma.matchSample.findMany;
  const originalFetch = globalThis.fetch;
  const statQueries: Array<{
    eloBucket?: string;
    patch?: string | { in: string[] };
    role?: string;
  }> = [];
  const currentStats = [
    { championId: 1, score: 82, tier: "S" },
    { championId: 2, score: 68, tier: "A" },
    { championId: 3, score: 75, tier: "A" },
    { championId: 4, score: 55, tier: "B" },
  ];
  const previousStats = [
    { championId: 1, score: 76, tier: "A" },
    { championId: 2, score: 80, tier: "S" },
    { championId: 3, score: 75, tier: "A" },
  ];
  const stats = [...currentStats, ...previousStats].map((stat) => ({
    platform: "BR1",
    patch: currentStats.includes(stat) ? "16.23" : "16.22",
    eloBucket: "DIAMOND_PLUS",
    championKey: `Champion${stat.championId}`,
    role: "MID",
    winRate: 52,
    pickRate: 10,
    banRate: 5,
    kda: 2.5,
    games: 60,
    roleRate: 80,
    computedAt: new Date("2026-11-21T12:00:00Z"),
    ...stat,
  }));
  const patchStats = [
    { patch: "16.23", computedAt: new Date("2026-11-21T12:00:00Z") },
    { patch: "16.22", computedAt: new Date("2026-11-20T12:00:00Z") },
  ];
  const catalogData = Object.fromEntries(
    ["Annie", "Olaf", "Galio", "TwistedFate"].map((id, index) => [
      id,
      {
        key: String(index + 1),
        id,
        name: id,
        info: { difficulty: 4 },
      },
    ]),
  );

  prisma.championStat.findMany = (async (args: unknown) => {
    const query = args as {
      where: {
        eloBucket?: string;
        patch?: string | { in: string[] };
        role?: string;
      };
    };
    const requestedPatch = query.where.patch;
    if (!requestedPatch) return patchStats;
    statQueries.push(query.where);
    return stats.filter(
      (stat) =>
        stat.eloBucket === query.where.eloBucket &&
        stat.role === query.where.role &&
        (typeof requestedPatch === "string"
          ? stat.patch === requestedPatch
          : requestedPatch.in.includes(stat.patch)),
    );
  }) as typeof originalChampionStatFindMany;
  prisma.matchRecord.findMany = (async () => [
    { patch: "16.23" },
    { patch: "16.22" },
  ]) as typeof originalMatchRecordFindMany;
  prisma.matchRecord.findFirst = (async () => ({
    patch: "16.23",
  })) as typeof originalMatchRecordFindFirst;
  prisma.matchSample.findMany = (async () =>
    Array.from({ length: 60 }, (_, index) => ({ matchId: `match-${index}` }))) as typeof originalMatchSampleFindMany;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/api/versions.json")) {
      return Response.json(["16.23.1"]);
    }
    return Response.json({ data: catalogData });
  };

  try {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/v1/tier-list?regiao=br&elo=diamond&funcao=mid&patch=16.23",
      ),
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.meta.patch, "16.23");
    assert.deepEqual(body.meta.availablePatches, ["16.23", "16.22"]);
    assert.equal(body.meta.matchesInDatabase, 60);
    assert.deepEqual(
      statQueries.map(({ eloBucket, patch, role }) => ({
        eloBucket,
        patch,
        role,
      })),
      [
        {
          eloBucket: "DIAMOND_PLUS",
          patch: { in: ["16.23", "16.22"] },
          role: "MID",
        },
      ],
    );
    assert.deepEqual(
      body.data.map(
        (entry: { championId: string; role: string; tierChange?: string }) => ({
          championId: entry.championId,
          role: entry.role,
          tierChange: entry.tierChange,
        }),
      ),
      [
        { championId: "Annie", role: "MID", tierChange: "UP" },
        { championId: "Olaf", role: "MID", tierChange: "DOWN" },
        { championId: "Galio", role: "MID", tierChange: "SAME" },
        { championId: "TwistedFate", role: "MID", tierChange: undefined },
      ],
    );
  } finally {
    prisma.championStat.findMany = originalChampionStatFindMany;
    prisma.matchRecord.findMany = originalMatchRecordFindMany;
    prisma.matchRecord.findFirst = originalMatchRecordFindFirst;
    prisma.matchSample.findMany = originalMatchSampleFindMany;
    globalThis.fetch = originalFetch;
  }
});
