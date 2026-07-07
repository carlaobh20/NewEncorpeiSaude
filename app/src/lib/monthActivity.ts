import { supabase } from './supabase'

export type DayStatus = 'full' | 'partial' | 'missed' | 'rest' | 'future' | 'none'

export type DayActivity = {
  date: string
  status: DayStatus
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
  streak: number // dias úteis seguidos treinando (até hoje)
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Classifica cada dia do mês: completo / parcial / faltou / descanso / futuro. */
export async function fetchMonthActivity(userId: string, year: number, month: number): Promise<MonthActivity> {
  const first = new Date(Date.UTC(year, month, 1))
  const nextMonth = new Date(Date.UTC(year, month + 1, 1))

  const { data: sess } = await supabase.from('training_sessions')
    .select('id,routine_id,name,finished_at,total_volume,duration_sec')
    .eq('user_id', userId).not('finished_at', 'is', null)
    .gte('finished_at', first.toISOString()).lt('finished_at', nextMonth.toISOString())

  const sessions = sess || []
  const ids = sessions.map((s) => s.id)

  // séries feitas por sessão
  const doneBySession: Record<string, number> = {}
  if (ids.length) {
    const { data: sets } = await supabase.from('session_sets').select('session_id').in('session_id', ids)
    ;(sets || []).forEach((s) => { doneBySession[s.session_id] = (doneBySession[s.session_id] || 0) + 1 })
  }

  // séries planejadas por rotina
  const plannedByRoutine: Record<string, number> = {}
  const routineIds = Array.from(new Set(sessions.map((s) => s.routine_id).filter(Boolean))) as string[]
  if (routineIds.length) {
    const { data: rex } = await supabase.from('routine_exercises').select('routine_id,target_sets').in('routine_id', routineIds)
    ;(rex || []).forEach((e) => { plannedByRoutine[e.routine_id] = (plannedByRoutine[e.routine_id] || 0) + Number(e.target_sets || 0) })
  }

  // melhor sessão por dia
  const byDay = new Map<string, typeof sessions[number]>()
  for (const s of sessions) {
    const d = (s.finished_at as string).slice(0, 10)
    const cur = byDay.get(d)
    if (!cur || Number(s.total_volume || 0) > Number(cur.total_volume || 0)) byDay.set(d, s)
  }

  const todayStr = iso(new Date())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: DayActivity[] = []
  let full = 0, partial = 0, missed = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(Date.UTC(year, month, d))
    const dstr = iso(dt)
    const dow = dt.getUTCDay()
    const s = byDay.get(dstr)

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
    } else if (dstr > todayStr) {
      days.push({ date: dstr, status: 'future' })
    } else if (dow === 0 || dow === 6) {
      days.push({ date: dstr, status: 'rest' })
    } else if (dstr === todayStr) {
      days.push({ date: dstr, status: 'none' }) // hoje ainda dá tempo
    } else {
      days.push({ date: dstr, status: 'missed' })
      missed++
    }
  }

  // sequência: dias úteis consecutivos com treino, olhando pra trás a partir de hoje/ontem
  let streak = 0
  const cursor = new Date()
  if (!byDay.get(iso(cursor))) cursor.setDate(cursor.getDate() - 1) // hoje ainda não conta contra
  for (let i = 0; i < 60; i++) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) {
      if (byDay.get(iso(cursor))) streak++
      else break
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  return { days, full, partial, missed, streak }
}
