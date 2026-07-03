import { useEffect, useState } from 'react'
import type { AppState, WeightEntry, WorkoutSession } from './types'

const KEY = 'encorpei.patient.v1'
const uid = () => Math.random().toString(36).slice(2, 10)
export const todayISO = () => new Date().toISOString().slice(0, 10)

function seed(): AppState {
  const days = [...Array(14)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d.toISOString().slice(0, 10)
  })
  const weights: WeightEntry[] = days
    .filter((_, i) => i % 2 === 0)
    .map((date, i) => ({ id: uid(), date, kg: +(84.5 - i * 0.35 + (i % 2 ? 0.2 : -0.2)).toFixed(1) }))
  const water = days.map((date, i) => ({ date, ml: [1400, 1800, 2100, 900, 2300, 2000, 1700][i % 7] }))
  const workouts: WorkoutSession[] = [
    { id: uid(), date: days[13], name: 'Peito & Tríceps', done: true,
      sets: [ { exercise: 'Supino reto', reps: 10, kg: 60 }, { exercise: 'Crucifixo', reps: 12, kg: 18 }, { exercise: 'Tríceps corda', reps: 15, kg: 25 } ] },
    { id: uid(), date: days[11], name: 'Costas & Bíceps', done: true,
      sets: [ { exercise: 'Puxada frontal', reps: 10, kg: 55 }, { exercise: 'Remada baixa', reps: 12, kg: 50 } ] },
  ]
  return {
    profile: { name: 'Carlos', heightCm: 178, targetKg: 78, waterGoalMl: 2500, workoutGoalPerWeek: 4 },
    weights, water, workouts,
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch { /* ignore */ }
  const s = seed()
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
  return s
}

let mem: AppState = load()
const subs = new Set<() => void>()
function commit(next: AppState) {
  mem = next
  try { localStorage.setItem(KEY, JSON.stringify(mem)) } catch { /* ignore */ }
  subs.forEach((f) => f())
}

export function useStore() {
  const [, force] = useState(0)
  useEffect(() => {
    const f = () => force((n) => n + 1)
    subs.add(f)
    return () => { subs.delete(f) }
  }, [])

  return {
    state: mem,
    addWeight(kg: number) {
      const date = todayISO()
      const rest = mem.weights.filter((w) => w.date !== date)
      commit({ ...mem, weights: [...rest, { id: uid(), date, kg }].sort((a, b) => a.date.localeCompare(b.date)) })
    },
    addWater(ml: number) {
      const date = todayISO()
      const existing = mem.water.find((w) => w.date === date)
      const water = existing
        ? mem.water.map((w) => (w.date === date ? { ...w, ml: Math.max(0, w.ml + ml) } : w))
        : [...mem.water, { date, ml: Math.max(0, ml) }]
      commit({ ...mem, water })
    },
    toggleWorkout(id: string) {
      commit({ ...mem, workouts: mem.workouts.map((w) => (w.id === id ? { ...w, done: !w.done } : w)) })
    },
    addWorkout(name: string) {
      const s: WorkoutSession = { id: uid(), date: todayISO(), name, sets: [], done: true }
      commit({ ...mem, workouts: [s, ...mem.workouts] })
    },
    reset() { commit(seed()) },
  }
}
