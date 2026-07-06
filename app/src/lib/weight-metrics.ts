/**
 * Pure weight-tracking helpers — used by the premium V2 weight UI.
 * No I/O; safe to unit-test.
 */

import { differenceInDays } from "date-fns";

export interface WeightEntry {
  id: string;
  weight_kg: number;
  recorded_at: string;
  notes?: string | null;
}

export interface WeightStats {
  current: WeightEntry | null;
  initial: WeightEntry | null;
  lowest: WeightEntry | null;
  highest: WeightEntry | null;
  average: number | null;
  /** kg difference from oldest to newest in the period (negative = lost). */
  variation: number | null;
  variationPct: number | null;
}

/** Sort by recorded_at descending (newest first). Non-mutating. */
export function sortDesc<T extends { recorded_at: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
  );
}

/** Filter rows that fall within `days` days of `now` (inclusive). */
export function filterByPeriod<T extends { recorded_at: string }>(
  rows: T[],
  days: number | null,
  now: Date = new Date(),
): T[] {
  if (days == null) return rows;
  const cutoff = now.getTime() - days * 86_400_000;
  return rows.filter((r) => new Date(r.recorded_at).getTime() >= cutoff);
}

export function computeStats(rows: WeightEntry[]): WeightStats {
  const empty: WeightStats = {
    current: null,
    initial: null,
    lowest: null,
    highest: null,
    average: null,
    variation: null,
    variationPct: null,
  };
  if (rows.length === 0) return empty;
  const desc = sortDesc(rows);
  const current = desc[0];
  const initial = desc[desc.length - 1];
  const lowest = desc.reduce((m, r) => (r.weight_kg < m.weight_kg ? r : m), desc[0]);
  const highest = desc.reduce((m, r) => (r.weight_kg > m.weight_kg ? r : m), desc[0]);
  const average = desc.reduce((sum, r) => sum + r.weight_kg, 0) / desc.length;
  const variation =
    desc.length >= 2 ? current.weight_kg - initial.weight_kg : null;
  const variationPct =
    variation != null && initial.weight_kg !== 0
      ? (variation / initial.weight_kg) * 100
      : null;
  return { current, initial, lowest, highest, average, variation, variationPct };
}

/**
 * Progress (0..100) towards a goal.
 * progress = ((initialW - currentW) / (initialW - targetW)) * 100
 */
