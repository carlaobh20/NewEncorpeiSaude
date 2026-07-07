import { supabase } from './supabase'

export type AgendaCategory = 'saude' | 'treino' | 'consulta' | 'pessoal' | 'trabalho'

export const CATEGORIES: { k: AgendaCategory; label: string; emoji: string; color: string }[] = [
  { k: 'saude', label: 'Saúde', emoji: '💊', color: '#0E9F6E' },
  { k: 'treino', label: 'Treino', emoji: '🏋️', color: '#F97316' },
  { k: 'consulta', label: 'Consulta', emoji: '🩺', color: '#3B82F6' },
  { k: 'pessoal', label: 'Pessoal', emoji: '⭐', color: '#A855F7' },
  { k: 'trabalho', label: 'Trabalho', emoji: '💼', color: '#64748B' },
]
export const catOf = (k: string) => CATEGORIES.find((c) => c.k === k) ?? CATEGORIES[3]

export type Compromisso = {
  id: string
  title: string
  date: string
  time?: string | null
  category: AgendaCategory
  notes?: string | null
  done: boolean
}

export type Recorrente = {
  id: string
  title: string
  time?: string | null
  days: number[] // 0=dom .. 6=sáb
  category: AgendaCategory
  active: boolean
}

/** Item unificado exibido na agenda (único ou instância de recorrente). */
export type AgendaItem = {
  key: string
  id: string
  kind: 'unico' | 'recorrente'
  title: string
  date: string
  time?: string | null
  category: AgendaCategory
  notes?: string | null
  done: boolean
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/* ── CRUD ── */
export async function listCompromissos(userId: string, from: string, to: string): Promise<Compromisso[]> {
  const { data } = await supabase.from('compromissos').select('*').eq('user_id', userId).gte('date', from).lte('date', to).order('date').order('time')
  return (data as Compromisso[]) || []
}
export async function addCompromisso(userId: string, c: { title: string; date: string; time?: string; category: string; notes?: string }) {
  const { error } = await supabase.from('compromissos').insert({ user_id: userId, ...c })
  if (error) throw error
}
export async function toggleCompromisso(userId: string, id: string, done: boolean) {
  const { error } = await supabase.from('compromissos').update({ done }).eq('id', id).eq('user_id', userId)
  if (error) throw error
}
export async function deleteCompromisso(userId: string, id: string) {
  const { error } = await supabase.from('compromissos').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function listRecorrentes(userId: string): Promise<Recorrente[]> {
  const { data } = await supabase.from('compromissos_recorrentes').select('*').eq('user_id', userId).eq('active', true).order('time')
  return (data as Recorrente[]) || []
}
export async function addRecorrente(userId: string, r: { title: string; time?: string; days: number[]; category: string }) {
  const { error } = await supabase.from('compromissos_recorrentes').insert({ user_id: userId, ...r })
  if (error) throw error
}
export async function deleteRecorrente(userId: string, id: string) {
  const { error } = await supabase.from('compromissos_recorrentes').update({ active: false }).eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function listConfirmacoes(userId: string, from: string, to: string): Promise<Set<string>> {
  const { data } = await supabase.from('recorrente_confirmacoes').select('recorrente_id,date').eq('user_id', userId).gte('date', from).lte('date', to)
  return new Set(((data as { recorrente_id: string; date: string }[]) || []).map((r) => `${r.recorrente_id}|${r.date}`))
}
export async function confirmRecorrente(userId: string, recorrenteId: string, date: string) {
  const { error } = await supabase.from('recorrente_confirmacoes').upsert({ user_id: userId, recorrente_id: recorrenteId, date }, { onConflict: 'recorrente_id,date' })
  if (error) throw error
}
export async function unconfirmRecorrente(userId: string, recorrenteId: string, date: string) {
  const { error } = await supabase.from('recorrente_confirmacoes').delete().eq('recorrente_id', recorrenteId).eq('date', date).eq('user_id', userId)
  if (error) throw error
}

/* ── Montagem da agenda ── */
export function buildItems(unicos: Compromisso[], recorrentes: Recorrente[], confirmadas: Set<string>, from: string, to: string): AgendaItem[] {
  const items: AgendaItem[] = unicos.map((c) => ({
    key: `u-${c.id}`, id: c.id, kind: 'unico', title: c.title, date: c.date, time: c.time?.slice(0, 5) ?? null,
    category: c.category, notes: c.notes, done: c.done,
  }))
  const start = new Date(from + 'T12:00:00')
  const end = new Date(to + 'T12:00:00')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay()
    const dstr = iso(d)
    for (const r of recorrentes) {
      if (!r.days.includes(dow)) continue
      items.push({
        key: `r-${r.id}-${dstr}`, id: r.id, kind: 'recorrente', title: r.title, date: dstr, time: r.time?.slice(0, 5) ?? null,
        category: r.category, notes: null, done: confirmadas.has(`${r.id}|${dstr}`),
      })
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '99').localeCompare(b.time ?? '99'))
}
