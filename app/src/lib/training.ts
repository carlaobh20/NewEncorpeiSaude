import { supabase } from './supabase'
import { program } from './programSeed'

export type DBExercise = { id: string; name: string; muscle: string; target_sets: number; target_reps: string; rest_sec: number }
export type DBRoutine = { id: string; key: string; name: string; focus: string; cardio_min: number; muscles: string[]; exercises: DBExercise[] }

export async function fetchRoutines(userId: string): Promise<DBRoutine[]> {
  const { data: routines, error } = await supabase.from('routines').select('*').eq('user_id', userId).order('position')
  if (error) throw error
  if (!routines?.length) return []
  const { data: exs } = await supabase.from('routine_exercises').select('*').eq('user_id', userId).order('position')
  const seen = new Set<string>()
  return routines
    .map((r) => ({
      id: r.id, key: r.key, name: r.name, focus: r.focus, cardio_min: r.cardio_min, muscles: r.muscles || [],
      exercises: (exs || []).filter((e) => e.routine_id === r.id),
    }))
    .filter((r) => (seen.has(r.key) ? false : (seen.add(r.key), true)))
}

// Semeia o programa do Carlos + perfil na primeira vez. Trava garante 1x por sessão.
let seedLock: Promise<void> | null = null
export function seedProgramIfEmpty(userId: string, name: string) {
  if (!seedLock) seedLock = doSeed(userId, name).catch((e) => { seedLock = null; throw e })
  return seedLock
}
async function doSeed(userId: string, name: string) {
  const { data: existing } = await supabase.from('routines').select('id').eq('user_id', userId).limit(1)
  if (existing && existing.length) return
  await supabase.from('profiles').upsert({ id: userId, name, height_cm: 197, target_kg: 100, workout_goal_per_week: 5 }, { onConflict: 'id' })
  const today = new Date().toISOString().slice(0, 10)
  await supabase.from('weights').upsert({ user_id: userId, date: today, kg: 110 }, { onConflict: 'user_id,date' })
  for (let i = 0; i < program.length; i++) {
    const r = program[i]
    const { data: ins } = await supabase.from('routines').insert({
      user_id: userId, key: r.key, name: r.name, focus: r.focus, day_of_week: r.day, cardio_min: r.cardio, position: i, muscles: r.muscles,
    }).select('id').single()
    if (!ins) continue
    const rows = r.exercises.map((e, j) => ({
      user_id: userId, routine_id: ins.id, name: e.name, muscle: e.muscle,
      target_sets: e.sets, target_reps: e.reps, rest_sec: e.rest, position: j,
    }))
    await supabase.from('routine_exercises').insert(rows)
  }
}

export async function saveSession(userId: string, routineId: string, name: string,
  sets: { exercise: string; index: number; load: number; reps: number; rpe: number }[],
  durationSec: number) {
  const volume = sets.reduce((a, s) => a + s.load * s.reps, 0)
  const { data: sess } = await supabase.from('training_sessions').insert({
    user_id: userId, routine_id: routineId, name, finished_at: new Date().toISOString(), total_volume: volume, duration_sec: durationSec,
  }).select('id').single()
  if (!sess) return
  await supabase.from('session_sets').insert(sets.map((s) => ({
    user_id: userId, session_id: sess.id, exercise_name: s.exercise, set_index: s.index, load: s.load, reps: s.reps, rpe: s.rpe, done: true,
  })))
}

export async function createRoutine(userId: string, name: string,
  exercises: { name: string; sets: number; reps: number }[]) {
  const { count } = await supabase.from('routines').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  const { data: ins } = await supabase.from('routines').insert({
    user_id: userId, key: name, name, focus: 'Personalizado', position: count || 0, muscles: [],
  }).select('id').single()
  if (!ins) return
  await supabase.from('routine_exercises').insert(exercises.map((e, j) => ({
    user_id: userId, routine_id: ins.id, name: e.name, muscle: 'Exercício',
    target_sets: e.sets, target_reps: String(e.reps), rest_sec: 60, position: j,
  })))
}

export type TrainingStats = {
  weekVolume: { d: string; kg: number }[]
  volumeTotal: number; avgLoad: number; sessions: number; maxLoad: number
  freqDays: number
  last: null | { name: string; date: string; volume: number; durationMin: number; exercises: number; series: number; calories: number }
}

