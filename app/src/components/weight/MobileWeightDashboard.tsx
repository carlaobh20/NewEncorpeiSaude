/**
 * MobileWeightDashboard — Layout específico para tela de celular (<768px).
 *
 * Mantém TODA a lógica de negócio do WeightTabPremium intacta (recebe dados
 * já calculados via props). Apenas reorganiza visualmente em um layout
 * compacto e otimizado para mobile, evitando o problema de cards gigantes
 * empilhados quando o desktop responsivo cai pra coluna única.
 *
 * Ordem da tela:
 *   1. MobileHeader (título + botão registrar)
 *   2. MobileHeroSummary (peso atual | progresso | meta — 3 colunas no mesmo card)
 *   3. MobileMetricsStrip (5 mini-cells de métricas em uma faixa)
 *   4. MobileWeightChart (gráfico compacto 220px de altura)
 *   5. MobileGoalBmiGrid (Análise / Projeção / IMC — 3 cards lado a lado)
 *   6. MobileHistoryPreview (5 últimos registros compactos)
 *   7. MobileInsightsCarousel (scroll horizontal de insights)
 */

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Bell,
  Edit2,
  Flag,
  Heart,
  Pencil,
  Plus,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CircularProgress } from "./CircularProgress";
import { MiniSparkline } from "./MiniSparkline";
import { useTheme } from "../../contexts/ThemeContext";
import {
  computeGoalProgress,
  calculateBmi,
  getBmiCategory,
  type WeightEntry,
  type WeightStats,
} from "../../lib/weight-metrics";
import { PERIOD_OPTIONS, type PeriodKey } from "./periodOptions";

// ─────────────────────────────────────────────────────────────────────────
// Estilo base — paleta premium adaptativa (light + dark)
// ─────────────────────────────────────────────────────────────────────────

const cardClass =
  // Light defaults
  "rounded-2xl border border-cyan-500/20 " +
  "bg-[linear-gradient(145deg,#FFFFFF,#F4F8FC)] " +
  "shadow-[0_8px_24px_rgba(15,23,42,0.06)] " +
  // Dark overrides
  "dark:border-cyan-500/15 " +
  "dark:bg-[linear-gradient(145deg,rgba(15,30,50,0.96),rgba(8,18,32,0.96))] " +
  "dark:shadow-[0_16px_40px_rgba(0,0,0,0.28)]";

// ─────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────

interface Props {
  allEntries: WeightEntry[];
  periodEntries: WeightEntry[];
  allStats: WeightStats;
  periodStats: WeightStats;
  recentDiff: number | null;
  goalKg: number | null;
  goalDateStr: string | null;
  heightCm: number | null;
  period: PeriodKey;
  periodLabel: string;
  isDemo: boolean;
  onPeriodChange: (p: PeriodKey) => void;
  onRegister: () => void;
  onEditGoal: () => void;
  onEditEntry: (e: WeightEntry) => void;
  onDeleteEntry: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function fmtShort(iso: string | null | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "dd/MM", { locale: ptBR });
}

function fmtFull(iso: string | null | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
}

// ─────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────