export function computeGoalProgress(
  initialKg: number | null,
  currentKg: number | null,
  targetKg: number | null | undefined,
): number | null {
  if (
    initialKg == null ||
    currentKg == null ||
    targetKg == null ||
    initialKg === targetKg
  ) {
    return null;
  }
  const total = initialKg - targetKg;
  const done = initialKg - currentKg;
  // Goal can be either to lose (initial > target) or to gain (initial < target).
  // The ratio handles both as long as we use the absolute distance.
  const pct = (done / total) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** Estimated weekly loss (kg/week) over the last `windowDays` days (default 30). */
export function estimateWeeklyLoss(rows: WeightEntry[], windowDays = 30): number | null {
  const period = filterByPeriod(rows, windowDays);
  if (period.length < 2) return null;
  const desc = sortDesc(period);
  const newest = desc[0];
  const oldest = desc[desc.length - 1];
  const days = Math.max(
    1,
    differenceInDays(new Date(newest.recorded_at), new Date(oldest.recorded_at)),
  );
  const totalLoss = oldest.weight_kg - newest.weight_kg; // positive when losing
  return (totalLoss / days) * 7;
}

/**
 * Estimated date to reach the goal at the current weekly pace.
 * Returns `null` when there is no data, no goal, or pace is not aligned with the goal direction.
 */
export function estimateGoalDate(
  rows: WeightEntry[],
  targetKg: number | null | undefined,
): Date | null {
  if (targetKg == null) return null;
  const stats = computeStats(rows);
  if (!stats.current) return null;
  const remainingKg = stats.current.weight_kg - targetKg;
  // If already reached
  if (Math.abs(remainingKg) < 0.05) return new Date();
  const weeklyLoss = estimateWeeklyLoss(rows);
  if (weeklyLoss == null || weeklyLoss === 0) return null;
  // Align signs: losing weight (target < current) needs weeklyLoss > 0.
  // Gaining weight (target > current) needs weeklyLoss < 0.
  if (Math.sign(remainingKg) !== Math.sign(weeklyLoss)) return null;
  const weeksNeeded = Math.abs(remainingKg / weeklyLoss);
  if (!Number.isFinite(weeksNeeded) || weeksNeeded > 520) return null; // > 10 yrs
  const target = new Date();
  target.setDate(target.getDate() + Math.round(weeksNeeded * 7));
  return target;
}

export function calculateBmi(
  weightKg: number | null,
  heightCm: number | null | undefined,
): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export interface BmiCategory {
  label: string;
  color: string;
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return { label: "Abaixo do peso", color: "#22D3EE" };
  if (bmi < 25) return { label: "Normal", color: "#31EAA6" };
  if (bmi < 30) return { label: "Sobrepeso", color: "#FACC15" };
  if (bmi < 35) return { label: "Obesidade grau I", color: "#F97316" };
  if (bmi < 40) return { label: "Obesidade grau II", color: "#FF5D7A" };
  return { label: "Obesidade grau III", color: "#B91C1C" };
}

/** Healthy weight range for a given height in cm (BMI 18.5–24.9). */
export function getHealthyWeightRange(heightCm: number | null | undefined) {
  if (!heightCm) return null;
  const m = heightCm / 100;
  return { min: 18.5 * m * m, max: 24.9 * m * m };
}

/** Best/worst week analysis from rows. Each week starts Mon. */
export interface WeeklySummary {
  startISO: string;
  endISO: string;
  delta: number;
}

export function weeklyDeltas(rows: WeightEntry[]): WeeklySummary[] {
  if (rows.length < 2) return [];
  const desc = sortDesc(rows);
  // Group by ISO week (weekStart = Monday of the recorded week).
  const buckets = new Map<string, WeightEntry[]>();
  for (const r of desc) {
    const d = new Date(r.recorded_at);
    const day = d.getDay(); // 0..6 (Sun..Sat)
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(d);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(d.getDate() - diffToMonday);
    const key = monday.toISOString().slice(0, 10);
    const list = buckets.get(key) ?? [];
    list.push(r);
    buckets.set(key, list);
  }
  const summaries: WeeklySummary[] = [];
  for (const [start, list] of buckets) {
    if (list.length < 2) continue;
    const sorted = sortDesc(list);
    const newest = sorted[0];
    const oldest = sorted[sorted.length - 1];
    summaries.push({
      startISO: start,
      endISO: newest.recorded_at,
      delta: newest.weight_kg - oldest.weight_kg,
    });
  }
  return summaries.sort(
    (a, b) => new Date(b.startISO).getTime() - new Date(a.startISO).getTime(),
  );
}

export function bestAndWorstWeek(rows: WeightEntry[]) {
  const weeks = weeklyDeltas(rows);
  if (weeks.length === 0) return { best: null, worst: null };
  const best = weeks.reduce((m, w) => (w.delta < m.delta ? w : m), weeks[0]);
  const worst = weeks.reduce((m, w) => (w.delta > m.delta ? w : m), weeks[0]);
  return { best, worst };
}

/** Rolling 7-point moving average → smoother trend line. */
export function trendLine(rows: WeightEntry[]): Array<WeightEntry & { trend: number }> {
  if (rows.length === 0) return [];
  const asc = [...rows].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
  return asc.map((r, i) => {
    const window = asc.slice(Math.max(0, i - 6), i + 1);
    const trend =
      window.reduce((s, w) => s + w.weight_kg, 0) / window.length;
    return { ...r, trend };
  });
}
