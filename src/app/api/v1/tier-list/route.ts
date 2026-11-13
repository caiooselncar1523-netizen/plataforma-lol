import { NextRequest } from "next/server";
import type { EloBucket } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { getChampionCatalog } from "@/server/riot/data-dragon";
import { aggregateChampionStats } from "@/features/tier-list/application/aggregate-champion-stats";
import type { ChampionRole } from "@/features/tier-list/domain/champion-entry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const roleValues: Record<string, ChampionRole> = {
  top: "TOP",
  jungle: "JUNGLE",
  mid: "MID",
  adc: "ADC",
  support: "SUPPORT",
};

const eloValues: Record<string, string> = {
  iron: "IRON",
  bronze: "BRONZE",
  silver: "SILVER",
  gold: "GOLD",
  platinum: "PLATINUM",
  emerald: "EMERALD",
  diamond: "DIAMOND",
  master: "MASTER_PLUS",
};

type CachedResponse = {
  expiresAt: number;
  body: unknown;
};

const responseCache = new Map<string, CachedResponse>();
const cacheDurationMs = 5 * 60 * 1000;

function comparePatchesDescending(left: string, right: string): number {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference =
      (rightParts[index] ?? 0) - (leftParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

function preliminaryJsonResponse(body: unknown): Response {
  return Response.json(body, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const roleFilter = params.get("funcao")?.toLowerCase() ?? "all";
  const eloFilter = params.get("elo")?.toLowerCase() ?? "all";
  const region = params.get("regiao")?.toLowerCase() ?? "br";
  const requestedPatch = params.get("patch");
  const preliminary = params.get("amostra") === "preliminar";

  if (region !== "br") {
    return jsonResponse({ error: "Only the BR region is available." }, 400);
  }
  if (roleFilter !== "all" && !roleValues[roleFilter]) {
    return jsonResponse({ error: "Invalid role filter." }, 400);
  }
  if (eloFilter !== "all" && !eloValues[eloFilter]) {
    return jsonResponse({ error: "Invalid elo filter." }, 400);
  }
  if (requestedPatch && !/^\d{1,3}\.\d{1,3}$/.test(requestedPatch)) {
    return jsonResponse({ error: "Invalid patch format." }, 400);
  }
  if (preliminary && process.env.NODE_ENV === "production") {
    return jsonResponse(
      { error: "Preliminary match samples are available only in development." },
      404,
    );
  }

  try {
    const patches = await prisma.championStat.findMany({
      where: {
        platform: "BR1",
        eloBucket:
          eloFilter === "all"
            ? "ALL"
            : (eloValues[eloFilter] as EloBucket),
      },
      select: { patch: true, computedAt: true },
      orderBy: { computedAt: "desc" },
    });
    const matchPatches = await prisma.matchRecord.findMany({
      where: { platform: "BR1", queueId: 420 },
      select: { patch: true },
      distinct: ["patch"],
    });
    const availablePatches = [
      ...new Set([
        ...patches.map(({ patch }) => patch),
        ...matchPatches.map(({ patch }) => patch),
      ]),
    ].sort(comparePatchesDescending);
    const latestMatch = requestedPatch
      ? null
      : await prisma.matchRecord.findFirst({
          where: {
            platform: "BR1",
            queueId: 420,
            samples: {
              some: {
                eloBucket:
                  eloFilter === "all"
                    ? "ALL"
                    : (eloValues[eloFilter] as EloBucket),
              },
            },
          },
          orderBy: { startedAt: "desc" },
          select: { patch: true },
        });
    const patch = requestedPatch ?? latestMatch?.patch ?? availablePatches[0];
    if (!patch) {
      return jsonResponse({
        data: [],
        meta: {
          region: "br",
          patch: null,
          elo: eloFilter,
          source: "riot",
          message: "No Riot match data has been collected yet.",
        },
      });
    }

    const cacheKey = `${region}:${patch}:${eloFilter}:${roleFilter}`;
    const cached = preliminary ? undefined : responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return jsonResponse(cached.body);
    }

    if (preliminary) {
      const sampleMatches = await prisma.matchSample.findMany({
        where: {
          eloBucket:
            eloFilter === "all" ? "ALL" : (eloValues[eloFilter] as EloBucket),
          match: { is: { platform: "BR1", patch, queueId: 420 } },
        },
        include: {
          match: {
            include: { participants: true, bans: true },
          },
        },
      });
      const aggregateInput = sampleMatches.map(({ eloBucket, match }) => ({
        matchId: match.matchId,
        patch: match.patch,
        eloBucket,
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
      }));
      const minGames = Number(process.env.RIOT_MIN_CHAMPION_GAMES ?? 50);
      if (!Number.isInteger(minGames) || minGames < 1) {
        throw new Error("RIOT_MIN_CHAMPION_GAMES must be a positive integer.");
      }
      const previewStats = aggregateChampionStats(aggregateInput, 1).filter(
        (stat) => roleFilter === "all" || stat.role === roleValues[roleFilter],
      );
      const championCatalog = await getChampionCatalog();
      const data = previewStats.map((stat) => {
        const champion = championCatalog.get(stat.championId);
        if (!champion) {
          throw new Error(
            `Champion ${stat.championId} is not present in the current Data Dragon catalog.`,
          );
        }
        return {
          championId: champion.championKey,
          name: champion.name,
          englishName: champion.englishName,
          role: stat.role,
          tier: stat.tier,
          score: stat.score,
          winRate: stat.winRate,
          pickRate: stat.pickRate,
          banRate: stat.banRate,
          kda: stat.kda,
          games: stat.games,
          roleRate: stat.roleRate,
          lowSample: stat.games < minGames,
          difficulty: champion.difficulty,
        };
      });

      return preliminaryJsonResponse({
        data,
        meta: {
          region: "br",
          patch,
          availablePatches,
          elo: eloFilter,
          source: "riot",
          preliminary: true,
          minimumGames: minGames,
          eloMethod:
            "The elo bucket is based on the sampled ranked player's current league tier; it is an approximation for match participants.",
          message:
            "Development preview only: every score and tier is provisional and based on an incomplete sample.",
          matchesInDatabase: sampleMatches.length,
        },
      });
    }

    const patchIndex = availablePatches.indexOf(patch);
    const previousPatch =
      patchIndex >= 0 ? availablePatches[patchIndex + 1] : undefined;
    const stats = await prisma.championStat.findMany({
      where: {
        platform: "BR1",
        patch: { in: previousPatch ? [patch, previousPatch] : [patch] },
        eloBucket:
          eloFilter === "all"
            ? "ALL"
            : (eloValues[eloFilter] as EloBucket),
        ...(roleFilter === "all" ? {} : { role: roleValues[roleFilter] }),
      },
      orderBy: [{ score: "desc" }, { games: "desc" }],
    });
    const championCatalog = await getChampionCatalog();
    const currentStats = stats.filter((stat) => stat.patch === patch);
    const previousByKey = new Map(
      stats
        .filter((stat) => stat.patch === previousPatch)
        .map((stat) => [
          `${stat.championId}:${stat.role}:${stat.eloBucket}`,
          stat,
        ]),
    );

    const data = currentStats.map((stat) => {
      const champion = championCatalog.get(stat.championId);
      if (!champion) {
        throw new Error(
          `Champion ${stat.championId} is not present in the current Data Dragon catalog.`,
        );
      }
      const previous = previousByKey.get(
        `${stat.championId}:${stat.role}:${stat.eloBucket}`,
      );
      const tierChange =
        previous === undefined || Math.abs(stat.score - previous.score) < 0.01
          ? previous === undefined
            ? undefined
            : "SAME"
          : stat.score > previous.score
            ? "UP"
            : "DOWN";

      return {
        championId: champion.championKey,
        name: champion.name,
        englishName: champion.englishName,
        role: stat.role,
        tier: stat.tier,
        score: stat.score,
        winRate: stat.winRate,
        pickRate: stat.pickRate,
        banRate: stat.banRate,
        kda: stat.kda,
        games: stat.games,
        roleRate: stat.roleRate,
        tierChange,
        difficulty: champion.difficulty,
      };
    });
    const matchesInDatabase = await prisma.matchSample.count({
      where: {
        eloBucket:
          eloFilter === "all"
            ? "ALL"
            : (eloValues[eloFilter] as EloBucket),
        match: { platform: "BR1", patch, queueId: 420 },
      },
    });

    const body = {
      data,
      meta: {
        region: "br",
        patch,
        availablePatches,
        elo: eloFilter,
        source: "riot",
        eloMethod:
          "The elo bucket is based on the sampled ranked player's current league tier; it is an approximation for match participants.",
        ...(currentStats.length === 0
          ? {
              message:
                "The collected sample has not reached the minimum games and champion diversity required to rank this role yet.",
            }
          : {}),
        generatedAt: currentStats[0]?.computedAt.toISOString() ?? null,
        matchesInDatabase,
      },
    };
    responseCache.set(cacheKey, {
      expiresAt: Date.now() + cacheDurationMs,
      body,
    });
    if (responseCache.size > 100) {
      const oldestKey = responseCache.keys().next().value;
      if (oldestKey) responseCache.delete(oldestKey);
    }
    return jsonResponse(body);
  } catch (error) {
    console.error("Failed to load tier-list statistics.", error);
    return jsonResponse({ error: "Tier-list data is temporarily unavailable." }, 503);
  }
}
