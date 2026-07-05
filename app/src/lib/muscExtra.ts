import { supabase } from './supabase'

export type SessionRow = { id: string; name: string; date: string; volume: number; durationMin: number; series: number }
export async function fetchSessions(userId: string): Promise<SessionRow[]> {
  const { data: sess } = await supabase.from('training_sessions')
    .select('id,name,finished_at,total_volume,duration_sec')
    .eq('user_id', userId).not('finished_at', 'is', null).order('finished_at', { ascending: false }).limit(50)
  if (!sess?.length) return []
  const { data: sets } = await supabase.from('session_sets').select('session_id').in('session_id', sess.map((s) => s.id))
  const count: Record<string, number> = {}
  ;(sets || []).forEach((s) => { count[s.session_id] = (count[s.session_id] || 0) + 1 })
  return sess.map((s) => ({
    id: s.id, name: s.name || 'Treino',
    date: new Date(s.finished_at as string).toLocaleDateString('pt-BR'),
    volume: Math.round(Number(s.total_volume || 0)), durationMin: Math.round(Number(s.duration_sec || 0) / 60),
    series: count[s.id] || 0,
  }))
}

export type Assessment = { id?: string; date: string; weight?: number; body_fat?: number; chest?: number; waist?: number; hip?: number; arm?: number; thigh?: number }
export async function fetchAssessments(userId: string): Promise<Assessment[]> {
  const { data } = await supabase.from('assessments').select('*').eq('user_id', userId).order('date')
  return (data as Assessment[]) || []
}
export async function saveAssessment(userId: string, a: Assessment) {
  const { error } = await supabase.from('assessments').insert({ ...a, user_id: userId })
  if (error) throw error
}

export type Photo = { id: string; date: string; url: string; pose?: string }
export async function fetchPhotos(userId: string): Promise<Photo[]> {
  const { data } = await supabase.from('progress_photos').select('*').eq('user_id', userId).order('date', { ascending: false })
  return (data as Photo[]) || []
}
export async function addPhotoFromFile(userId: string, file: File, pose: string) {
  const path = `${userId}/${Date.now()}-${file.name}`
  const up = await supabase.storage.from('progress-photos').upload(path, file, { upsert: true })
  if (up.error) throw up.error
  const { data: pub } = supabase.storage.from('progress-photos').getPublicUrl(path)
  const { error } = await supabase.from('progress_photos').insert({ user_id: userId, url: pub.publicUrl, pose })
  if (error) throw error
}
