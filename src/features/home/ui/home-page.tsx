"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  tierOrder,
  type ChampionEntry,
  type ChampionTier,
} from "@/features/tier-list/domain/champion-entry";
import { SiteFooter, SiteHeader } from "@/features/shared/ui/site-chrome";
import { parseRiotId } from "@/features/player-search/domain/riot-id";

type HomeTierListResponse = {
  data: ChampionEntry[];
  meta: {
    patch: string | null;
    matchesInDatabase?: number;
    minimumGames?: number;
  };
};

type HomeDataStatus = "loading" | "ready" | "error";
type PlayerLookupResponse = {
  data: {
    gameName: string;
    tagLine: string;
  };
};
type PlayerLookupErrorResponse = {
  error: {
    message: string;
  };
};

const tierColors: Record<ChampionTier, string> = {
  "S+": "var(--tier-splus)",
  S: "var(--tier-s)",
  A: "var(--tier-a)",
  B: "var(--tier-b)",
  C: "var(--tier-c)",
  D: "var(--tier-d)",
};

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function readRecentSearches(): string[] {
  try {
    const stored = window.localStorage.getItem("ahriademia:recent-searches");
    if (!stored) return [];
    const recent: unknown = JSON.parse(stored);
    if (!Array.isArray(recent)) return [];
    return recent
      .filter(
        (value): value is string =>
          typeof value === "string" && value.includes("#"),
      )
      .slice(0, 4);
  } catch (error) {
    console.error("Não foi possível carregar as buscas recentes.", error);
    return [];
  }
}

function saveRecentSearches(recentSearches: string[]): void {
  try {
    window.localStorage.setItem(
      "ahriademia:recent-searches",
      JSON.stringify(recentSearches),
    );
  } catch (error) {
    console.error("Não foi possível salvar as buscas recentes.", error);
  }
}

function isPlayerLookupResponse(value: unknown): value is PlayerLookupResponse {
  if (typeof value !== "object" || value === null || !("data" in value)) {
    return false;
  }
  const data = value.data;
  return (
    typeof data === "object" &&
    data !== null &&
    "gameName" in data &&
    typeof data.gameName === "string" &&
    "tagLine" in data &&
    typeof data.tagLine === "string"
  );
}

function isPlayerLookupError(value: unknown): value is PlayerLookupErrorResponse {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }
  const error = value.error;
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  );
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 17 17 5m-8 0h8v8" />
    </svg>
  );
}

