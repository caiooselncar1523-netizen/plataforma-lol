import { prisma } from "@/server/db/client";
import { RiotApiClient } from "@/server/riot/client";
import type { ChampionRole } from "../domain/champion-entry";
import { recomputeTierListStats } from "./recompute-tier-list";

type LeagueEntry = {
  puuid: string;
  tier?: string;
};

type LeagueResponse = {
  entries?: LeagueEntry[];
};

type MatchList = {
  info: {
    gameDuration: number;
    gameVersion: string;
    gameStartTimestamp: number;
    queueId: number;
    participants: Array<{
      puuid: string;
      championId: number;
      championName: string;
      teamPosition?: string;
      individualPosition?: string;
      win: boolean;
      kills: number;
      deaths: number;
      assists: number;
      teamId: number;
    }>;
    teams: Array<{
      teamId: number;
      bans: Array<{ championId: number }>;
    }>;
  };
};

const queue = "RANKED_SOLO_5x5";
const divisions = ["I", "II", "III", "IV"];
const rankedTiers = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
] as const;
const bucketOrder = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER_PLUS",
] as const;
type EloBucket = "ALL" | (typeof bucketOrder)[number];

const regionPlatform = "https://br1.api.riotgames.com";
const regionRouting = "https://americas.api.riotgames.com";

function readPositiveInteger(name: string, fallback: number, maximum: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1) return fallback;
  return Math.min(value, maximum);
}

function eloBucketForTier(tier: string): EloBucket {
  return tier === "IRON" ||
    tier === "BRONZE" ||
    tier === "SILVER" ||
    tier === "GOLD" ||
    tier === "PLATINUM" ||
    tier === "EMERALD" ||
    tier === "DIAMOND"
    ? tier
    : "MASTER_PLUS";
}

function normalizeRole(...positions: Array<string | undefined>): ChampionRole | null {
  for (const position of positions) {
    switch (position) {
      case "TOP":
        return "TOP";
      case "JUNGLE":
        return "JUNGLE";
      case "MIDDLE":
        return "MID";
      case "BOTTOM":
        return "ADC";
      case "UTILITY":
        return "SUPPORT";
    }
  }
  return null;
}

function patchFromVersion(version: string): string | null {
  const match = /^(\d+)\.(\d+)\./.exec(version);
  return match ? `${match[1]}.${match[2]}` : null;
}

async function loadRankedPlayers(
  riot: RiotApiClient,
): Promise<Map<EloBucket, string[]>> {
  const players = new Map<EloBucket, string[]>(
    bucketOrder.map((bucket) => [bucket, []]),
  );
  const addEntries = (bucket: EloBucket, entries: LeagueEntry[] | undefined) => {
    if (!entries) return;
    const current = players.get(bucket)!;
    for (const entry of entries) {
      if (entry.puuid && !current.includes(entry.puuid)) current.push(entry.puuid);
    }
  };

  for (const tier of rankedTiers) {
    for (const division of divisions) {
      const entries = await riot.get<LeagueEntry[]>(
        `${regionPlatform}/lol/league/v4/entries/${queue}/${tier}/${division}?page=1`,
      );
      addEntries(eloBucketForTier(tier), entries);
    }
  }

  for (const tier of ["master", "grandmaster", "challenger"] as const) {
    const response = await riot.get<LeagueResponse>(
      `${regionPlatform}/lol/league/v4/${tier}leagues/by-queue/${queue}`,
    );
    addEntries("MASTER_PLUS", response.entries);
  }

  return players;
}

function choosePlayers(
  playersByBucket: Map<EloBucket, string[]>,
  maximum: number,
): Array<{ puuid: string; eloBucket: EloBucket }> {
  const selected: Array<{ puuid: string; eloBucket: EloBucket }> = [];
  const offsets = new Map<EloBucket, number>();

  while (selected.length < maximum) {
    let addedInRound = false;
    for (const bucket of bucketOrder) {
      if (selected.length >= maximum) break;
      const candidates = playersByBucket.get(bucket) ?? [];
      const offset = offsets.get(bucket) ?? 0;
      const puuid = candidates[offset];
      if (!puuid) continue;
      selected.push({ puuid, eloBucket: bucket });
      offsets.set(bucket, offset + 1);
      addedInRound = true;
    }
    if (!addedInRound) break;
  }

  return selected;
}