export function MobileWeightDashboard({
  allEntries,
  periodEntries,
  allStats,
  periodStats,
  recentDiff,
  goalKg,
  goalDateStr,
  heightCm,
  period,
  periodLabel,
  isDemo,
  onPeriodChange,
  onRegister,
  onEditGoal,
  onEditEntry,
  onDeleteEntry,
}: Props) {
  return (
    <div className="text-slate-900 dark:text-slate-50">
      <MobileHeader onRegister={onRegister} />

      <MobileHeroSummary
        current={allStats.current}
        initial={allStats.initial}
        records={periodEntries}
        recentDiff={recentDiff}
        goalKg={goalKg}
        goalDateStr={goalDateStr}
        onRegister={onRegister}
        onEditGoal={onEditGoal}
      />

      <MobileMetricsStrip
        stats={periodStats}
        variationKg={periodStats.variation}
        variationPct={periodStats.variationPct}
      />

      <MobileWeightChart
        records={periodEntries}
        period={period}
        onPeriodChange={onPeriodChange}
      />

      <MobileGoalBmiGrid
        records={periodEntries}
        allEntries={allEntries}
        current={allStats.current}
        initial={allStats.initial}
        variationKg={periodStats.variation}
        periodLabel={periodLabel}
        goalKg={goalKg}
        goalDateStr={goalDateStr}
        heightCm={heightCm}
      />

      <MobileHistoryPreview
        entries={allEntries}
        heightCm={heightCm}
        readOnly={isDemo}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
      />

      <MobileInsightsCarousel
        records={periodEntries}
        variationKg={periodStats.variation}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 1. HEADER
// ═════════════════════════════════════════════════════════════════════════

function MobileHeader({ onRegister }: { onRegister: () => void }) {
  return (
    <header className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0">
          <Flag className="h-4 w-4 text-slate-950" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-slate-900 dark:text-slate-50">Peso</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
            Acompanhe sua evolução
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label="Notificações"
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300/60 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRegister}
          aria-label="Registrar peso"
          className="grid h-11 w-11 place-items-center rounded-xl bg-[#2EE6C6] text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 2. HERO — peso atual | progresso | meta (3 colunas no mesmo card)
// ═════════════════════════════════════════════════════════════════════════

interface HeroProps {
  current: WeightEntry | null;
  initial: WeightEntry | null;
  records: WeightEntry[];
  recentDiff: number | null;
  goalKg: number | null;
  goalDateStr: string | null;
  onRegister: () => void;
  onEditGoal: () => void;
}

function MobileHeroSummary({
  current,
  initial,
  records,
  recentDiff,
  goalKg,
  goalDateStr,
  onRegister,
  onEditGoal,
}: HeroProps) {
  // Estado vazio
  if (!current) {
    return (
      <section className={`${cardClass} mb-4 p-5`}>
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
            <Flag className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
              Registre seu primeiro peso
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Comece sua jornada acompanhando sua evolução.
            </p>
          </div>
          <button
            type="button"
            onClick={onRegister}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2EE6C6] px-4 text-xs font-bold text-slate-950"
          >
            <Plus className="h-4 w-4" /> Registrar peso
          </button>
        </div>
      </section>
    );
  }

  const sparkData = [...records]
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )
    .slice(-12)
    .map((r) => ({ value: r.weight_kg }));

  const progress = computeGoalProgress(
    initial?.weight_kg ?? null,
    current.weight_kg,
    goalKg,
  );
  const remaining = goalKg != null ? current.weight_kg - goalKg : null;
  const diffDown = (recentDiff ?? 0) < 0;
  const diffSign = (recentDiff ?? 0) > 0 ? "+" : "";
  const updatedAt = format(new Date(current.recorded_at), "dd/MM 'às' HH:mm", {
    locale: ptBR,
  });

  return (
    <section className={`${cardClass} mb-4 p-4`}>
      <div className="grid grid-cols-[1.15fr_0.85fr_1fr] gap-2">
        {/* Coluna 1 — Peso atual */}
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-200/80">
            Peso atual
          </p>
          <div className="mt-1.5 flex items-end gap-1">
            <span className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-slate-50">
              {current.weight_kg.toFixed(1)}
            </span>
            <span className="mb-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              kg
            </span>
          </div>
          {recentDiff != null && (
            <div
              className={`mt-1.5 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                diffDown
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-rose-500/15 text-rose-300"
              }`}
            >
              {diffDown ? (
                <ArrowDown className="h-2.5 w-2.5" />
              ) : (
                <ArrowUp className="h-2.5 w-2.5" />
              )}
              {diffSign}
              {recentDiff.toFixed(1)} kg
            </div>
          )}
          <p className="mt-1.5 text-[9px] text-slate-500 dark:text-slate-500 truncate">
            Atualizado {updatedAt}
          </p>
          <div className="mt-1.5 h-[34px]">
            <MiniSparkline data={sparkData} />
          </div>
        </div>

        {/* Coluna 2 — Anel de progresso compacto */}
        <div className="flex items-center justify-center border-x border-slate-200/70 dark:border-slate-700/40 px-1">
          <CircularProgress
            value={progress ?? 0}
            size={92}
            strokeWidth={8}
            topLabel="Meta"
            bottomLabel="objetivo"
          />
        </div>

        {/* Coluna 3 — Meta */}
        <div className="min-w-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-200/80">
            Meta
          </p>
          {goalKg != null ? (
            <>
              <div className="mt-1.5 flex items-end justify-end gap-1">
                <span className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-slate-50">
                  {goalKg.toFixed(1)}
                </span>
                <span className="mb-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  kg
                </span>
              </div>
              {remaining != null && Math.abs(remaining) > 0.05 && (
                <p
                  className={`mt-1.5 text-[11px] font-bold ${
                    remaining > 0 ? "text-emerald-300" : "text-cyan-300"
                  }`}
                >
                  {remaining > 0
                    ? `Faltam ${remaining.toFixed(1)} kg`
                    : `+${Math.abs(remaining).toFixed(1)} kg acima`}
                </p>
              )}
              {goalDateStr && (
                <p className="mt-1 text-[9px] text-slate-500 dark:text-slate-500 leading-snug">
                  Para {fmtFull(goalDateStr)}
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Defina uma meta
            </p>
          )}
          <button
            type="button"
            onClick={onEditGoal}
            className="mt-2 inline-flex h-8 items-center gap-1 rounded-lg border border-cyan-400/40 px-2.5 text-[10px] font-bold text-cyan-200 transition hover:bg-cyan-500/10"
          >
            <Pencil className="h-2.5 w-2.5" />
            {goalKg != null ? "Editar" : "Definir"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 3. METRICS STRIP — 5 mini-cells em uma faixa
// ═════════════════════════════════════════════════════════════════════════

interface StripProps {
  stats: WeightStats;
  variationKg: number | null;
  variationPct: number | null;
}

function MobileMetricsStrip({ stats, variationKg, variationPct }: StripProps) {
  const lostTone = variationKg != null && variationKg < 0;
  const variationStr =
    variationKg != null
      ? `${variationKg > 0 ? "+" : ""}${variationKg.toFixed(1)}`
      : "—";

  const cells = [
    {
      icon: <Flag className="h-3.5 w-3.5 text-cyan-300" />,
      label: "Inicial",
      value: stats.initial ? `${stats.initial.weight_kg.toFixed(1)}` : "—",
      hint: fmtShort(stats.initial?.recorded_at),
      tone: "neutral" as const,
    },
    {
      icon: <ArrowDown className="h-3.5 w-3.5 text-emerald-300" />,
      label: "Menor",
      value: stats.lowest ? `${stats.lowest.weight_kg.toFixed(1)}` : "—",
      hint: fmtShort(stats.lowest?.recorded_at),
      tone: "positive" as const,
    },
    {
      icon: <ArrowUp className="h-3.5 w-3.5 text-rose-300" />,
      label: "Maior",
      value: stats.highest ? `${stats.highest.weight_kg.toFixed(1)}` : "—",
      hint: fmtShort(stats.highest?.recorded_at),
      tone: "negative" as const,
    },
    {
      icon: <Activity className="h-3.5 w-3.5 text-cyan-300" />,
      label: "Média",
      value: stats.average != null ? `${stats.average.toFixed(1)}` : "—",
      hint: undefined,
      tone: "neutral" as const,
    },
    {
      icon: <TrendingDown className="h-3.5 w-3.5 text-cyan-300" />,
      label: "Variação",
      value: variationStr,
      hint:
        variationPct != null ? `${Math.abs(variationPct).toFixed(1)}%` : undefined,
      tone: lostTone ? ("positive" as const) : ("neutral" as const),
    },
  ];

  return (
    <section
      className={`${cardClass} mb-4 grid grid-cols-5 overflow-hidden p-0`}
    >
      {cells.map((c, i) => {
        const valColor =
          c.tone === "positive"
            ? "text-emerald-300"
            : c.tone === "negative"
              ? "text-rose-300"
              : "text-slate-900 dark:text-slate-50";
        return (
          <div
            key={c.label}
            className={`min-w-0 px-1.5 py-2.5 text-center ${
              i < cells.length - 1 ? "border-r border-slate-200/70 dark:border-slate-700/40" : ""
            }`}
          >
            <div className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full bg-cyan-500/10">
              {c.icon}
            </div>
            <p className="truncate text-[9px] uppercase tracking-wide text-slate-600 dark:text-slate-400">
              {c.label}
            </p>
            <p className={`mt-0.5 text-xs font-bold ${valColor}`}>{c.value}</p>
            {c.hint && (
              <p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-500 truncate">
                {c.hint}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 4. CHART — gráfico compacto
// ═════════════════════════════════════════════════════════════════════════

interface ChartProps {
  records: WeightEntry[];
  period: PeriodKey;
  onPeriodChange: (p: PeriodKey) => void;
}

function MobileWeightChart({ records, period, onPeriodChange }: ChartProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Cores dinâmicas conforme tema
  const chartColors = isLight
    ? {
        gridStroke: "rgba(15,23,42,0.06)",
        axisStroke: "#94A3B8",
        tickFill: "#64748B",
        tooltipBg: "rgba(255,255,255,0.98)",
        tooltipBorder: "1px solid rgba(46,230,198,0.35)",
        tooltipText: "#0F172A",
        labelText: "#64748B",
        dotStroke: "#FFFFFF",
      }
    : {
        gridStroke: "rgba(148,163,184,0.08)",
        axisStroke: "#64748B",
        tickFill: "#94A3B8",
        tooltipBg: "rgba(8,18,32,0.96)",
        tooltipBorder: "1px solid rgba(46,230,198,0.25)",
        tooltipText: "#F8FAFC",
        labelText: "#94A3B8",
        dotStroke: "#06111f",
      };

  const data = [...records]
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )
    .map((r) => ({
      date: format(new Date(r.recorded_at), "dd/MM", { locale: ptBR }),
      weight: Number(r.weight_kg.toFixed(1)),
    }));

  return (
    <section className={`${cardClass} mb-4 p-4`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-slate-50">
          Evolução do peso
        </h2>
        <div className="flex overflow-hidden rounded-lg border border-slate-300/60 dark:border-slate-700/70">
          {PERIOD_OPTIONS.map((opt) => {
            const active = opt.key === period;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onPeriodChange(opt.key)}
                className={`px-2 py-1 text-[10px] font-semibold transition ${
                  active
                    ? "bg-slate-200 dark:bg-slate-700/80 text-slate-900 dark:text-slate-50"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200"
                }`}
              >
                {opt.shortLabel ?? opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[220px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200/70 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-500">
            Nenhum dado no período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="mobileWeightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2EE6C6" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#2EE6C6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.gridStroke}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke={chartColors.axisStroke}
                tick={{ fontSize: 9, fill: chartColors.tickFill }}
                interval="preserveStartEnd"
                minTickGap={20}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke={chartColors.axisStroke}
                tick={{ fontSize: 9, fill: chartColors.tickFill }}
                width={34}
                axisLine={false}
                tickLine={false}
                domain={["dataMin - 1", "dataMax + 1"]}
              />
              <Tooltip
                contentStyle={{
                  background: chartColors.tooltipBg,
                  border: chartColors.tooltipBorder,
                  borderRadius: 10,
                  fontSize: 11,
                  color: chartColors.tooltipText,
                }}
                labelStyle={{ color: chartColors.labelText, fontSize: 10 }}
                formatter={(v: number) => [`${v.toFixed(1)} kg`, "Peso"]}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#2EE6C6"
                strokeWidth={2}
                fill="url(#mobileWeightGrad)"
                dot={{ r: 3, fill: "#2EE6C6", stroke: chartColors.dotStroke, strokeWidth: 1 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 5. GOAL/BMI GRID — Análise / Projeção / IMC
// ═════════════════════════════════════════════════════════════════════════

interface GridProps {
  records: WeightEntry[];
  allEntries: WeightEntry[];
  current: WeightEntry | null;
  initial: WeightEntry | null;
  variationKg: number | null;
  periodLabel: string;
  goalKg: number | null;
  goalDateStr: string | null;
  heightCm: number | null;
}

function MobileGoalBmiGrid({
  records,
  current,
  variationKg,
  periodLabel,
  goalKg,
  goalDateStr,
  heightCm,
}: GridProps) {
  // Análise
  const sortedAsc = [...records].sort(
    (a, b) =>
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
  const diffs: number[] = [];
  for (let i = 1; i < sortedAsc.length; i++) {
    diffs.push(sortedAsc[i].weight_kg - sortedAsc[i - 1].weight_kg);
  }
  const best = diffs.length ? Math.min(...diffs) : null;
  const worst = diffs.length ? Math.max(...diffs) : null;
  const weeklyAvg = variationKg != null ? variationKg / 4 : null;

  // Projeção
  const remaining =
    current && goalKg != null ? current.weight_kg - goalKg : null;
  const goalProgress =
    current && goalKg != null && Math.abs(current.weight_kg - goalKg) > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((sortedAsc[0]?.weight_kg ?? current.weight_kg) - current.weight_kg) /
              ((sortedAsc[0]?.weight_kg ?? current.weight_kg) - goalKg) *
              100,
          ),
        )
      : null;

  // IMC
  const bmi = calculateBmi(current?.weight_kg ?? null, heightCm);
  const bmiCat = bmi != null ? getBmiCategory(bmi) : null;

  return (
    <section className="mb-4 grid grid-cols-3 gap-2">
      {/* Análise */}
      <div className={`${cardClass} p-3`}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Análise
        </p>
        <p className="text-[9px] text-slate-500 dark:text-slate-500">{periodLabel}</p>
        <div className="mt-2 space-y-1">
          <p
            className={`text-base font-bold ${
              variationKg != null && variationKg < 0
                ? "text-emerald-300"
                : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {variationKg != null
              ? `${variationKg < 0 ? "-" : "+"}${Math.abs(variationKg).toFixed(1)} kg`
              : "—"}
          </p>
          {weeklyAvg != null && (
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Média/sem {Math.abs(weeklyAvg).toFixed(2)} kg
            </p>
          )}
          {best != null && (
            <p className="text-[10px] text-slate-500 dark:text-slate-500">
              Melhor: {best.toFixed(1)} kg
            </p>
          )}
          {worst != null && (
            <p className="text-[10px] text-slate-500 dark:text-slate-500">
              Pior: {worst > 0 ? "+" : ""}
              {worst.toFixed(1)} kg
            </p>
          )}
        </div>
      </div>

      {/* Meta / Projeção */}
      <div className={`${cardClass} p-3`}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Meta
        </p>
        {goalKg != null ? (
          <>
            <p className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {goalDateStr ? fmtFull(goalDateStr) : "—"}
            </p>
            {remaining != null && (
              <p
                className={`mt-1.5 text-[11px] font-bold ${
                  remaining > 0 ? "text-emerald-300" : "text-cyan-300"
                }`}
              >
                {remaining > 0
                  ? `Faltam ${remaining.toFixed(1)} kg`
                  : `+${Math.abs(remaining).toFixed(1)} acima`}
              </p>
            )}
            {goalProgress != null && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-[9px] text-slate-500 dark:text-slate-500">
                  {goalProgress.toFixed(0)}% do caminho
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-[10px] text-slate-600 dark:text-slate-400">
            Defina uma meta para ver a projeção
          </p>
        )}
      </div>

      {/* IMC */}
      <div className={`${cardClass} p-3`}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          IMC
        </p>
        {bmi != null && bmiCat ? (
          <>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              {bmi.toFixed(1)}
            </p>
            <p
              className="text-[10px] font-semibold"
              style={{ color: bmiCat.color }}
            >
              {bmiCat.label}
            </p>
            <div className="mt-2">
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 via-amber-400 to-rose-400">
                <div
                  className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded bg-slate-50 shadow-md"
                  style={{
                    left: `${Math.min(100, Math.max(0, ((bmi - 16) / 24) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[8px] text-slate-500 dark:text-slate-500">
                <span>16</span>
                <span>40</span>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[10px] text-slate-600 dark:text-slate-400">
            Configure altura no perfil
          </p>
        )}
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 6. HISTORY PREVIEW — 5 últimos registros compactos
// ═════════════════════════════════════════════════════════════════════════

interface HistoryProps {
  entries: WeightEntry[];
  heightCm: number | null;
  readOnly: boolean;
  onEditEntry: (e: WeightEntry) => void;
  onDeleteEntry: (id: string) => void;
}

function MobileHistoryPreview({
  entries,
  readOnly,
  onEditEntry,
  onDeleteEntry,
}: HistoryProps) {
  const desc = [...entries].sort(
    (a, b) =>
      new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
  );
  const top = desc.slice(0, 5);

  return (
    <section className={`${cardClass} mb-4 p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-slate-50">
          Histórico
        </h2>
        <p className="text-[10px] text-slate-600 dark:text-slate-400">{entries.length} registros</p>
      </div>

      {top.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200/70 dark:border-slate-700/50 p-4 text-center text-xs text-slate-500 dark:text-slate-500">
          Nenhum registro ainda
        </div>
      ) : (
        <div className="divide-y divide-slate-200/70 dark:divide-slate-700/40">
          {top.map((entry, idx) => {
            const prev = top[idx + 1];
            const variation = prev ? entry.weight_kg - prev.weight_kg : null;
            const down = (variation ?? 0) < 0;
            const variationClass =
              variation == null
                ? "text-slate-500 dark:text-slate-500"
                : down
                  ? "text-emerald-300"
                  : "text-rose-300";
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {fmtFull(entry.recorded_at)}
                  </p>
                  <p className="truncate text-[10px] text-slate-500 dark:text-slate-500">
                    {entry.notes || "Sem observação"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    {entry.weight_kg.toFixed(1)} kg
                  </p>
                  {variation != null && (
                    <p className={`text-[10px] font-semibold ${variationClass}`}>
                      {down ? "↓" : "↑"} {Math.abs(variation).toFixed(1)} kg
                    </p>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditEntry(entry)}
                      aria-label="Editar registro"
                      className="grid h-7 w-7 place-items-center rounded-lg border border-slate-300/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      aria-label="Excluir registro"
                      className="grid h-7 w-7 place-items-center rounded-lg border border-slate-300/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-rose-400/40 hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {entries.length > 5 && (
        <button
          type="button"
          className="mt-3 h-10 w-full rounded-xl border border-slate-300/60 dark:border-slate-700/70 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-cyan-400/40 hover:text-cyan-200"
        >
          Ver todos ({entries.length})
        </button>
      )}
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 7. INSIGHTS CAROUSEL — scroll horizontal
// ═════════════════════════════════════════════════════════════════════════

interface InsightsProps {
  records: WeightEntry[];
  variationKg: number | null;
}

interface MobileInsight {
  Icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  highlight: string;
  description: string;
  highlightColor: string;
}

function buildMobileInsights(
  records: WeightEntry[],
  variationKg: number | null,
): MobileInsight[] {
  const days = new Set(records.map((r) => r.recorded_at.slice(0, 10))).size;

  const consistency: MobileInsight = {
    Icon: Star,
    iconColor: "text-amber-300",
    title: "Consistência",
    highlight:
      days === 0
        ? "Comece hoje"
        : `${days} dia${days === 1 ? "" : "s"} registrado${days === 1 ? "" : "s"}`,
    highlightColor: "text-emerald-300",
    description:
      days === 0
        ? "Comece com 1 registro hoje."
        : days < 7
          ? "Bom começo! Continue."
          : days < 21
            ? "Construindo o hábito."
            : "Excelente consistência!",
  };

  const trend: MobileInsight =
    variationKg == null
      ? {
          Icon: TrendingDown,
          iconColor: "text-cyan-300",
          title: "Tendência",
          highlight: "Sem dados",
          highlightColor: "text-slate-700 dark:text-slate-200",
          description: "Faça mais 1 ou 2 registros.",
        }
      : variationKg < -0.2
        ? {
            Icon: TrendingDown,
            iconColor: "text-emerald-300",
            title: "Tendência",
            highlight: "Queda saudável",
            highlightColor: "text-emerald-300",
            description: "Seu peso está diminuindo bem.",
          }
        : variationKg > 0.2
          ? {
              Icon: TrendingUp,
              iconColor: "text-rose-300",
              title: "Tendência",
              highlight: "Leve alta",
              highlightColor: "text-rose-300",
              description: "Reveja alimentação e hidratação.",
            }
          : {
              Icon: TrendingDown,
              iconColor: "text-cyan-300",
              title: "Tendência",
              highlight: "Estável",
              highlightColor: "text-cyan-300",
              description: "Peso se mantendo no período.",
            };

  const recommendation: MobileInsight =
    variationKg != null && variationKg < -0.2
      ? {
          Icon: Heart,
          iconColor: "text-rose-300",
          title: "Recomendação",
          highlight: "Continue assim!",
          highlightColor: "text-emerald-300",
          description: "Você está no caminho certo.",
        }
      : variationKg != null && variationKg > 0.2
        ? {
            Icon: Heart,
            iconColor: "text-rose-300",
            title: "Recomendação",
            highlight: "Pequenos ajustes",
            highlightColor: "text-amber-300",
            description: "Reduza ultraprocessados.",
          }
        : {
            Icon: Heart,
            iconColor: "text-rose-300",
            title: "Recomendação",
            highlight: "Mantenha o registro",
            highlightColor: "text-cyan-300",
            description: "Consistência gera insights.",
          };

  return [consistency, trend, recommendation];
}

function MobileInsightsCarousel({ records, variationKg }: InsightsProps) {
  const insights = buildMobileInsights(records, variationKg);

  return (
    <section className="mb-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-slate-50">
          Insights inteligentes
        </h2>
        <p className="text-[10px] text-slate-600 dark:text-slate-400">Baseado nos seus dados</p>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {insights.map((ins) => {
          const Icon = ins.Icon;
          return (
            <div
              key={ins.title}
              className={`${cardClass} min-w-[220px] max-w-[240px] shrink-0 p-4 snap-start`}
            >
              <div className={`${ins.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500">
                {ins.title}
              </p>
              <p
                className={`mt-1 text-sm font-bold ${ins.highlightColor}`}
              >
                {ins.highlight}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                {ins.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
