import { supabase } from './supabase'

/* ── Papéis de usuário ─────────────────────────────────────────────
   Um único login para todos; o papel no perfil decide a experiência.
   'medico' cai na área do médico (/medico) após o login.            */
export type Role = 'paciente' | 'medico' | 'personal' | 'nutricionista'

export const ROLE_LABEL: Record<Role, string> = {
  paciente: 'Paciente',
  medico: '🩺 Médico',
  personal: '💪 Personal',
  nutricionista: '🥗 Nutricionista',
}

export async function getMyRole(userId: string): Promise<Role> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
  const r = (data as { role?: string } | null)?.role
  return (r === 'medico' || r === 'personal' || r === 'nutricionista') ? r : 'paciente'
}

export async function setMyRole(userId: string, role: Role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) throw error
}
