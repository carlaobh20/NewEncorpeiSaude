import { supabase } from './supabase'

/* ────────────────────────────────────────────────────────────
   Sprint 2 — Monitoramento clínico
   Princípio: o app NUNCA interpreta. Toda faixa vem de regra
   criada pelo profissional; a UI do paciente usa linguagem leiga.
   ──────────────────────────────────────────────────────────── */

/* ── Sintomas (slug interno → rótulo leigo) ── */
export const SYMPTOMS = [
  { slug: 'falta_de_ar', label: 'Falta de ar', emoji: '😮‍💨' },
  { slug: 'dor_no_peito', label: 'Dor ou aperto no peito', emoji: '💢' },
  { slug: 'palpitacoes', label: 'Coração acelerado ou falhando', emoji: '💓' },
  { slug: 'inchaco_pernas', label: 'Inchaço nas pernas ou tornozelos', emoji: '🦵' },
  { slug: 'tontura', label: 'Tontura ou quase desmaio', emoji: '😵' },
  { slug: 'fadiga', label: 'Cansaço fora do comum', emoji: '🪫' },
] as const
export type SymptomSlug = (typeof SYMPTOMS)[number]['slug']
export const symptomLabel = (slug: string) => SYMPTOMS.find((s) => s.slug === slug)?.label || slug

export const SYMPTOM_CONTEXTS = [
  { slug: 'repouso', label: 'Em repouso' },
  { slug: 'esforco', label: 'Fazendo esforço' },
  { slug: 'deitado', label: 'Deitado(a)' },
] as const

export type SymptomLog = {
  id: string
  symptom: SymptomSlug
  intensity: number
  context: string | null
  notes: string | null
  recorded_at: string
}

