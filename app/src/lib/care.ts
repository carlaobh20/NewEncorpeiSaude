import { supabase } from './supabase'

/* ── Exames ── */
export type ExamResult = { id?: string; marker: string; value: number; unit?: string | null; ref_min?: number | null; ref_max?: number | null }
export type Exam = { id: string; title: string; category: string; date: string; notes?: string | null; file_path?: string | null; results: ExamResult[] }

export const EXAM_CATEGORIES = ['Sangue', 'Glicemia e Metabolismo', 'Colesterol e Lipídios', 'Hormônios', 'Vitaminas e Minerais', 'Urina', 'Imagem', 'Geral']

export function resultStatus(r: ExamResult): 'in' | 'low' | 'high' | 'na' {
  if (r.ref_min == null && r.ref_max == null) return 'na'
  if (r.ref_min != null && r.value < r.ref_min) return 'low'
  if (r.ref_max != null && r.value > r.ref_max) return 'high'
  return 'in'
}

export async function listExams(userId: string): Promise<Exam[]> {
  const { data: exams } = await supabase.from('exams').select('*').eq('user_id', userId).order('date', { ascending: false })
  if (!exams?.length) return []
  const { data: results } = await supabase.from('exam_results').select('*').eq('user_id', userId).in('exam_id', exams.map((e) => e.id))
  return exams.map((e) => ({ ...e, results: (results || []).filter((r) => r.exam_id === e.id) })) as Exam[]
}

export async function addExam(userId: string, exam: { title: string; category: string; date: string; notes?: string }, results: ExamResult[], file?: File): Promise<void> {
  let file_path: string | null = null
  if (file) {
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    const up = await supabase.storage.from('exam-files').upload(path, file, { upsert: true })
    if (!up.error) file_path = path
  }
  const { data: ins, error } = await supabase.from('exams').insert({ user_id: userId, ...exam, file_path }).select('id').single()
  if (error) throw error
  if (results.length && ins) {
    const { error: e2 } = await supabase.from('exam_results').insert(results.map((r) => ({ exam_id: ins.id, user_id: userId, marker: r.marker, value: r.value, unit: r.unit || null, ref_min: r.ref_min ?? null, ref_max: r.ref_max ?? null })))
    if (e2) throw e2
  }
}

export async function deleteExam(userId: string, id: string) {
  const { error } = await supabase.from('exams').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function examFileUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('exam-files').createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

/** Evolução de um marcador ao longo dos exames. */
export async function markerHistory(userId: string, marker: string): Promise<{ date: string; value: number }[]> {
  const { data } = await supabase.from('exam_results').select('value, exams!inner(date)').eq('user_id', userId).eq('marker', marker)
  const rows = ((data as unknown as { value: number; exams: { date: string } }[]) || [])
    .map((r) => ({ date: r.exams.date, value: Number(r.value) }))
  return rows.sort((a, b) => a.date.localeCompare(b.date))
}

/* ── Consultas ── */
export type Consultation = { id: string; professional_type: 'medico' | 'personal' | 'nutricionista'; scheduled_at: string; notes?: string | null; status: 'agendada' | 'realizada' | 'cancelada' }

export async function listConsultations(userId: string): Promise<Consultation[]> {
  const { data } = await supabase.from('consultations').select('*').eq('user_id', userId).order('scheduled_at', { ascending: true })
  return (data as Consultation[]) || []
}
export async function addConsultation(userId: string, c: { professional_type: string; scheduled_at: string; notes?: string }) {
  const { error } = await supabase.from('consultations').insert({ user_id: userId, ...c })
  if (error) throw error
}
export async function setConsultationStatus(userId: string, id: string, status: string) {
  const { error } = await supabase.from('consultations').update({ status }).eq('id', id).eq('user_id', userId)
  if (error) throw error
}

/* ── Chat paciente <-> profissional ── */
export type CareMessage = { id: string; sender: 'paciente' | 'profissional'; text: string; created_at: string }

export async function listMessages(userId: string): Promise<CareMessage[]> {
  const { data } = await supabase.from('care_messages').select('id,sender,text,created_at').eq('user_id', userId).order('created_at', { ascending: true }).limit(200)
  return (data as CareMessage[]) || []
}
export async function sendMessage(userId: string, sender: 'paciente' | 'profissional', text: string) {
  const { error } = await supabase.from('care_messages').insert({ user_id: userId, sender, text })
  if (error) throw error
}
export function subscribeMessages(userId: string, onNew: (m: CareMessage) => void): () => void {
  const ch = supabase.channel(`care-${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'care_messages', filter: `user_id=eq.${userId}` },
      (payload) => onNew(payload.new as CareMessage))
    .subscribe()
  return () => { supabase.removeChannel(ch) }
}
