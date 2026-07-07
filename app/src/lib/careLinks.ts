import { supabase } from './supabase'

export type CareLink = {
  id: string
  professional_id: string | null
  patient_id: string
  invite_token: string
  status: 'pending' | 'active' | 'revoked'
  created_at: string
}

const CONSENT_TEXT = 'Autorizo o profissional que resgatar este convite a visualizar meus dados de saúde registrados no Encorpei (peso, treinos, nutrição, água, sono, jejum, suplementos, exames, avaliações e consultas), podendo revogar este acesso a qualquer momento. (LGPD art. 7º, I)'

/* ── Lado do paciente ── */
export async function listMyLinks(patientId: string): Promise<CareLink[]> {
  const { data } = await supabase.from('care_links').select('*').eq('patient_id', patientId).neq('status', 'revoked').order('created_at', { ascending: false })
  return (data as CareLink[]) || []
}

export async function createInvite(patientId: string): Promise<CareLink> {
  const { data, error } = await supabase.from('care_links')
    .insert({ patient_id: patientId, status: 'pending', consent_text: CONSENT_TEXT, consented_at: new Date().toISOString() })
    .select('*').single()
  if (error) throw error
  return data as CareLink
}

export async function revokeLink(patientId: string, id: string) {
  const { error } = await supabase.from('care_links').update({ status: 'revoked', revoked_at: new Date().toISOString() }).eq('id', id).eq('patient_id', patientId)
  if (error) throw error
}

/* ── Lado do profissional ── */
export async function claimInvite(token: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('claim_care_link', { token })
  if (error) throw error
  return Boolean(data)
}

export type LinkedPatient = { patient_id: string; name: string; since: string }

export async function listMyPatients(professionalId: string): Promise<LinkedPatient[]> {
  const { data: links } = await supabase.from('care_links').select('patient_id,created_at').eq('professional_id', professionalId).eq('status', 'active')
  const rows = (links as { patient_id: string; created_at: string }[]) || []
  if (!rows.length) return []
  const { data: profs } = await supabase.from('profiles').select('id,name,full_name').in('id', rows.map((r) => r.patient_id))
  const nameOf = new Map(((profs as { id: string; name?: string; full_name?: string }[]) || []).map((p) => [p.id, p.name || p.full_name || 'Paciente']))
  return rows.map((r) => ({ patient_id: r.patient_id, name: nameOf.get(r.patient_id) || 'Paciente', since: r.created_at }))
}

/** O usuário atual pode ver os dados deste paciente? (é ele mesmo ou profissional vinculado) */
export async function canViewPatient(currentUserId: string, patientId: string): Promise<boolean> {
  if (currentUserId === patientId) return true
  const { data } = await supabase.from('care_links').select('id').eq('professional_id', currentUserId).eq('patient_id', patientId).eq('status', 'active').limit(1)
  return Boolean(data && data.length)
}
