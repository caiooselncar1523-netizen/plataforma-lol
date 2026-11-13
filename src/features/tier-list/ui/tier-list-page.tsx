"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type CSSProperties,
} from "react";
import {
  roleLabels,
  tierLabels,
  tierOrder,
  type ChampionEntry,
  type ChampionRole,
  type ChampionTier,
} from "../domain/champion-entry";

type ViewMode = "tiers" | "table";
type SortMode = "score" | "winRate" | "pickRate" | "banRate" | "name";
type CardSize = "compact" | "medium" | "large";
type InitialFilters = {
  role: "all" | ChampionRole;
  patch: string;
  elo: string;
  region: "br";
  search: string;
  compare: boolean;
  view: ViewMode;
  sort: SortMode;
};

type TierListResponse = {
  data: ChampionEntry[];
  meta: {
    patch: string | null;
    availablePatches?: string[];
    matchesInDatabase?: number;
    minimumGames?: number;
    preliminary?: boolean;
    message?: string;
  };
};

type DataStatus = "loading" | "ready" | "error";

const eloOptions = [
  ["all", "Todos os elos"],
  ["iron", "Ferro+"],
  ["bronze", "Bronze+"],
  ["silver", "Prata+"],
  ["gold", "Ouro+"],
  ["platinum", "Platina+"],
  ["emerald", "Esmeralda+"],
  ["diamond", "Diamante+"],
  ["master", "Mestre+"],
] as const;

const roleOptions: { value: "all" | ChampionRole; label: string }[] = [
  { value: "all", label: "Todas as funções" },
  { value: "TOP", label: "Topo" },
  { value: "JUNGLE", label: "Selva" },
  { value: "MID", label: "Meio" },
  { value: "ADC", label: "ADC" },
  { value: "SUPPORT", label: "Suporte" },
];

const sortOptions: { value: SortMode; label: string }[] = [
  { value: "score", label: "Pontuação" },
  { value: "winRate", label: "Win rate" },
  { value: "pickRate", label: "Pick rate" },
  { value: "banRate", label: "Ban rate" },
  { value: "name", label: "A–Z" },
];

const tierColors: Record<ChampionTier, string> = {
  "S+": "var(--tier-splus)",
  S: "var(--tier-s)",
  A: "var(--tier-a)",
  B: "var(--tier-b)",
  C: "var(--tier-c)",
  D: "var(--tier-d)",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]/g, "");
}

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function buildSearchText(entry: ChampionEntry): string {
  return normalizeText(`${entry.name} ${entry.englishName} ${entry.championId}`);
}

function readInitialFilters(): InitialFilters | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const role = params.get("funcao");
  const patch = params.get("patch");
  const elo = params.get("elo");
  const region = params.get("regiao");
  const selectedRole = roleOptions.find(
    (option) => option.value.toLowerCase() === role,
  )?.value;

  return {
    role: selectedRole ?? "all",
    patch: patch && /^\d{1,3}\.\d{1,3}$/.test(patch) ? patch : "",
    elo: eloOptions.some((option) => option[0] === elo) ? elo! : "all",
    region: region === "br" ? "br" : "br",
    search: params.get("busca") ?? "",
    compare: params.get("comparar") === "true",
    view: params.get("visualizacao") === "tabela" ? "table" : "tiers",
    sort:
      sortOptions.some((option) => option.value === params.get("ordenar"))
        ? (params.get("ordenar") as SortMode)
        : "score",
  };
}

function RoleIcon({ role }: { role: ChampionRole }) {
  if (role === "TOP") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 18 6-10 3 5 3-7 6 12H3Z" />
        <path d="M7 18v-3m5 3v-4m5 4v-3" />
      </svg>
    );
  }

  if (role === "JUNGLE") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 4C10 4 5 8 5 14c0 3 2 5 5 5 6 0 9-6 9-15Z" />
        <path d="M4 21c3-5 7-8 12-11" />
      </svg>
    );
  }

  if (role === "MID") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 9 9-9 9-9-9 9-9Z" />
        <path d="m8 12 4-4 4 4-4 4-4-4Z" />
      </svg>
    );
  }

  if (role === "ADC") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20 18 6m-8 0h8v8" />
        <path d="m6 6 2 2M4 11l2 1m5-8 1 2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 20 6v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3Z" />
      <path d="M12 8v8m-4-4h8" />
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 34 34">
        <path d="M17 3 30 10.5v13L17 31 4 23.5v-13L17 3Z" />
        <path d="m10 22 7-14 7 14m-11-5h8" />
      </svg>
    </span>
  );
}

