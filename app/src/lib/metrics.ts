import type { AppState } from './types'
import { todayISO } from './store'

export function waterToday(s: AppState) {
  return s.water.find((w) => w.date === todayISO())?.ml ?? 0
}

export function latestWeight(s: AppState) {
  return s.weights.length ? s.weights[s.weights.length - 1].kg : null
}

export function weightDelta(s: AppState) {
  if (s.weights.length < 2) return 0
  return +(s.weights[s.weights.length - 1].kg - s.weights[0].kg).toFixed(1)
}

export function workoutsThisWeek(s: AppState) {
  const now = new Date()
  const start = new Date(now); start.setDate(now.getDate() - 6)
  const startISO = start.toISOString().slice(0, 10)
  return s.workouts.filter((w) => w.done && w.date >= startISO).length
}

export function bmi(s: AppState) {
  const w = latestWeight(s); const h = s.profile.heightCm / 100
  if (!w || !h) return null
  return +(w / (h * h)).toFixed(1)
}

// Health Score 0–100: adesão (água + treino) e evolução (rumo à meta de peso)
export function healthScore(s: AppState) {
  const water = Math.min(1, waterToday(s) / s.profile.waterGoalMl)          // 0..1
  const workout = Math.min(1, workoutsThisWeek(s) / s.profile.workoutGoalPerWeek)
  const w = latestWeight(s)
  let progress = 0.5
  if (w && s.weights.length >= 2) {
    const start = s.weights[0].kg
    const total = Math.abs(start - s.profile.targetKg) || 1
    const done = Math.abs(start - w)
    progress = Math.max(0, Math.min(1, done / total))
  }
  const score = water * 30 + workout * 35 + progress * 35
  return Math.round(score)
}

export function scoreLabel(v: number) {
  if (v >= 80) return { label: 'Excelente', tone: 'text-mint-400' }
  if (v >= 60) return { label: 'Bom', tone: 'text-mint-300' }
  if (v >= 40) return { label: 'Regular', tone: 'text-amber-300' }
  return { label: 'Atenção', tone: 'text-rose-300' }
}