export async function fetchTrainingStats(userId: string): Promise<TrainingStats> {
  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const empty: TrainingStats = { weekVolume: labels.map((d) => ({ d, kg: 0 })), volumeTotal: 0, avgLoad: 0, sessions: 0, maxLoad: 0, freqDays: 0, last: null }

  const since = new Date(); since.setDate(since.getDate() - 30)
  const { data: sess } = await supabase.from('training_sessions')
    .select('id,name,finished_at,total_volume,duration_sec')
    .eq('user_id', userId).not('finished_at', 'is', null)
    .gte('finished_at', since.toISOString()).order('finished_at', { ascending: false })
  if (!sess || !sess.length) return empty

  const ids = sess.map((s) => s.id)
  const { data: sets } = await supabase.from('session_sets')
    .select('session_id,exercise_name,load,reps,set_index').in('session_id', ids)

  const now = new Date(); const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0)
  const week = labels.map((d) => ({ d, kg: 0 }))
  const daysSet = new Set<string>()
  sess.forEach((s) => {
    const dt = new Date(s.finished_at as string)
    if (dt >= monday) { week[(dt.getDay() + 6) % 7].kg += Number(s.total_volume || 0); daysSet.add(dt.toISOString().slice(0, 10)) }
  })

  let sumRepLoad = 0, sumReps = 0, maxLoad = 0
  ;(sets || []).forEach((st) => { const l = Number(st.load || 0), r = Number(st.reps || 0); sumRepLoad += l * r; sumReps += r; if (l > maxLoad) maxLoad = l })
  const volumeTotal = sess.reduce((a, s) => a + Number(s.total_volume || 0), 0)

  const lastS = sess[0]
  const lastSets = (sets || []).filter((st) => st.session_id === lastS.id)
  const last = {
    name: lastS.name || 'Treino', date: new Date(lastS.finished_at as string).toLocaleDateString('pt-BR'),
    volume: Math.round(Number(lastS.total_volume || 0)), durationMin: Math.round(Number(lastS.duration_sec || 0) / 60),
    exercises: new Set(lastSets.map((s) => s.exercise_name)).size, series: lastSets.length,
    calories: Math.round(Number(lastS.total_volume || 0) * 0.05 + Number(lastS.duration_sec || 0) / 12),
  }

  return {
    weekVolume: week, volumeTotal: Math.round(volumeTotal),
    avgLoad: sumReps ? Math.round(sumRepLoad / sumReps) : 0, sessions: sess.length, maxLoad,
    freqDays: daysSet.size, last,
  }
}

export type Progress = { exercise: string; pr: number; lastLoad: number; suggested: number }
export async function computeProgression(userId: string): Promise<{ list: Progress[]; lastByExercise: Record<string, number> }> {
  const { data: sess } = await supabase.from('training_sessions').select('id,finished_at').eq('user_id', userId).not('finished_at', 'is', null).order('finished_at', { ascending: false })
  if (!sess?.length) return { list: [], lastByExercise: {} }
  const order: Record<string, number> = {}; sess.forEach((s, i) => { order[s.id] = i })
  const { data: sets } = await supabase.from('session_sets').select('session_id,exercise_name,load').in('session_id', sess.map((s) => s.id))
  const pr: Record<string, number> = {}, lastLoad: Record<string, number> = {}, lastRank: Record<string, number> = {}
  ;(sets || []).forEach((st) => {
    const name = st.exercise_name as string, l = Number(st.load || 0), rank = order[st.session_id]
    if (l > (pr[name] ?? 0)) pr[name] = l
    if (lastRank[name] === undefined || rank < lastRank[name]) { lastRank[name] = rank; lastLoad[name] = l }
    else if (rank === lastRank[name] && l > lastLoad[name]) lastLoad[name] = l
  })
  const list = Object.keys(pr).map((name) => ({
    exercise: name, pr: pr[name], lastLoad: lastLoad[name] || 0,
    suggested: Math.round(((lastLoad[name] || 0) * 1.025) * 2) / 2,
  })).sort((a, b) => b.pr - a.pr)
  return { list, lastByExercise: lastLoad }
}

export async function deleteRoutine(userId: string, id: string) {
  await supabase.from('routine_exercises').delete().eq('routine_id', id).eq('user_id', userId)
  const { error } = await supabase.from('routines').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}
