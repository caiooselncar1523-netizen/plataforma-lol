import type { RiotId } from "@/features/player-search/domain/riot-id";

type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

type RiotSummoner = {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
};

type RiotLeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

export type PlayerRankedEntry = {
  queueType: string;
  tier: string;
  division: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

export type PlayerProfileSnapshot = {
  puuid: string;
  platform: "BR1";
  gameName: string;
  tagLine: string;
  profileIconId: number;
  summonerLevel: number;
  rankedEntries: PlayerRankedEntry[];
};

export interface PlayerProfileRiotClient {
  get<T>(url: string): Promise<T>;
}

export interface PlayerProfileRepository {
  save(profile: PlayerProfileSnapshot): Promise<void>;
}

const accountRouting = "https://americas.api.riotgames.com";
const platformRouting = "https://br1.api.riotgames.com";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0;
}

function parseAccount(value: unknown): RiotAccount {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.puuid) ||
    !isNonEmptyString(value.gameName) ||
    !isNonEmptyString(value.tagLine)
  ) {
    throw new Error("Riot account response is missing required fields.");
  }

  return {
    puuid: value.puuid,
    gameName: value.gameName,
    tagLine: value.tagLine,
  };
}

function parseSummoner(value: unknown): RiotSummoner {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.puuid) ||
    !isNonNegativeInteger(value.profileIconId) ||
    !isNonNegativeInteger(value.summonerLevel)
  ) {
    throw new Error("Riot summoner response is missing required fields.");
  }

  return {
    puuid: value.puuid,
    profileIconId: value.profileIconId,
    summonerLevel: value.summonerLevel,
  };
}

function parseLeagueEntries(value: unknown): PlayerRankedEntry[] {
  if (!Array.isArray(value)) {
    throw new Error("Riot league response must be an array.");
  }

  return value.map((entry: unknown) => {
    if (
      !isRecord(entry) ||
      !isNonEmptyString(entry.queueType) ||
      !isNonEmptyString(entry.tier) ||
      !isNonEmptyString(entry.rank) ||
      !isNonNegativeInteger(entry.leaguePoints) ||
      !isNonNegativeInteger(entry.wins) ||
      !isNonNegativeInteger(entry.losses)
    ) {
      throw new Error("Riot league entry is missing required fields.");
    }

    return {
      queueType: entry.queueType,
      tier: entry.tier,
      division: entry.rank,
      leaguePoints: entry.leaguePoints,
      wins: entry.wins,
      losses: entry.losses,
    };
  });
}

export async function collectPlayerProfile(
  riotId: RiotId,
  riot: PlayerProfileRiotClient,
  repository: PlayerProfileRepository,
): Promise<PlayerProfileSnapshot> {
  const account = parseAccount(
    await riot.get<unknown>(
      `${accountRouting}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(riotId.gameName)}/${encodeURIComponent(riotId.tagLine)}`,
    ),
  );
  const summoner = parseSummoner(
    await riot.get<unknown>(
      `${platformRouting}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(account.puuid)}`,
    ),
  );
  if (summoner.puuid !== account.puuid) {
    throw new Error("Riot account and summoner PUUIDs do not match.");
  }

  const rankedEntries = parseLeagueEntries(
    await riot.get<unknown>(
      `${platformRouting}/lol/league/v4/entries/by-puuid/${encodeURIComponent(account.puuid)}`,
    ),
  );
  const profile: PlayerProfileSnapshot = {
    puuid: account.puuid,
    platform: "BR1",
    gameName: account.gameName,
    tagLine: account.tagLine,
    profileIconId: summoner.profileIconId,
    summonerLevel: summoner.summonerLevel,
    rankedEntries,
  };

  await repository.save(profile);
  return profile;
}
