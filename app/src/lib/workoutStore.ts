import { useEffect, useState } from 'react'

export type UserExercise = { id: string; name: string; sets: number; reps: number; load: number }
export type UserWorkout = { id: string; name: string; exercises: UserExercise[]; createdAt: number }

const KEY = 'encorpei.workouts.v1'
const uid = () => Math.random().toString(36).slice(2, 10)

function load(): UserWorkout[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
let mem: UserWorkout[] = load()
const subs = new Set<() => void>()
function commit(next: UserWorkout[]) {
  mem = next
  try { localStorage.setItem(KEY, JSON.stringify(mem)) } catch { /* ignore */ }
  subs.forEach((f) => f())
}

export const workoutsApi = {
  all: () => mem,
  get: (id: string) => mem.find((w) => w.id === id),
  add: (name: string, exercises: Omit<UserExercise, 'id'>[]) =>
    commit([...mem, { id: uid(), name, createdAt: Date.now(), exercises: exercises.map((e) => ({ ...e, id: uid() })) }]),
  remove: (id: string) => commit(mem.filter((w) => w.id !== id)),
}

export function useWorkouts() {
  const [, force] = useState(0)
  useEffect(() => {
    const f = () => force((n) => n + 1)
    subs.add(f)
    return () => { subs.delete(f) }
  }, [])
  return { workouts: mem, api: workoutsApi }
}
