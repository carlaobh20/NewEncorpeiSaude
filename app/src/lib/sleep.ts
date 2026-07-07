import { supabase } from './supabase'

export type SleepFull = {
  date: string
  hours: number
  quality?: number | null
  bed_time?: string | null
  wake_time?: string | null
}

/** Calcula horas entre dormir e acordar (atravessa a meia-noite). */
export function hoursBetween(bed: string, wake: string): number {
  const [bh, bm] = bed.split(':').map(Number)
  const [wh, wm] = wake.split(':').map(Number)
  let mins = wh * 60 + wm - (bh * 60 + bm)
  if (mins <= 0) mins += 24 * 60
  return Math.round((mins / 60) * 10) / 10
}

export async function saveSleepFull(userId: string, s: SleepFull) {
  const { error } = await supabase.from('sleep_logs').upsert(
    { user_id: userId, date: s.date, hours: s.hours, quality: s.quality ?? null, bed_time: s.bed_time ?? null, wake_time: s.wake_time ?? null },
    { onConflict: 'user_id,date' },
  )
  if (error) throw error
}

export async function getSleepFull(userId: string, date: string): Promise<SleepFull | null> {
  const { data } = await supabase.from('sleep_logs').select('date,hours,quality,bed_time,wake_time').eq('user_id', userId).eq('date', date).maybeSingle()
  return (data as SleepFull) || null
}

export async function listSleepFull(userId: string, limit = 14): Promise<SleepFull[]> {
  const { data } = await supabase.from('sleep_logs').select('date,hours,quality,bed_time,wake_time').eq('user_id', userId).order('date', { ascending: false }).limit(limit)
  return (data as SleepFull[]) || []
}

/* ── Suplementos: adesão semanal ── */
export async function supplementWeekStats(userId: string, totalSupplements: number): Promise<{ takenCount: number; possible: number; pct: number }> {
  const from = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  const { data } = await supabase.from('supplement_logs').select('date,taken').eq('user_id', userId).gte('date', from).eq('taken', true)
  const takenCount = (data || []).length
  const possible = totalSupplements * 7
  return { takenCount, possible, pct: possible > 0 ? Math.min(100, Math.round((takenCount / possible) * 100)) : 0 }
}