function HomeStatCard({
  eyebrow,
  entry,
  value,
  label,
  status,
}: {
  eyebrow: string;
  entry?: ChampionEntry;
  value: string;
  label: string;
  status: HomeDataStatus;
}) {
  const displayValue = entry ? value : status === "loading" ? "Carregando" : "Em coleta";

  return (
    <article className="home-stat-card">
      <p className="home-label">{eyebrow}</p>
      <strong className={entry ? "home-stat-value" : "home-stat-pending"}>
        {displayValue}
      </strong>
      <p className="home-stat-caption">
        {entry ? (
          <>
            <span>{entry.name}</span> · {label}
          </>
        ) : status === "error" ? (
          "Não foi possível carregar os dados agora."
        ) : (
          "Aguarda amostra mínima por campeão e função."
        )}
      </p>
    </article>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<HomeDataStatus>("loading");
  const [entries, setEntries] = useState<ChampionEntry[]>([]);
  const [patch, setPatch] = useState<string | null>(null);
  const [matchesInDatabase, setMatchesInDatabase] = useState(0);
  const [minimumGames, setMinimumGames] = useState(50);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [region, setRegion] = useState("br");
  const [playerName, setPlayerName] = useState("");
  const [playerTag, setPlayerTag] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/tier-list?regiao=br&elo=all", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Tier-list API returned HTTP ${response.status}.`);
        }
        return (await response.json()) as HomeTierListResponse;
      })
      .then((result) => {
        setEntries(result.data);
        setPatch(result.meta.patch);
        setMatchesInDatabase(result.meta.matchesInDatabase ?? 0);
        setMinimumGames(result.meta.minimumGames ?? 50);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not load home tier-list highlights.", error);
        setStatus("error");
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const searchField = document.getElementById("home-player-name");
      if (!(searchField instanceof HTMLInputElement) || searchField.disabled) {
        return;
      }
      event.preventDefault();
      searchField.focus();
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  async function searchPlayer(value: string): Promise<void> {
    const riotId = parseRiotId(value);
    if (!riotId) {
      setSearchError("Informe seu Riot ID no formato Nome#TAG.");
      return;
    }

    setSearchError(null);
    setIsSearching(true);
    try {
      const response = await fetch("/api/v1/players/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riotId: `${riotId.gameName}#${riotId.tagLine}`,
          region,
        }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        setSearchError(
          isPlayerLookupError(result)
            ? result.error.message
            : response.status === 429
            ? "A busca está temporariamente ocupada. Tente novamente em alguns instantes."
              : "Não foi possível concluir a busca. Tente novamente.",
        );
        return;
      }

      if (!isPlayerLookupResponse(result)) {
        throw new Error("Player lookup returned an invalid response.");
      }

      const canonicalRiotId = parseRiotId(
        `${result.data.gameName}#${result.data.tagLine}`,
      );
      if (!canonicalRiotId) {
        throw new Error("Player lookup returned an invalid Riot ID.");
      }

      const canonicalValue = `${canonicalRiotId.gameName}#${canonicalRiotId.tagLine}`;
      const nextRecentSearches = [
        canonicalValue,
        ...recentSearches.filter(
          (recent) => recent.toLowerCase() !== canonicalValue.toLowerCase(),
        ),
      ].slice(0, 4);
      setRecentSearches(nextRecentSearches);
      saveRecentSearches(nextRecentSearches);

      const playerSlug = encodeURIComponent(
        `${canonicalRiotId.gameName}-${canonicalRiotId.tagLine}`,
      );
      router.push(`/jogador/${region}/${playerSlug}`);
    } catch (error) {
      console.error("Player lookup request failed.", error);
      setSearchError(
        "Não foi possível consultar a Riot agora. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void searchPlayer(`${playerName}#${playerTag}`);
  }

  function handleRiotIdInput(value: string, field: "name" | "tag"): void {
    const pastedRiotId = parseRiotId(value);
    if (pastedRiotId) {
      setPlayerName(pastedRiotId.gameName);
      setPlayerTag(pastedRiotId.tagLine);
      setSearchError(null);
      return;
    }

    if (field === "name") setPlayerName(value);
    else setPlayerTag(value);
    if (searchError) setSearchError(null);
  }

  const highestTier = useMemo(
    () =>
      tierOrder.find((tier) => entries.some((entry) => entry.tier === tier)),
    [entries],
  );
  const topTierEntries = useMemo(
    () =>
      highestTier
        ? entries
            .filter((entry) => entry.tier === highestTier)
            .slice(0, 8)
        : [],
    [entries, highestTier],
  );
  const highestScore = entries.reduce<ChampionEntry | undefined>(
    (best, entry) => (!best || entry.score > best.score ? entry : best),
    undefined,
  );
  const mostBanned = entries.reduce<ChampionEntry | undefined>(
    (best, entry) => (!best || entry.banRate > best.banRate ? entry : best),
    undefined,
  );
  const bestWinRate = entries.reduce<ChampionEntry | undefined>(
    (best, entry) => (!best || entry.winRate > best.winRate ? entry : best),
    undefined,
  );
  const progress = Math.min(100, (matchesInDatabase / minimumGames) * 100);

  return (
    <main className="home-page">
      <SiteHeader active="home" hideSearch />
      <div className="home-shell">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <p className="home-eyebrow">
              <span className="live-dot" />
              ACADEMIA DE LEAGUE OF LEGENDS · BR
            </p>
            <h1 id="home-title">
              SUA ACADEMIA PARA
              <br />
              EVOLUIR NO <span>RIFT</span>
            </h1>
            <p className="home-subtitle">
              Entenda seus erros e acertos e suba de elo com análises claras,
              em português.
            </p>
            <a className="home-primary-cta" href="/tier-list">
              Ver Tier List <ArrowIcon />
            </a>
          </div>

          <section className="home-search-panel" id="busca" aria-labelledby="home-search-title">
            <div className="home-search-heading">
              <div>
                <p className="home-label">COMECE POR VOCÊ</p>
                <h2 id="home-search-title">Busque seu Riot ID</h2>
              </div>
            </div>
            <form
              className="home-search-form"
              onSubmit={handleSearchSubmit}
              aria-busy={isSearching}
            >
              <label className="home-field home-region-field">
                <span>REGIÃO</span>
                <select
                  aria-label="Região"
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  disabled={isSearching}
                >
                  <option value="br">BR</option>
                  <option value="na" disabled>
                    NA · em breve
                  </option>
                  <option value="euw" disabled>
                    EUW · em breve
                  </option>
                </select>
              </label>
              <label className="home-field home-player-field">
                <span>NOME DO JOGADOR</span>
                <input
                  id="home-player-name"
                  autoComplete="off"
                  placeholder="Ex.: Ahri Main"
                  value={playerName}
                  onChange={(event) =>
                    handleRiotIdInput(event.target.value, "name")
                  }
                  aria-invalid={Boolean(searchError)}
                  aria-describedby={
                    searchError ? "home-search-error" : "home-search-note"
                  }
                  disabled={isSearching}
                />
              </label>
              <label className="home-field home-tag-field">
                <span>TAG</span>
                <input
                  autoComplete="off"
                  placeholder="BR1"
                  value={playerTag}
                  onChange={(event) =>
                    handleRiotIdInput(event.target.value, "tag")
                  }
                  aria-invalid={Boolean(searchError)}
                  aria-describedby={
                    searchError ? "home-search-error" : "home-search-note"
                  }
                  disabled={isSearching}
                />
              </label>
              <button
                className="home-search-button"
                type="submit"
                disabled={isSearching}
              >
                <SearchIcon />
                {isSearching ? "Buscando..." : "Buscar"}
              </button>
            </form>
            <p className="home-search-note" id="home-search-note" aria-live="polite">
              {isSearching
                ? "Consultando o Riot ID na região selecionada..."
                : "Digite Nome#TAG ou cole o Riot ID em qualquer campo."}
            </p>
            {searchError ? (
              <p
                className="home-search-error"
                id="home-search-error"
                role="alert"
              >
                {searchError}
              </p>
            ) : null}
            <div className="home-recent-row">
              <span className="home-label">ÚLTIMAS BUSCAS</span>
              <div className="home-recent-chips" aria-live="polite">
                {recentSearches.length > 0 ? (
                  recentSearches.map((riotId) => (
                    <button
                      className="home-recent-chip"
                      key={riotId}
                      type="button"
                      onClick={() => void searchPlayer(riotId)}
                      disabled={isSearching}
                    >
                      {riotId}
                    </button>
                  ))
                ) : (
                  <span className="home-recent-empty">Suas buscas aparecerão aqui</span>
                )}
              </div>
              <span className="home-multi-search">
                Colar vários jogadores <span>EM BREVE</span>
              </span>
            </div>
          </section>
          <div className="home-shortcuts" aria-label="Atalhos">
            <a href="/tier-list">
              Ver a Tier List do patch <ArrowIcon />
            </a>
            <a href="#patch-highlights">
              O que mudou neste patch? <ArrowIcon />
            </a>
            <a href="#how-it-works">
              Como funciona a análise? <ArrowIcon />
            </a>
          </div>
        </section>

        <section className="home-section" id="patch-highlights">
          <div className="home-section-heading">
            <div>
              <p className="home-label">PATCH {patch ?? "ATUAL"} · BR</p>
              <h2>Destaques do patch</h2>
            </div>
            <a className="home-text-link" href="/tier-list">
              Abrir Tier List <ArrowIcon />
            </a>
          </div>
          <div className="home-stats-grid">
            <HomeStatCard
              eyebrow="MAIOR PONTUAÇÃO"
              entry={highestScore}
              value={highestScore ? `${highestScore.score.toFixed(1).replace(".", ",")} pts` : ""}
              label={`Tier ${highestScore?.tier ?? ""}`}
              status={status}
            />
            <HomeStatCard
              eyebrow="MAIS BANIDO"
              entry={mostBanned}
              value={mostBanned ? formatPercent(mostBanned.banRate) : ""}
              label="de ban rate"
              status={status}
            />
            <HomeStatCard
              eyebrow="MELHOR WIN RATE"
              entry={bestWinRate}
              value={bestWinRate ? formatPercent(bestWinRate.winRate) : ""}
              label="de vitórias"
              status={status}
            />
          </div>
        </section>

        {topTierEntries.length > 0 ? (
          <section className="home-section home-top-tier" aria-labelledby="top-tier-heading">
            <div className="home-section-heading">
              <div>
                <p className="home-label">ESCOLHAS EM DESTAQUE</p>
                <h2 id="top-tier-heading">
                  Tier <span style={{ color: tierColors[highestTier!] }}>{highestTier}</span>
                </h2>
              </div>
              <a className="home-text-link" href="/tier-list">
                Ver Tier List completa <ArrowIcon />
              </a>
            </div>
            <div className="home-top-tier-list">
              {topTierEntries.map((entry) => (
                <article className="home-top-champion" key={`${entry.championId}-${entry.role}`}>
                  <div className="home-top-portrait">
                    <Image
                      src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${entry.championId}_0.jpg`}
                      alt=""
                      fill
                      sizes="72px"
                      unoptimized
                    />
                  </div>
                  <span>{entry.name}</span>
                  <small>{entry.role}</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="home-section home-how-section" id="how-it-works">
          <div className="home-section-heading">
            <div>
              <p className="home-label">SIMPLES E DIRETO</p>
              <h2>Como funciona</h2>
            </div>
          </div>
          <ol className="home-steps">
            {[
              ["Busque seu Riot ID", "Encontre sua conta pelo Nome#TAG na região BR."],
              ["Veja seus erros e acertos", "Análises individuais em breve."],
              ["Cumpra metas semanais", "Planos de evolução em breve."],
            ].map(([title, description], index) => (
              <li className="home-step-card" key={title}>
                <span className="home-step-number">0{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                {index > 0 ? (
                  <span className="coming-soon-badge">EM BREVE</span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="home-transparency" aria-labelledby="transparency-title">
          <div className="home-transparency-copy">
            <p className="home-label">TRANSPARÊNCIA</p>
            <h2 id="transparency-title">Dados que crescem com a comunidade.</h2>
            <p>
              A coleta de partidas ranqueadas no servidor BR está em andamento.
              Publicamos estatísticas quando a amostra por campeão e função é
              suficiente.
            </p>
          </div>
          <div className="home-progress-card">
            <div className="home-progress-heading">
              <span>PARTIDAS ANALISADAS NO BR</span>
              <strong>
                {status === "loading"
                  ? "..."
                  : `${matchesInDatabase} / ${minimumGames}`}
              </strong>
            </div>
            <div
              className="home-progress-track"
              role="progressbar"
              aria-label="Partidas coletadas em relação ao mínimo por campeão e função"
              aria-valuemin={0}
              aria-valuemax={minimumGames}
              aria-valuenow={Math.min(matchesInDatabase, minimumGames)}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>
              {status === "error"
                ? "Não foi possível consultar o progresso da coleta."
                : `${matchesInDatabase} de ${minimumGames} jogos mínimos por campeão/função · coleta em andamento`}
            </p>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