export async function collectTierList(): Promise<{
  playersSampled: number;
  matchesStored: number;
  statsComputed: number;
}> {
  const riot = new RiotApiClient();
  const maxPlayers = readPositiveInteger("RIOT_COLLECTION_MAX_PLAYERS", 8, 80);
  const matchesPerPlayer = readPositiveInteger(
    "RIOT_COLLECTION_MATCHES_PER_PLAYER",
    3,
    10,
  );
  const minimumGames = readPositiveInteger("RIOT_MIN_CHAMPION_GAMES", 50, 1000);
  const playersByBucket = await loadRankedPlayers(riot);
  const selectedPlayers = choosePlayers(playersByBucket, maxPlayers);
  if (selectedPlayers.length === 0) {
    throw new Error("Riot did not return ranked player PUUIDs for BR1.");
  }
  await prisma.$transaction(
    selectedPlayers.map(({ puuid, eloBucket }) =>
      prisma.rankedPlayerSample.upsert({
        where: { puuid },
        create: { puuid, platform: "BR1", eloBucket },
        update: { eloBucket, lastSampledAt: new Date() },
      }),
    ),
  );

  const sampleByMatch = new Map<string, { eloBucket: EloBucket; match: MatchList }>();
  const matchSamples = new Map<string, Set<EloBucket>>();
  for (const player of selectedPlayers) {
    const ids = await riot.get<string[]>(
      `${regionRouting}/lol/match/v5/matches/by-puuid/${encodeURIComponent(player.puuid)}/ids?start=0&count=${matchesPerPlayer}&queue=420`,
    );
    for (const matchId of ids) {
      const samples = matchSamples.get(matchId) ?? new Set<EloBucket>();
      samples.add(player.eloBucket);
      samples.add("ALL");
      matchSamples.set(matchId, samples);
      if (sampleByMatch.has(matchId)) continue;

      const match = await riot.get<MatchList>(
        `${regionRouting}/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
      );
      if (match.info.queueId === 420) {
        sampleByMatch.set(matchId, { eloBucket: player.eloBucket, match });
      }
    }
  }

  const changedPatches = new Set<string>();
  let matchesStored = 0;
  for (const [matchId, { match }] of sampleByMatch) {
    const patch = patchFromVersion(match.info.gameVersion);
    if (!patch || match.info.participants.length !== 10) continue;
    changedPatches.add(patch);

    const participants = match.info.participants
      .filter((participant) => participant.puuid && participant.championId > 0)
      .map((participant) => ({
        puuid: participant.puuid,
        championId: participant.championId,
        championKey: participant.championName,
        role: normalizeRole(
          participant.teamPosition,
          participant.individualPosition,
        ),
        won: participant.win,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
      }));
    const storedParticipants = participants.flatMap((participant) =>
      participant.role
        ? [{ ...participant, role: participant.role, matchId }]
        : [],
    );
    const bans = match.info.teams.flatMap((team) =>
      team.bans
        .filter((ban) => ban.championId > 0)
        .map((ban) => ({ teamId: team.teamId, championId: ban.championId })),
    );
    const samples = matchSamples.get(matchId) ?? new Set([sampleByMatch.get(matchId)!.eloBucket]);

    await prisma.$transaction(async (transaction) => {
      await transaction.matchRecord.upsert({
        where: { matchId },
        update: {},
        create: {
          matchId,
          platform: "BR1",
          queueId: match.info.queueId,
          gameVersion: match.info.gameVersion,
          patch,
          startedAt: new Date(match.info.gameStartTimestamp),
          durationSeconds: match.info.gameDuration,
        },
      });
      await transaction.matchParticipant.createMany({
        data: storedParticipants,
        skipDuplicates: true,
      });
      await transaction.matchBan.createMany({
        data: bans.map((ban) => ({ matchId, ...ban })),
        skipDuplicates: true,
      });
      await transaction.matchSample.createMany({
        data: [...samples].map((eloBucket) => ({ matchId, eloBucket })),
        skipDuplicates: true,
      });
    });
    matchesStored += 1;
  }

  const statsComputed = await recomputeTierListStats(
    [...changedPatches],
    minimumGames,
  );

  return {
    playersSampled: selectedPlayers.length,
    matchesStored,
    statsComputed,
  };
}
