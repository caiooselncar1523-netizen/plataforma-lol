import assert from "node:assert/strict";
import { test } from "vitest";
import {
  collectPlayerProfile,
  type PlayerProfileRepository,
  type PlayerProfileRiotClient,
  type PlayerProfileSnapshot,
} from "../../../src/features/player-profile/application/collect-player-profile";

class FakeRiotClient implements PlayerProfileRiotClient {
  readonly urls: string[] = [];

  constructor(private readonly responses: unknown[]) {}

  async get<T>(url: string): Promise<T> {
    this.urls.push(url);
    const response = this.responses.shift();
    if (response instanceof Error) throw response;
    return response as T;
  }
}

class FakePlayerProfileRepository implements PlayerProfileRepository {
  readonly saved: PlayerProfileSnapshot[] = [];

  async save(profile: PlayerProfileSnapshot): Promise<void> {
    this.saved.push(profile);
  }
}

test("collects account, summoner and ranked data and saves the profile", async () => {
  const riot = new FakeRiotClient([
    {
      puuid: "player-puuid",
      gameName: "Ahri Main",
      tagLine: "BR1",
    },
    {
      puuid: "player-puuid",
      profileIconId: 1234,
      summonerLevel: 240,
    },
    [
      {
        queueType: "RANKED_SOLO_5x5",
        tier: "DIAMOND",
        rank: "II",
        leaguePoints: 64,
        wins: 120,
        losses: 110,
      },
    ],
  ]);
  const repository = new FakePlayerProfileRepository();

  const profile = await collectPlayerProfile(
    { gameName: "Ahri Main", tagLine: "BR1" },
    riot,
    repository,
  );

  assert.deepEqual(profile, {
    puuid: "player-puuid",
    platform: "BR1",
    gameName: "Ahri Main",
    tagLine: "BR1",
    profileIconId: 1234,
    summonerLevel: 240,
    rankedEntries: [
      {
        queueType: "RANKED_SOLO_5x5",
        tier: "DIAMOND",
        division: "II",
        leaguePoints: 64,
        wins: 120,
        losses: 110,
      },
    ],
  });
  assert.deepEqual(repository.saved, [profile]);
  assert.deepEqual(riot.urls, [
    "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Ahri%20Main/BR1",
    "https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/player-puuid",
    "https://br1.api.riotgames.com/lol/league/v4/entries/by-puuid/player-puuid",
  ]);
});

test("saves an empty ranked-entry list for an unranked player", async () => {
  const riot = new FakeRiotClient([
    { puuid: "player-puuid", gameName: "New Player", tagLine: "BR1" },
    { puuid: "player-puuid", profileIconId: 1, summonerLevel: 12 },
    [],
  ]);
  const repository = new FakePlayerProfileRepository();

  const profile = await collectPlayerProfile(
    { gameName: "New Player", tagLine: "BR1" },
    riot,
    repository,
  );

  assert.deepEqual(profile.rankedEntries, []);
  assert.equal(repository.saved.length, 1);
});

test("does not save profile data when account and summoner identifiers differ", async () => {
  const riot = new FakeRiotClient([
    { puuid: "account-puuid", gameName: "Ahri Main", tagLine: "BR1" },
    { puuid: "other-puuid", profileIconId: 1, summonerLevel: 12 },
  ]);
  const repository = new FakePlayerProfileRepository();

  await assert.rejects(
    collectPlayerProfile(
      { gameName: "Ahri Main", tagLine: "BR1" },
      riot,
      repository,
    ),
    /PUUIDs do not match/,
  );
  assert.equal(repository.saved.length, 0);
});

test("rejects malformed league entries instead of persisting incomplete data", async () => {
  const riot = new FakeRiotClient([
    { puuid: "player-puuid", gameName: "Ahri Main", tagLine: "BR1" },
    { puuid: "player-puuid", profileIconId: 1, summonerLevel: 12 },
    [{ queueType: "RANKED_SOLO_5x5", tier: "GOLD" }],
  ]);
  const repository = new FakePlayerProfileRepository();

  await assert.rejects(
    collectPlayerProfile(
      { gameName: "Ahri Main", tagLine: "BR1" },
      riot,
      repository,
    ),
    /league entry is missing required fields/,
  );
  assert.equal(repository.saved.length, 0);
});