function Icon({
  name,
  size = 18,
}: {
  name: "search" | "chevron" | "star" | "close" | "grid" | "table" | "sliders" | "arrow";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...common}>
        <path d="m7 10 5 5 5-5" />
      </svg>
    );
  }

  if (name === "star") {
    return (
      <svg {...common}>
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg {...common}>
        <path d="m18 6-12 12M6 6l12 12" />
      </svg>
    );
  }

  if (name === "table") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 10v10m6-10v10" />
      </svg>
    );
  }

  if (name === "sliders") {
    return (
      <svg {...common}>
        <path d="M4 7h9m4 0h3M4 17h3m4 0h9" />
        <circle cx="15" cy="7" r="2" />
        <circle cx="9" cy="17" r="2" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 17 17 5m-8 0h8v8" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

function SelectChevron({
  label,
  onOpen,
  size = 14,
}: {
  label: string;
  onOpen: () => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      className="select-chevron"
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpen();
      }}
    >
      <Icon name="chevron" size={size} />
    </button>
  );
}

function openNativeSelect(select: HTMLSelectElement | null) {
  if (!select) return;
  if (typeof select.showPicker === "function") {
    select.showPicker();
  } else {
    select.focus();
  }
}

function ChampionPortrait({
  entry,
  imageFailed,
  onImageError,
}: {
  entry: ChampionEntry;
  imageFailed: boolean;
  onImageError: () => void;
}) {
  if (imageFailed) {
    return (
      <span className="portrait-fallback" aria-hidden="true">
        {entry.name.slice(0, 1)}
      </span>
    );
  }

  return (
    <Image
      src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${entry.championId}_0.jpg`}
      alt=""
      fill
      sizes="(max-width: 640px) 96px, 120px"
      className="champion-portrait"
      onError={onImageError}
      unoptimized
    />
  );
}

function ChampionCard({
  entry,
  cardKey,
  active,
  dimmed,
  highlighted,
  favorite,
  compare,
  cardSize,
  imageFailed,
  onImageError,
  onEnter,
  onLeave,
  onKeyDown,
  onToggleFavorite,
}: {
  entry: ChampionEntry;
  cardKey: string;
  active: boolean;
  dimmed: boolean;
  highlighted: boolean;
  favorite: boolean;
  compare: boolean;
  cardSize: CardSize;
  imageFailed: boolean;
  onImageError: () => void;
  onEnter: (event: MouseEvent<HTMLDivElement>) => void;
  onLeave: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      className={`champion-card-wrap ${active ? "is-active" : ""} ${dimmed ? "is-dimmed" : ""} ${highlighted ? "is-cross-highlighted" : ""}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div
        role="group"
        tabIndex={0}
        data-champion-key={cardKey}
        className={`champion-card card-size-${cardSize}`}
        style={{ "--role-color": `var(--role-${entry.role.toLowerCase()})` } as CSSProperties}
        onKeyDown={onKeyDown}
        aria-label={`${entry.name}, ${roleLabels[entry.role]}, tier ${entry.tier}, nota ${entry.score.toFixed(1)}`}
        aria-describedby={active ? `champion-detail-${entry.championId}` : undefined}
      >
        <ChampionPortrait
          entry={entry}
          imageFailed={imageFailed}
          onImageError={onImageError}
        />
        <span className="card-shade" />
        <span className="role-pin" aria-label={roleLabels[entry.role]} title={roleLabels[entry.role]}>
          <RoleIcon role={entry.role} />
        </span>
        <span className="card-tier" style={{ "--tier-color": tierColors[entry.tier] } as CSSProperties}>
          {entry.tier}
        </span>
        {compare && entry.tierChange && entry.tierChange !== "SAME" ? (
          <span className={`card-tier-change ${entry.tierChange === "UP" ? "change-up" : "change-down"}`}>
            {entry.tierChange === "UP" ? "↑" : "↓"}
          </span>
        ) : null}
        {entry.lowSample ? <span className="sample-dot" title="Amostra baixa">!</span> : null}
        <span className="card-caption">
          <span className="card-name">{entry.name}</span>
          <span className="card-score">{entry.score.toFixed(1).replace(".", ",")} <small>pts</small></span>
        </span>
      </div>
      <button
        type="button"
        className={`favorite-button ${favorite ? "is-favorite" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite();
        }}
        aria-label={favorite ? `Remover ${entry.name} dos favoritos` : `Adicionar ${entry.name} aos favoritos`}
        aria-pressed={favorite}
      >
        <Icon name="star" size={15} />
      </button>
    </div>
  );
}

function formatCompactGames(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPrecisePercent(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}

function ChampionDetail({
  entry,
  className = "",
}: {
  entry: ChampionEntry;
  className?: string;
}) {
  return (
    <aside
      className={`champion-detail ${className}`}
      id={`champion-detail-${entry.championId}`}
      role="region"
      aria-label={`Detalhes de ${entry.name}`}
    >
      <div className="detail-heading">
        <span className="detail-avatar">
          <Image
            src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${entry.championId}_0.jpg`}
            alt=""
            fill
            sizes="34px"
            unoptimized
          />
        </span>
        <h3>{entry.name}</h3>
        <span className="detail-role" style={{ "--role-color": `var(--role-${entry.role.toLowerCase()})` } as CSSProperties}>
          <RoleIcon role={entry.role} />
          {roleLabels[entry.role]}
        </span>
      </div>
      <div className="detail-stat-grid">
        <div><span>Tier:</span><strong style={{ "--tier-color": tierColors[entry.tier] } as CSSProperties}>{entry.tier}</strong></div>
        <div><span>Score:</span><strong>{entry.score.toFixed(2).replace(".", ",")}</strong></div>
        <div><span>Win %:</span><strong>{formatPrecisePercent(entry.winRate)}</strong></div>
        <div><span>Pick %:</span><strong>{formatPrecisePercent(entry.pickRate)}</strong></div>
        <div><span>KDA:</span><strong>{entry.kda.toFixed(2).replace(".", ",")}</strong></div>
        <div><span>Games:</span><strong>{formatCompactGames(entry.games)}</strong></div>
        <div><span>Role %:</span><strong>{formatPrecisePercent(entry.roleRate)}</strong></div>
        <div><span>Ban %:</span><strong>{formatPrecisePercent(entry.banRate)}</strong></div>
      </div>
      {entry.lowSample ? <p className="detail-sample-notice">Amostra baixa: interprete estas estatísticas com cautela.</p> : null}
    </aside>
  );
}

