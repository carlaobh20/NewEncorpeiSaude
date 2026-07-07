import { supabase } from './supabase'

export type DayStatus = 'full' | 'partial' | 'missed' | 'rest' | 'future' | 'none' | 'off'

export type DayActivity = {
  date: string
  status: DayStatus
  manual?: boolean
  sessionName?: string
  volume?: number
  durationMin?: number
  setsDone?: number
  setsPlanned?: number
}

export type MonthActivity = {
  days: DayActivity[]
  full: number
  partial: number
  missed: number
  streak: number
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/* ── Marcação manual ── */
export async function markDay(userId: string, date: string, status: 'full' | 'partial') {
  const { error } = await supabase.from('workout_marks').upsert({ user_id: userId, date, status }, { onConflict: 'user_id,date' })
  if (error) throw error
}
export async function unmarkDay(userId: string, date: string) {
  const { error } = await supabase.from('workout_marks').delete().eq('user_id', userId).eq('date', date)
  if (error) throw error
}

/* ── Apagar uma sessão específica ── */
export async function deleteSession(userId: string, sessionId: string) {
  await supabase.from('session_sets').delete().eq('session_id', sessionId).eq('user_id', userId)
  const { error } = await supabase.from('training_sessions').delete().eq('id', sessionId).eq('user_id', userId)
  if (error) throw error
}

/** Primeira atividade registrada (sessão ou marcação) — antes disso, nada conta como falta. */
async function firstActivityDate(userId: string): Promise<string | null> {
  const [s, m] = await Promise.all([
    supabase.from('training_sessions').select('finished_at').eq('user_id', userId).not('finished_at', 'is', null).order('finished_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('workout_marks').select('date').eq('user_id', userId).order('date', { ascending: true }).limit(1).maybeSingle(),
  ])
  const sd = (s.data as { finished_at?: string } | null)?.finished_at?.slice(0, 10) ?? null
  const md = (m.data as { date?: string } | null)?.date ?? null
  if (sd && md) return sd < md ? sd : md
  return sd ?? md
}

export async function fetchMonthActivity(userId: string, year: number, month: number): Promise<MonthActivity> {
  const first = new Date(Date.UTC(year, month, 1))
  const nextMonth = new Date(Date.UTC(year, month + 1, 1))

  const [{ data: sess }, { data: marks }, start] = await Promise.all([
    supabase.from('training_sessions')
      .select('id,routine_id,name,finished_at,total_volume,duration_sec')
      .eq('user_id', userId).not('finished_at', 'is', null)
      .gte('finished_at', first.toISOString()).lt('finished_at', nextMonth.toISOString()),
    supabase.from('workout_marks')
      .select('date,status')
      .eq('user_id', userId)
      .gte('date', iso(first)).lt('date', iso(nextMonth)),
    firstActivityDate(userId),
  ])

  const sessions = sess || []
  const ids = sessions.map((s) => s.id)

  const doneBySession: Record<string, number> = {}
  if (ids.length) {
    const { data: sets } = await supabase.from('session_sets').select('session_id').in('session_id', ids)
    ;(sets || []).forEach((s) => { doneBySession[s.session_id] = (doneBySession[s.session_id] || 0) + 1 })
  }

  const plannedByRoutine: Record<string, number> = {}
  const routineIds = Array.from(new Set(sessions.map((s) => s.routine_id).filter(Boolean))) as string[]
  if (routineIds.length) {
    const { data: rex } = await supabase.from('routine_exercises').select('routine_id,target_sets').in('routine_id', routineIds)
    ;(rex || []).forEach((e) => { plannedByRoutine[e.routine_id] = (plannedByRoutine[e.routine_id] || 0) + Number(e.target_sets || 0) })
  }

  const byDay = new Map<string, typeof sessions[number]>()
  for (const s of sessions) {
    const d = (s.finished_at as string).slice(0, 10)
    const cur = byDay.get(d)
    if (!cur || Number(s.total_volume || 0) > Number(cur.total_volume || 0)) byDay.set(d, s)
  }
  const markByDay = new Map<string, 'full' | 'partial'>()
  ;(marks as { date: string; status: 'full' | 'partial' }[] | null || []).forEach((m) => markByDay.set(m.date, m.status))

  const todayStr = iso(new Date())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: DayActivity[] = []
  let full = 0, partial = 0, missed = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(Date.UTC(year, month, d))
    const dstr = iso(dt)
    const dow = dt.getUTCDay()
    const s = byDay.get(dstr)
    const mark = markByDay.get(dstr)

    if (s) {
      const done = doneBySession[s.id] || 0
      const planned = s.routine_id ? plannedByRoutine[s.routine_id] || 0 : 0
      const isFull = planned > 0 ? done >= Math.ceil(planned * 0.8) : done > 0
      days.push({
        date: dstr, status: isFull ? 'full' : 'partial', sessionName: s.name || 'Treino',
        volume: Math.round(Number(s.total_volume || 0)), durationMin: Math.round(Number(s.duration_sec || 0) / 60),
        setsDone: done, setsPlanned: planned || undefined,
      })
      isFull ? full++ : partial++
    } else if (mark) {
      days.push({ date: dstr, status: mark, manual: true, sessionName: 'Marcado manualmente' })
      mark === 'full' ? full++ : partial++
    } else if (dstr > todayStr) {
      days.push({ date: dstr, status: 'future' })
    } else if (!start || dstr < start) {
      days.push({ date: dstr, status: 'off' }) // antes do início do acompanhamento
    } else if (dow === 0 || dow === 6) {
      days.push({ date: dstr, status: 'rest' })
    } else if (dstr === todayStr) {
      days.push({ date: dstr, status: 'none' })
    } else {
      days.push({ date: dstr, status: 'missed' })
      missed++
    }
  }

  const trained = (d: string) => byDay.has(d) || markByDay.has(d)
  let streak = 0
  const cursor = new Date()
  if (!trained(iso(cursor))) cursor.setDate(cursor.getDate() - 1)
  for (let i = 0; i < 60; i++) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) {
      if (trained(iso(cursor))) streak++
      else break
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  return { days, full, partial, missed, streak }
}
