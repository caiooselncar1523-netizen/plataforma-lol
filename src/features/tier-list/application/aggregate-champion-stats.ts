import type { ChampionRole } from "../domain/champion-entry";
import { calculateTierScores, tierFromScore } from "../domain/tier-scoring";

export type AggregationParticipant = {
  championId: number;
  championKey: string;
  role: ChampionRole | null;
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
};

export type AggregationMatch = {
  matchId: string;
  patch: string;
  eloBucket: string;
  participants: readonly AggregationParticipant[];
  bans: readonly { championId: number }[];
};

export type AggregatedChampionStat = {
  patch: string;
  eloBucket: string;
  championId: number;
  championKey: string;
  role: ChampionRole;
  tier: ReturnType<typeof tierFromScore>;
  score: number;
  winRate: number;
  pickRate: number;
  banRate: number;
  kda: number;
  games: number;
  roleRate: number;
};

type ChampionAccumulator = {
  championKey: string;
  role: ChampionRole;
  games: number;
  wins: number;
  kdaTotal: number;
};

const round = (value: number, decimals = 2) => {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
};

const minimumPercentileCohortSize = 5;

export function aggregateChampionStats(
  inputMatches: readonly AggregationMatch[],
  minimumGames: number,
): AggregatedChampionStat[] {
  if (!Number.isInteger(minimumGames) || minimumGames < 1) {
    throw new RangeError("minimumGames must be a positive integer.");
  }

  const uniqueMatches = new Map<string, AggregationMatch>();
  for (const match of inputMatches) {
    if (!uniqueMatches.has(match.matchId)) {
      uniqueMatches.set(match.matchId, match);
    }
  }
  const matches = [...uniqueMatches.values()];
  const groups = new Map<string, ChampionAccumulator>();
  const championGames = new Map<number, number>();
  const bannedMatches = new Map<number, Set<string>>();

  for (const match of matches) {
    for (const participant of match.participants) {
      championGames.set(
        participant.championId,
        (championGames.get(participant.championId) ?? 0) + 1,
      );
      if (!participant.role) continue;

      const key = `${participant.championId}:${participant.role}`;
      const accumulator = groups.get(key) ?? {
        championKey: participant.championKey,
        role: participant.role,
        games: 0,
        wins: 0,
        kdaTotal: 0,
      };
      accumulator.games += 1;
      accumulator.wins += Number(participant.won);
      accumulator.kdaTotal +=
        (participant.kills + participant.assists) / Math.max(participant.deaths, 1);
      groups.set(key, accumulator);
    }

    for (const ban of new Set(match.bans.map(({ championId }) => championId))) {
      const samples = bannedMatches.get(ban) ?? new Set<string>();
      samples.add(`${match.matchId}:${match.eloBucket}`);
      bannedMatches.set(ban, samples);
    }
  }

  const candidates: Omit<AggregatedChampionStat, "score" | "tier">[] = [];
  for (const [key, accumulator] of groups) {
    const [championIdText] = key.split(":");
    const championId = Number(championIdText);
    if (accumulator.games < minimumGames) continue;

    const winRate = round((accumulator.wins / accumulator.games) * 100);
    const pickRate = matches.length
      ? round((accumulator.games / matches.length) * 100)
      : 0;
    const banRate = round(
      ((bannedMatches.get(championId)?.size ?? 0) / matches.length) * 100,
    );
    const roleRate = round(
      (accumulator.games / (championGames.get(championId) ?? 1)) * 100,
    );
    const kda = round(accumulator.kdaTotal / accumulator.games);
    candidates.push({
      patch: matches[0]?.patch ?? "",
      eloBucket: matches[0]?.eloBucket ?? "",
      championId,
      championKey: accumulator.championKey,
      role: accumulator.role,
      winRate,
      pickRate,
      banRate,
      kda,
      games: accumulator.games,
      roleRate,
    });
  }

  const candidatesByRole = new Map<ChampionRole, typeof candidates>();
  for (const candidate of candidates) {
    const roleCandidates = candidatesByRole.get(candidate.role) ?? [];
    roleCandidates.push(candidate);
    candidatesByRole.set(candidate.role, roleCandidates);
  }

  const result: AggregatedChampionStat[] = [];
  for (const roleCandidates of candidatesByRole.values()) {
    if (roleCandidates.length < minimumPercentileCohortSize) continue;
    const scores = calculateTierScores(roleCandidates);
    roleCandidates.forEach((candidate, index) => {
      const score = scores[index];
      if (score === undefined) {
        throw new Error("Tier score calculation did not return every candidate.");
      }
      result.push({ ...candidate, score, tier: tierFromScore(score) });
    });
  }

  return result.sort((left, right) => right.score - left.score);
}
