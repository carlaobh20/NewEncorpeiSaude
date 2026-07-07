import { supabase } from './supabase'

/* ── Pressão arterial ── */
export type BPRecord = { id: string; systolic: number; diastolic: number; pulse?: number | null; notes?: string | null; recorded_at: string }

export async function listBP(userId: string, limit = 30): Promise<BPRecord[]> {
  const { data } = await supabase.from('blood_pressure').select('*').eq('user_id', userId).order('recorded_at', { ascending: false }).limit(limit)
  return (data as BPRecord[]) || []
}
export async function addBP(userId: string, r: { systolic: number; diastolic: number; pulse?: number; notes?: string }) {
  const { error } = await supabase.from('blood_pressure').insert({ user_id: userId, ...r })
  if (error) throw error
}
export async function deleteBP(userId: string, id: string) {
  const { error } = await supabase.from('blood_pressure').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

/** Classificação AHA. */
export function bpClass(sys: number, dia: number): { label: string; color: string; bg: string } {
  if (sys >= 180 || dia >= 120) return { label: 'Crise — procure atendimento', color: '#991B1B', bg: 'rgba(153,27,27,0.12)' }
  if (sys >= 140 || dia >= 90) return { label: 'Hipertensão estágio 2', color: '#DC2626', bg: 'rgba(220,38,38,0.10)' }
  if (sys >= 130 || dia >= 80) return { label: 'Hipertensão estágio 1', color: '#EA580C', bg: 'rgba(234,88,12,0.10)' }
  if (sys >= 120) return { label: 'Elevada', color: '#D97706', bg: 'rgba(217,119,6,0.12)' }
  return { label: 'Normal', color: '#0E9F6E', bg: 'rgba(18,201,138,0.12)' }
}

/* ── Glicemia ── */
export type GlucoseRecord = { id: string; value_mgdl: number; context: 'jejum' | 'pos_refeicao' | 'aleatorio'; notes?: string | null; recorded_at: string }

export async function listGlucose(userId: string, limit = 30): Promise<GlucoseRecord[]> {
  const { data } = await supabase.from('glucose_logs').select('*').eq('user_id', userId).order('recorded_at', { ascending: false }).limit(limit)
  return (data as GlucoseRecord[]) || []
}
export async function addGlucose(userId: string, r: { value_mgdl: number; context: string; notes?: string }) {
  const { error } = await supabase.from('glucose_logs').insert({ user_id: userId, ...r })
  if (error) throw error
}
export async function deleteGlucose(userId: string, id: string) {
  const { error } = await supabase.from('glucose_logs').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export function glucoseClass(v: number, context: string): { label: string; color: string; bg: string } {
  const fasting = context === 'jejum'
  const hi = fasting ? 126 : 200
  const mid = fasting ? 100 : 140
  if (v >= hi) return { label: 'Alta — converse com seu médico', color: '#DC2626', bg: 'rgba(220,38,38,0.10)' }
  if (v >= mid) return { label: fasting ? 'Atenção (pré-diabetes)' : 'Atenção', color: '#D97706', bg: 'rgba(217,119,6,0.12)' }
  if (v < 70) return { label: 'Baixa (hipoglicemia)', color: '#EA580C', bg: 'rgba(234,88,12,0.10)' }
  return { label: 'Normal', color: '#0E9F6E', bg: 'rgba(18,201,138,0.12)' }
}

/* ── Cardio ── */
export type CardioRecord = {
  id: string
  modality: string
  duration_seconds: number
  distance_meters?: number | null
  calories?: number | null
  intensity?: 'light' | 'moderate' | 'vigorous' | null
  notes?: string | null
  started_at: string
}

export const MODALITIES: { k: string; label: string; emoji: string; met: number }[] = [
  { k: 'caminhada', label: 'Caminhada', emoji: '🚶', met: 3.5 },
  { k: 'corrida', label: 'Corrida', emoji: '🏃', met: 9 },
  { k: 'bike', label: 'Bike', emoji: '🚴', met: 7 },
  { k: 'esteira', label: 'Esteira', emoji: '🏃‍♂️', met: 6 },
  { k: 'natacao', label: 'Natação', emoji: '🏊', met: 7 },
  { k: 'eliptico', label: 'Elíptico', emoji: '⚙️', met: 5.5 },
  { k: 'futebol', label: 'Futebol', emoji: '⚽', met: 8 },
  { k: 'outro', label: 'Outro', emoji: '🏅', met: 5 },
]
export const modalityOf = (k: string) => MODALITIES.find((m) => m.k === k) ?? MODALITIES[MODALITIES.length - 1]

/** kcal ≈ MET × 3.5 × kg / 200 × minutos */
export function estimateCalories(met: number, kg: number, minutes: number): number {
  return Math.round((met * 3.5 * kg / 200) * minutes)
}

export async function listCardio(userId: string, limit = 30): Promise<CardioRecord[]> {
  const { data } = await supabase.from('cardio_activities').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(limit)
  return (data as CardioRecord[]) || []
}
export async function addCardio(userId: string, r: { modality: string; duration_seconds: number; distance_meters?: number | null; calories?: number | null; intensity?: string | null; notes?: string | null }) {
  const { error } = await supabase.from('cardio_activities').insert({ user_id: userId, ...r })
  if (error) throw error
}
export async function deleteCardio(userId: string, id: string) {
  const { error } = await supabase.from('cardio_activities').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

/** Semana atual (desde segunda): minutos, kcal e nº de atividades. */
export function weekCardioStats(records: CardioRecord[]): { minutes: number; calories: number; count: number } {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const wk = records.filter((r) => new Date(r.started_at) >= monday)
  return {
    minutes: Math.round(wk.reduce((a, r) => a + r.duration_seconds / 60, 0)),
    calories: wk.reduce((a, r) => a + (r.calories || 0), 0),
    count: wk.length,
  }
}