export default function TierListPage() {
  const [role, setRole] = useState<"all" | ChampionRole>("all");
  const [patch, setPatch] = useState("");
  const [elo, setElo] = useState("all");
  const [region, setRegion] = useState<"br">("br");
  const [search, setSearch] = useState("");
  const [compare, setCompare] = useState(false);
  const [view, setView] = useState<ViewMode>("tiers");
  const [sort, setSort] = useState<SortMode>("score");
  const [cardSize, setCardSize] = useState<CardSize>("medium");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [collapsedTiers, setCollapsedTiers] = useState<Set<ChampionTier>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [entries, setEntries] = useState<ChampionEntry[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus>("loading");
  const [dataMeta, setDataMeta] = useState<TierListResponse["meta"] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hoverUnavailable, setHoverUnavailable] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [imageFailures, setImageFailures] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const patchSelectRef = useRef<HTMLSelectElement>(null);
  const regionSelectRef = useRef<HTMLSelectElement>(null);
  const eloSelectRef = useRef<HTMLSelectElement>(null);
  const sortSelectRef = useRef<HTMLSelectElement>(null);
  const sizeSelectRef = useRef<HTMLSelectElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSide = useRef<"left" | "right">("right");

  const patchOptions = useMemo(() => {
    const options = [...(dataMeta?.availablePatches ?? [])];
    if (patch && !options.includes(patch)) options.unshift(patch);
    return options;
  }, [dataMeta?.availablePatches, patch]);

  const normalizedSearch = normalizeText(search.trim());

  useEffect(() => {
    setHoverUnavailable(window.matchMedia("(hover: none)").matches);

    const initialFilters = readInitialFilters();
    if (initialFilters) {
      setRole(initialFilters.role);
      setPatch(initialFilters.patch);
      setElo(initialFilters.elo);
      setRegion(initialFilters.region);
      setSearch(initialFilters.search);
      setCompare(initialFilters.compare);
      setView(initialFilters.view);
      setSort(initialFilters.sort);
    }

    try {
      const saved = window.localStorage.getItem("ahriademia:favorites");
      if (saved) {
        setFavorites(new Set(JSON.parse(saved) as string[]));
      }
    } catch (error) {
      console.error("Não foi possível carregar os favoritos locais.", error);
    }

    const handleResize = () =>
      setHoverUnavailable(window.matchMedia("(hover: none)").matches);
    window.addEventListener("resize", handleResize);
    setMounted(true);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      regiao: region,
      elo,
      funcao: role === "all" ? "all" : role.toLowerCase(),
    });
    if (patch) params.set("patch", patch);
    if (process.env.NODE_ENV !== "production") {
      params.set("amostra", "preliminar");
    }

    setDataStatus("loading");
    fetch(`/api/v1/tier-list?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Tier-list API returned HTTP ${response.status}.`);
        }
        return (await response.json()) as TierListResponse;
      })
      .then((result) => {
        setEntries(result.data);
        setDataMeta(result.meta);
        setDataStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not load tier-list data.", error);
        setEntries([]);
        setDataMeta(null);
        setDataStatus("error");
      });

    return () => controller.abort();
  }, [elo, mounted, patch, region, reloadKey, role]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const params = new URLSearchParams();
    if (role !== "all") params.set("funcao", role.toLowerCase());
    if (elo !== "all") params.set("elo", elo);
    if (patch) params.set("patch", patch);
    if (region !== "br") params.set("regiao", region);
    if (search.trim()) params.set("busca", search.trim());
    if (compare) params.set("comparar", "true");
    if (view !== "tiers") params.set("visualizacao", "tabela");
    if (sort !== "score") params.set("ordenar", sort);

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [compare, elo, mounted, patch, region, role, search, sort, view]);

  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!activeKey) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveKey(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeKey]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => role === "all" || entry.role === role)
      .filter((entry) => !favoritesOnly || favorites.has(entry.championId))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
        return b[sort] - a[sort];
      });
  }, [entries, favorites, favoritesOnly, role, sort]);

  const matchingEntries = useMemo(
    () =>
      normalizedSearch
        ? filteredEntries.filter((entry) => buildSearchText(entry).includes(normalizedSearch))
        : filteredEntries,
    [filteredEntries, normalizedSearch],
  );

  const matchingKeys = useMemo(
    () => new Set(matchingEntries.map((entry) => `${entry.championId}-${entry.role}`)),
    [matchingEntries],
  );

  const shownGames = dataMeta?.matchesInDatabase ?? 0;
  const highestWinRate = [...filteredEntries].sort((a, b) => b.winRate - a.winRate)[0];
  const mostBanned = [...filteredEntries].sort((a, b) => b.banRate - a.banRate)[0];
  const setActiveFromCard = useCallback((entry: ChampionEntry, card: HTMLDivElement) => {
    const bounds = card.getBoundingClientRect();
    activeSide.current =
      window.innerWidth - bounds.right < 310 && bounds.left > 310 ? "left" : "right";
    setActiveKey(`${entry.championId}-${entry.role}`);
  }, []);

  const handleCardEnter = (entry: ChampionEntry, event: MouseEvent<HTMLDivElement>) => {
    if (hoverUnavailable) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    const card = event.currentTarget.querySelector<HTMLDivElement>(".champion-card");
    if (!card) return;
    hoverTimer.current = setTimeout(() => setActiveFromCard(entry, card), 150);
  };

  const handleCardLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (hoverUnavailable) return;
    leaveTimer.current = setTimeout(() => setActiveKey(null), 180);
  };

  const handleDetailEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    const directions: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    const direction = directions[event.key];
    if (!direction) return;

    const cards = [...document.querySelectorAll<HTMLDivElement>(".champion-card")];
    const currentIndex = cards.indexOf(event.currentTarget);
    if (currentIndex < 0 || cards.length === 0) return;
    event.preventDefault();
    const nextIndex = (currentIndex + direction + cards.length) % cards.length;
    cards[nextIndex]?.focus();
  };

  const handleToggleFavorite = (championId: string) => {
    setFavorites((previous) => {
      const next = new Set(previous);
      if (next.has(championId)) {
        next.delete(championId);
      } else {
        next.add(championId);
      }

      try {
        window.localStorage.setItem("ahriademia:favorites", JSON.stringify([...next]));
      } catch (error) {
        console.error("Não foi possível salvar os favoritos locais.", error);
      }
      return next;
    });
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    const first = matchingEntries[0];
    if (!first) return;
    event.preventDefault();
    const key = `${first.championId}-${first.role}`;
    document.querySelector<HTMLDivElement>(`div.champion-card[data-champion-key="${key}"]`)?.focus();
  };

  const clearFilters = () => {
    setRole("all");
    setPatch("");
    setElo("all");
    setRegion("br");
    setSearch("");
    setCompare(false);
    setSort("score");
    setFavoritesOnly(false);
  };

  const handleImageError = (key: string) => {
    setImageFailures((previous) => new Set(previous).add(key));
  };

  const activeEntry = activeKey
    ? entries.find((entry) => `${entry.championId}-${entry.role}` === activeKey)
    : undefined;
  return (
    <main className="tier-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Ahriademia, início">
          <BrandMark />
          <span className="brand-word">AHRI<span>A</span>DEMIA</span>
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          <a className="nav-link nav-link-active" href="#tier-list">Tier List</a>
          <a className="nav-link nav-link-disabled" href="#busca" aria-disabled="true">Jogadores <span>EM BREVE</span></a>
          <a className="nav-link nav-link-disabled" href="#analises" aria-disabled="true">Análises <span>EM BREVE</span></a>
        </nav>
        <div className="header-actions">
          <label className="header-search">
            <Icon name="search" size={16} />
            <input aria-label="Buscar Riot ID" placeholder="Buscar Riot ID" disabled />
            <span>EM BREVE</span>
          </label>
          <button type="button" className="sign-in-button" disabled title="Login estará disponível em uma fase futura">
            Entrar <Icon name="arrow" size={15} />
          </button>
          <button type="button" className="mobile-menu icon-button" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
            <Icon name="grid" />
          </button>
        </div>
      </header>
      {mobileMenuOpen ? (
        <nav className="mobile-nav-panel" aria-label="Navegação mobile">
          <a href="#tier-list" onClick={() => setMobileMenuOpen(false)}>Tier List <span>ATUAL</span></a>
          <a href="#busca" aria-disabled="true">Jogadores <span>EM BREVE</span></a>
          <a href="#analises" aria-disabled="true">Análises <span>EM BREVE</span></a>
        </nav>
      ) : null}

      <div className="page-shell" id="tier-list">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><span className="live-dot" /> PATCH {dataMeta?.patch ?? "—"} · RANQUEADAS</p>
            <h1>Tier <span>List</span></h1>
            <p className="hero-description">
              Encontre sua próxima escolha. Estatísticas claras para decisões melhores no Rift.
            </p>
          </div>
          <div className="patch-controls" aria-label="Contexto dos dados">
            <div className="context-chip">
              <span>PATCH</span>
              <select ref={patchSelectRef} value={patch} onChange={(event) => setPatch(event.target.value)} aria-label="Patch">
                <option value="">Mais recente</option>
                {patchOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <SelectChevron label="Abrir opções de patch" onOpen={() => openNativeSelect(patchSelectRef.current)} />
            </div>
            <div className="context-chip">
              <span>REGIÃO</span>
              <select ref={regionSelectRef} value={region} onChange={(event) => setRegion(event.target.value as "br")} aria-label="Região">
                <option value="br">BR</option>
                <option value="na" disabled>NA · em breve</option>
                <option value="euw" disabled>EUW · em breve</option>
                <option value="kr" disabled>KR · em breve</option>
              </select>
              <SelectChevron label="Abrir opções de região" onOpen={() => openNativeSelect(regionSelectRef.current)} />
            </div>
            <div className="context-chip">
              <span>ELO</span>
              <select ref={eloSelectRef} value={elo} onChange={(event) => setElo(event.target.value)} aria-label="Faixa de elo">
                {eloOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <SelectChevron label="Abrir opções de elo" onOpen={() => openNativeSelect(eloSelectRef.current)} />
            </div>
          </div>
        </section>

        <section className={`demo-notice ${dataStatus === "error" ? "demo-notice-error" : ""}`} aria-label="Aviso sobre os dados">
          <span className="demo-notice-icon">i</span>
          <p>
            {dataStatus === "loading" ? (
              <><strong>Carregando dados.</strong> Consultando a amostra coletada da Riot.</>
            ) : dataStatus === "error" ? (
              <><strong>Não foi possível carregar os dados.</strong> A API da tier list está indisponível. Tente novamente em instantes.</>
            ) : dataMeta?.preliminary ? (
              <><strong>Prévia preliminar — não é uma tier list confiável.</strong> Dados reais coletados da Riot, mas ainda abaixo do mínimo de {dataMeta.minimumGames ?? 50} partidas por campeão/função. Os tiers e scores são provisórios.</>
            ) : (
              <><strong>Dados oficiais da amostra processada.</strong> A classificação só inclui campeões que atingiram o mínimo de partidas e diversidade.</>
            )}
          </p>
          {dataStatus === "error" ? (
            <button type="button" className="notice-retry" onClick={() => setReloadKey((key) => key + 1)}>
              Tentar novamente
            </button>
          ) : null}
          <span className="demo-patch-label">BR · {dataMeta?.patch ?? "—"}</span>
        </section>

        <section className="patch-highlights" aria-label="Destaques do patch">
          <article className="highlight-card">
            <span className="highlight-icon highlight-climb"><Icon name="arrow" size={16} /></span>
            <div className="highlight-copy"><span>MAIOR PONTUAÇÃO</span><strong>{filteredEntries[0]?.name ?? "—"}</strong></div>
            <span className="highlight-metric">{filteredEntries[0]?.score.toFixed(1).replace(".", ",") ?? "—"}</span>
          </article>
          <article className="highlight-card">
            <span className="highlight-icon highlight-ban">⌑</span>
            <div className="highlight-copy"><span>MAIS BANIDO</span><strong>{mostBanned?.name ?? "—"}</strong></div>
            <span className="highlight-metric">{mostBanned ? formatPercent(mostBanned.banRate) : "—"}</span>
          </article>
          <article className="highlight-card">
            <span className="highlight-icon highlight-win">↗</span>
            <div className="highlight-copy"><span>MELHOR WIN RATE</span><strong>{highestWinRate?.name ?? "—"}</strong></div>
            <span className="highlight-metric">{highestWinRate ? formatPercent(highestWinRate.winRate) : "—"}</span>
          </article>
          <div className="games-processed">
            <span className="processed-indicator" />
            <div><strong>{shownGames.toLocaleString("pt-BR")}</strong><span>PARTIDAS ANALISADAS</span></div>
          </div>
        </section>

        <section className="filters-sticky" aria-label="Filtros da tier list">
          <div className="filter-main-row">
            <nav className="role-tabs" aria-label="Filtrar tier list por rota">
              {roleOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`role-tab ${role === option.value ? "role-tab-active" : ""}`}
                  style={option.value === "all" ? undefined : { "--role-color": `var(--role-${option.value.toLowerCase()})` } as CSSProperties}
                  onClick={() => setRole(option.value)}
                  aria-pressed={role === option.value}
                >
                  <span className={`role-tab-icon ${option.value === "all" ? "role-tab-icon-all" : ""}`}>
                    {option.value === "all" ? <Icon name="star" size={17} /> : <RoleIcon role={option.value} />}
                  </span>
                  <span>{option.value === "all" ? "Todas" : option.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="filter-main-row filter-search-row">
            <label className="champion-search">
              <Icon name="search" size={17} />
              <input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar campeão..."
                aria-label="Buscar campeão por nome em português ou inglês"
              />
              {search ? <button type="button" onClick={() => { setSearch(""); searchRef.current?.focus(); }} aria-label="Limpar busca"><Icon name="close" size={15} /></button> : <kbd>/</kbd>}
            </label>
            <button type="button" className={`filter-pill ${favoritesOnly ? "filter-pill-active" : ""}`} onClick={() => setFavoritesOnly((value) => !value)} aria-pressed={favoritesOnly}>
              <Icon name="star" size={15} /> Favoritos
            </button>
            <button type="button" className="clear-filters" onClick={clearFilters}>Limpar filtros</button>
          </div>
          <div className="filter-sub-row">
            <div className="active-filter-count">
              <span className="count-bullet" />
              {role === "all" ? "Todas as funções" : roleLabels[role]} <span className="filter-count">{filteredEntries.length} campeões</span>
            </div>
            <div className="view-controls">
              <div className="select-compact sort-select">
                <span>ORDENAR</span>
                <select ref={sortSelectRef} value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="Ordenar campeões">
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <SelectChevron label="Abrir opções de ordenação" size={13} onOpen={() => openNativeSelect(sortSelectRef.current)} />
              </div>
              <div className="select-compact size-select">
                <span>TAMANHO</span>
                <select ref={sizeSelectRef} value={cardSize} onChange={(event) => setCardSize(event.target.value as CardSize)} aria-label="Tamanho dos cards">
                  <option value="compact">Compacto</option>
                  <option value="medium">Médio</option>
                  <option value="large">Grande</option>
                </select>
                <SelectChevron label="Abrir opções de tamanho dos cards" size={13} onOpen={() => openNativeSelect(sizeSelectRef.current)} />
              </div>
              <button type="button" className={`compare-toggle ${compare ? "toggle-on" : ""}`} onClick={() => setCompare((value) => !value)} aria-pressed={compare}>
                <span className="toggle-track"><span /></span>
                <span>Comparar patch</span>
              </button>
              <div className="view-switch" role="group" aria-label="Modo de visualização">
                <button type="button" className={view === "tiers" ? "view-active" : ""} onClick={() => setView("tiers")} aria-label="Visualizar por tiers" aria-pressed={view === "tiers"}><Icon name="grid" size={16} /></button>
                <button type="button" className={view === "table" ? "view-active" : ""} onClick={() => setView("table")} aria-label="Visualizar em tabela" aria-pressed={view === "table"}><Icon name="table" size={16} /></button>
              </div>
            </div>
          </div>
        </section>

        {view === "tiers" ? (
          <section className="tier-list" aria-label="Campeões organizados por tier">
            {dataStatus !== "ready" ? (
              <div className="empty-state" role={dataStatus === "error" ? "alert" : "status"}>
                <span className="empty-mark">{dataStatus === "loading" ? "…" : "!"}</span>
                <h2>{dataStatus === "loading" ? "Carregando amostra" : "Dados indisponíveis"}</h2>
                <p>{dataStatus === "loading" ? "Buscando os dados reais coletados para estes filtros." : "A API não conseguiu responder. Você pode tentar novamente pelo aviso acima."}</p>
              </div>
            ) : tierOrder.map((tier) => {
              const tierEntries = filteredEntries.filter((entry) => entry.tier === tier);
              const collapsed = collapsedTiers.has(tier);
              return (
                <section key={tier} className={`tier-row tier-row-${tier.replace("+", "plus")} ${tier === "S+" ? "tier-row-featured" : ""} ${tierEntries.length === 0 ? "tier-row-empty" : ""}`} aria-labelledby={`tier-heading-${tier.replace("+", "plus")}`}>
                  <button
                    type="button"
                    className="tier-summary"
                    onClick={() => setCollapsedTiers((previous) => {
                      const next = new Set(previous);
                      if (next.has(tier)) next.delete(tier);
                      else next.add(tier);
                      return next;
                    })}
                    aria-expanded={!collapsed && tierEntries.length > 0}
                  >
                    <span className="tier-grade" style={{ "--tier-color": tierColors[tier] } as CSSProperties}>{tier}</span>
                    <span className="tier-summary-copy">
                      <strong id={`tier-heading-${tier.replace("+", "plus")}`}>{tierEntries.length} {tierEntries.length === 1 ? "campeão" : "campeões"}</strong>
                      <span>{tierEntries.length ? tierLabels[tier] : "Nenhum campeão com estes filtros"}</span>
                    </span>
                    <span className="tier-chevron"><Icon name="chevron" size={16} /></span>
                  </button>
                  <div className={`tier-cards ${collapsed ? "tier-cards-collapsed" : ""}`} aria-hidden={collapsed || tierEntries.length === 0}>
                    {tierEntries.map((entry) => {
                      const key = `${entry.championId}-${entry.role}`;
                      const isMatch = !normalizedSearch || matchingKeys.has(key);
                      const sameChampionActive = activeEntry?.championId === entry.championId;
                      return (
                        <div className="card-anchor" data-champion-key={key} key={key}>
                          <ChampionCard
                            entry={entry}
                            cardKey={key}
                            active={activeKey === key}
                            dimmed={
                              (!!normalizedSearch && !isMatch) ||
                              (!!activeEntry && activeEntry.championId !== entry.championId)
                            }
                            highlighted={!!activeEntry && sameChampionActive && activeKey !== key}
                            favorite={favorites.has(entry.championId)}
                            compare={compare}
                            cardSize={cardSize}
                            imageFailed={imageFailures.has(entry.championId)}
                            onImageError={() => handleImageError(entry.championId)}
                            onEnter={(event) => handleCardEnter(entry, event)}
                            onLeave={handleCardLeave}
                            onKeyDown={handleCardKeyDown}
                            onToggleFavorite={() => handleToggleFavorite(entry.championId)}
                          />
                          {activeKey === key && activeEntry ? (
                            <div
                              className={`detail-popover detail-side-${activeSide.current}`}
                              onMouseEnter={handleDetailEnter}
                              onMouseLeave={handleCardLeave}
                            >
                              <ChampionDetail entry={entry} />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            {dataStatus === "ready" && filteredEntries.length === 0 ? (
              <div className="empty-state">
                <span className="empty-mark">?</span>
                <h2>{favoritesOnly ? "Você ainda não favoritou campeões" : entries.length === 0 ? "A amostra ainda não tem campeões classificáveis" : "Nenhum campeão encontrado"}</h2>
                <p>{favoritesOnly ? "Toque na estrela de um card para guardar seus favoritos neste navegador." : entries.length === 0 ? "A coleta precisa reunir dados suficientes e ao menos cinco campeões por função para exibir uma prévia." : "Tente mudar os filtros ou limpar a busca para ver mais resultados."}</p>
                <button type="button" className="button-primary" onClick={clearFilters}>Limpar filtros</button>
              </div>
            ) : null}
          </section>
        ) : dataStatus !== "ready" ? null : (
          <section className="table-section" aria-label="Tier list em tabela">
            {filteredEntries.length ? (
              <div className="table-scroll">
                <table className="champion-table">
                  <thead>
                    <tr>
                      <th scope="col">Tier</th>
                      <th scope="col">Campeão</th>
                      <th scope="col">Função</th>
                      <th scope="col"><button type="button" onClick={() => setSort("score")}>Pontuação</button></th>
                      <th scope="col"><button type="button" onClick={() => setSort("winRate")}>Win rate</button></th>
                      <th scope="col"><button type="button" onClick={() => setSort("pickRate")}>Pick rate</button></th>
                      <th scope="col"><button type="button" onClick={() => setSort("banRate")}>Ban rate</button></th>
                      <th scope="col">Partidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => {
                      const key = `${entry.championId}-${entry.role}`;
                      const isMatch = !normalizedSearch || matchingKeys.has(key);
                      return (
                        <tr key={key} className={normalizedSearch && !isMatch ? "table-row-dimmed" : ""}>
                          <td><span className="table-tier" style={{ "--tier-color": tierColors[entry.tier] } as CSSProperties}>{entry.tier}</span></td>
                          <td>
                            <span className="table-champion-button">
                              <span className="table-portrait"><ChampionPortrait entry={entry} imageFailed={imageFailures.has(entry.championId)} onImageError={() => handleImageError(entry.championId)} /></span>
                              <span>{entry.name}</span>
                              {entry.lowSample ? <span className="low-sample-label">AMOSTRA BAIXA</span> : null}
                            </span>
                          </td>
                          <td><span className="table-role"                           style={{ "--role-color": `var(--role-${entry.role.toLowerCase()})` } as CSSProperties}><RoleIcon role={entry.role} />{roleLabels[entry.role]}</span></td>
                          <td>{entry.score.toFixed(1).replace(".", ",")}</td>
                          <td>{formatPercent(entry.winRate)}</td>
                          <td>{formatPercent(entry.pickRate)}</td>
                          <td>{formatPercent(entry.banRate)}</td>
                          <td>{entry.games.toLocaleString("pt-BR")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-mark">?</span>
                <h2>Nenhum resultado para mostrar</h2>
                <p>Adicione favoritos ou ajuste os filtros para preencher esta tabela.</p>
                <button type="button" className="button-primary" onClick={clearFilters}>Limpar filtros</button>
              </div>
            )}
          </section>
        )}

        <footer className="site-footer">
          <a className="footer-brand" href="/"><BrandMark /><span>AHRI<span>A</span>DEMIA</span></a>
          <p>Sua academia para evoluir no Rift.</p>
          <p className="riot-disclaimer">
            Ahriademia não é endossado pela Riot Games e não reflete as opiniões de pessoas oficialmente envolvidas na produção ou no gerenciamento das propriedades da Riot Games. Riot Games e todas as propriedades associadas são marcas comerciais ou registradas da Riot Games, Inc.
          </p>
        </footer>
      </div>

    </main>
  );
}
