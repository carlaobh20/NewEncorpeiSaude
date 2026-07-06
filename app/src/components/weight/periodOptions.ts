export type PeriodKey = "7" | "30" | "90" | "365" | "all";

export const PERIOD_OPTIONS: Array<{
  key: PeriodKey;
  label: string;
  /** Versão curta usada nas tabs compactas do mobile */
  shortLabel: string;
  days: number | null;
}> = [
  { key: "7", label: "Últimos 7 dias", shortLabel: "7D", days: 7 },
  { key: "30", label: "Últimos 30 dias", shortLabel: "30D", days: 30 },
  { key: "90", label: "Últimos 90 dias", shortLabel: "90D", days: 90 },
  { key: "365", label: "Último ano", shortLabel: "1A", days: 365 },
  { key: "all", label: "Tudo", shortLabel: "Tudo", days: null },
];