export async function listSymptoms(userId: string, limit = 30): Promise<SymptomLog[]> {
  const { data } = await supabase.from('symptom_logs').select('*').eq('user_id', userId)
    .order('recorded_at', { ascending: false }).limit(limit)
  return (data as SymptomLog[]) || []
}
export async function addSymptom(userId: string, r: { symptom: SymptomSlug; intensity: number; context?: string; notes?: string }) {
  const { error } = await supabase.from('symptom_logs').insert({ user_id: userId, ...r })
  if (error) throw error
}
export async function deleteSymptom(userId: string, id: string) {
  const { error } = await supabase.from('symptom_logs').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

/* ── Aparelhos confirmados pelo paciente ── */
export const DEVICES: Record<string, string> = {
  pressao: 'aparelho de pressão',
  glicemia: 'aparelho de glicemia (glicosímetro)',
  oximetro: 'oxímetro de dedo',
  balanca: 'balança',
}
export async function listDevices(userId: string): Promise<string[]> {
  const { data } = await supabase.from('patient_devices').select('device').eq('user_id', userId)
  return ((data as { device: string }[]) || []).map((d) => d.device)
}
export async function confirmDevice(userId: string, device: string) {
  const { error } = await supabase.from('patient_devices').insert({ user_id: userId, device })
  if (error) throw error
}

/* ── Plano de monitoramento ── */
export const PLAN_ITEMS: Record<string, { label: string; route: string; device?: string }> = {
  peso: { label: 'Registrar o peso', route: '/m/peso' },
  pressao: { label: 'Medir a pressão', route: '/corpo/vitais', device: 'pressao' },
  glicemia: { label: 'Medir a glicemia', route: '/corpo/vitais', device: 'glicemia' },
  sintomas: { label: 'Contar como está se sentindo', route: '/sintomas' },
  agua: { label: 'Registrar a água', route: '/corpo/agua' },
  sono: { label: 'Registrar o sono', route: '/corpo/sono' },
}
export const FREQ_LABEL: Record<string, string> = {
  diario: 'Todo dia',
  semanal: '1x por semana',
  conforme_orientado: 'Quando orientado',
}

export type PlanItem = { id: string; plan_id: string; item: string; frequency: string; requires_device: string | null }
export type Plan = { id: string; patient_id: string; professional_id: string; active: boolean }

/** Itens de todos os planos ativos do paciente (pode ter mais de um profissional). */
export async function myPlanItems(patientId: string): Promise<PlanItem[]> {
  const { data: plans } = await supabase.from('monitoring_plans').select('id').eq('patient_id', patientId).eq('active', true)
  const ids = ((plans as { id: string }[]) || []).map((p) => p.id)
  if (!ids.length) return []
  const { data } = await supabase.from('monitoring_plan_items').select('*').in('plan_id', ids).order('created_at')
  return (data as PlanItem[]) || []
}

/** Plano do profissional para um paciente (cria se não existir). */
export async function ensurePlan(professionalId: string, patientId: string): Promise<Plan> {
  const { data: existing } = await supabase.from('monitoring_plans').select('*')
    .eq('professional_id', professionalId).eq('patient_id', patientId).maybeSingle()
  if (existing) return existing as Plan
  const { data, error } = await supabase.from('monitoring_plans')
    .insert({ professional_id: professionalId, patient_id: patientId }).select('*').single()
  if (error) throw error
  return data as Plan
}
export async function listPlanItems(planId: string): Promise<PlanItem[]> {
  const { data } = await supabase.from('monitoring_plan_items').select('*').eq('plan_id', planId).order('created_at')
  return (data as PlanItem[]) || []
}
export async function addPlanItem(planId: string, item: string, frequency: string) {
  const requires_device = PLAN_ITEMS[item]?.device || null
  const { error } = await supabase.from('monitoring_plan_items').insert({ plan_id: planId, item, frequency, requires_device })
  if (error) throw error
}
export async function removePlanItem(id: string) {
  const { error } = await supabase.from('monitoring_plan_items').delete().eq('id', id)
  if (error) throw error
}

/* ── Regras de alerta ── */
export const METRICS: Record<string, string> = {
  pa_sistolica: 'Pressão sistólica (máxima)',
  pa_diastolica: 'Pressão diastólica (mínima)',
  pulso: 'Frequência cardíaca (bpm)',
  glicemia: 'Glicemia (mg/dL)',
  peso_ganho_kg_72h: 'Ganho de peso em 72h (kg)',
  sintoma: 'Intensidade de sintoma (0–10)',
}

export type AlertRule = {
  id: string
  patient_id: string
  professional_id: string
  metric: string
  symptom: string | null
  operator: '>' | '<' | '>=' | '<='
  threshold: number
  severity: 'amarelo' | 'vermelho'
  active: boolean
}

export async function listRules(professionalId: string, patientId: string): Promise<AlertRule[]> {
  const { data } = await supabase.from('alert_rules').select('*')
    .eq('professional_id', professionalId).eq('patient_id', patientId).eq('active', true)
    .order('created_at')
  return (data as AlertRule[]) || []
}
export async function addRule(r: Omit<AlertRule, 'id' | 'active'>) {
  const { error } = await supabase.from('alert_rules').insert({ ...r, active: true })
  if (error) throw error
}
export async function deactivateRule(professionalId: string, id: string) {
  const { error } = await supabase.from('alert_rules').update({ active: false })
    .eq('id', id).eq('professional_id', professionalId)
  if (error) throw error
}

/** Preset sugerido para monitoramento cardiológico. Os valores são apenas
 *  ponto de partida editável — a responsabilidade da faixa é do profissional. */
export const CARDIO_PRESET: Array<Pick<AlertRule, 'metric' | 'symptom' | 'operator' | 'threshold' | 'severity'>> = [
  { metric: 'pa_sistolica', symptom: null, operator: '>=', threshold: 180, severity: 'vermelho' },
  { metric: 'pa_sistolica', symptom: null, operator: '<', threshold: 90, severity: 'vermelho' },
  { metric: 'pa_sistolica', symptom: null, operator: '>=', threshold: 160, severity: 'amarelo' },
  { metric: 'pulso', symptom: null, operator: '>', threshold: 120, severity: 'vermelho' },
  { metric: 'pulso', symptom: null, operator: '<', threshold: 45, severity: 'vermelho' },
  { metric: 'peso_ganho_kg_72h', symptom: null, operator: '>=', threshold: 2, severity: 'vermelho' },
  { metric: 'sintoma', symptom: 'dor_no_peito', operator: '>=', threshold: 5, severity: 'vermelho' },
  { metric: 'glicemia', symptom: null, operator: '<', threshold: 70, severity: 'vermelho' },
]

/* ── Alertas ── */
export type Alert = {
  id: string
  patient_id: string
  professional_id: string
  metric: string
  observed_value: number | null
  severity: 'amarelo' | 'vermelho'
  status: 'aberto' | 'visto' | 'tratado'
  created_at: string
}

export async function listProfessionalAlerts(professionalId: string, onlyOpen: boolean): Promise<Alert[]> {
  let q = supabase.from('alerts').select('*').eq('professional_id', professionalId)
    .order('created_at', { ascending: false }).limit(100)
  if (onlyOpen) q = q.in('status', ['aberto', 'visto'])
  const { data } = await q
  return (data as Alert[]) || []
}
export async function setAlertStatus(professionalId: string, id: string, status: 'visto' | 'tratado') {
  const { error } = await supabase.from('alerts').update({ status })
    .eq('id', id).eq('professional_id', professionalId)
  if (error) throw error
}
export async function listMyAlerts(patientId: string): Promise<Alert[]> {
  const { data } = await supabase.from('alerts').select('*').eq('patient_id', patientId)
    .order('created_at', { ascending: false }).limit(20)
  return (data as Alert[]) || []
}
