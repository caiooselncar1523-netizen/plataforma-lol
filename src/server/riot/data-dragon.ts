type ChampionData = {
  key: string;
  id: string;
  name: string;
  info?: { difficulty?: number };
};

type ChampionListResponse = {
  data: Record<string, ChampionData>;
};

export type ChampionMetadata = {
  championId: number;
  championKey: string;
  name: string;
  englishName: string;
  difficulty: number;
};

let cachedCatalog: {
  expiresAt: number;
  value: Promise<Map<number, ChampionMetadata>>;
} | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Data Dragon request failed with HTTP ${response.status}.`);
  }
  return (await response.json()) as T;
}

export function getChampionCatalog(): Promise<Map<number, ChampionMetadata>> {
  if (cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return cachedCatalog.value;
  }

  const value = (async () => {
    const versions = await fetchJson<string[]>(
      "https://ddragon.leagueoflegends.com/api/versions.json",
    );
    const version = versions[0];
    if (!version) throw new Error("Data Dragon did not return a game version.");

    const [portuguese, english] = await Promise.all([
      fetchJson<ChampionListResponse>(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/champion.json`,
      ),
      fetchJson<ChampionListResponse>(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
      ),
    ]);

    const catalog = new Map<number, ChampionMetadata>();
    for (const [championKey, champion] of Object.entries(portuguese.data)) {
      const championId = Number(champion.key);
      const englishChampion = english.data[championKey];
      if (!Number.isInteger(championId) || !englishChampion) continue;

      catalog.set(championId, {
        championId,
        championKey: champion.id,
        name: champion.name,
        englishName: englishChampion.name,
        difficulty: champion.info?.difficulty ?? 0,
      });
    }

    return catalog;
  })();

  cachedCatalog = { expiresAt: Date.now() + 6 * 60 * 60 * 1000, value };
  void value.catch(() => {
    if (cachedCatalog?.value === value) cachedCatalog = null;
  });
  return value;
}
