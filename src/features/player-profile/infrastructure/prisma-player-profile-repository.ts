import type { Prisma } from "@prisma/client";
import type {
  PlayerProfileRepository,
  PlayerProfileSnapshot,
} from "../application/collect-player-profile";
import { prisma } from "@/server/db/client";

export class PrismaPlayerProfileRepository implements PlayerProfileRepository {
  async save(profile: PlayerProfileSnapshot): Promise<void> {
    const profileData = {
      platform: profile.platform,
      gameName: profile.gameName,
      tagLine: profile.tagLine,
      profileIconId: profile.profileIconId,
      summonerLevel: profile.summonerLevel,
    };
    const rankedEntries = profile.rankedEntries.map((entry) => ({
      queueType: entry.queueType,
      tier: entry.tier,
      division: entry.division,
      leaguePoints: entry.leaguePoints,
      wins: entry.wins,
      losses: entry.losses,
    }));

    await prisma.playerProfile.upsert({
      where: { puuid: profile.puuid },
      create: {
        puuid: profile.puuid,
        ...profileData,
        rankedEntries: { create: rankedEntries },
      },
      update: {
        ...profileData,
        rankedEntries: {
          deleteMany: {},
          create: rankedEntries,
        },
      },
    } satisfies Prisma.PlayerProfileUpsertArgs);
  }
}
