export type ChampionRole = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
export type ChampionTier = "S+" | "S" | "A" | "B" | "C" | "D";

export type ChampionEntry = {
  championId: string;
  name: string;
  englishName: string;
  role: ChampionRole;
  tier: ChampionTier;
  score: number;
  winRate: number;
  winRateChange?: number;
  pickRate: number;
  banRate: number;
  kda: number;
  games: number;
  roleRate: number;
  tierChange?: "UP" | "DOWN" | "SAME";
  lowSample?: boolean;
  difficulty: number;
};

export const roleLabels: Record<ChampionRole, string> = {
  TOP: "Topo",
  JUNGLE: "Selva",
  MID: "Meio",
  ADC: "ADC",
  SUPPORT: "Suporte",
};

export const roleColors: Record<ChampionRole, string> = {
  TOP: "var(--role-top)",
  JUNGLE: "var(--role-jungle)",
  MID: "var(--role-mid)",
  ADC: "var(--role-adc)",
  SUPPORT: "var(--role-support)",
};

export const tierLabels: Record<ChampionTier, string> = {
  "S+": "Escolhas extraordinárias neste patch",
  S: "Escolhas excelentes neste patch",
  A: "Escolhas muito consistentes",
  B: "Boas opções para situações específicas",
  C: "Escolhas equilibradas",
  D: "Precisam de mais cuidado neste patch",
};

export const tierOrder: ChampionTier[] = ["S+", "S", "A", "B", "C", "D"];
