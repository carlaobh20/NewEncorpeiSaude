import { supabase } from './supabase'

export type Phase = { h: number; end: number; title: string; desc: string; emoji: string; color: string }
export const PHASES: Phase[] = [
  { h: 0, end: 4, title: 'Início do Jejum', desc: 'Glicose estabiliza. Insulina começa a cair.', emoji: '⏱️', color: '#3B82F6' },
  { h: 4, end: 8, title: 'Transição Metabólica', desc: 'Insulina cai, corpo acessa gordura.', emoji: '⚡', color: '#EAB308' },
  { h: 8, end: 12, title: 'Queima de Gordura', desc: 'Glicogênio esgotando, lipólise acelera.', emoji: '🔥', color: '#F97316' },
  { h: 12, end: 16, title: 'Cetose Leve', desc: 'Corpo produz cetonas. Clareza mental.', emoji: '🧠', color: '#8B5CF6' },
  { h: 16, end: 18, title: 'Autofagia Iniciada', desc: 'Células reciclam componentes danificados.', emoji: '♻️', color: '#22C55E' },
  { h: 18, end: 20, title: 'Hormônio do Crescimento', desc: 'HGH aumenta até 5x. Preserva músculo.', emoji: '✨', color: '#EC4899' },
  { h: 20, end: 24, title: 'Autofagia Profunda', desc: 'Limpeza celular intensa. Inflamação reduz.', emoji: '🛡️', color: '#06B6D4' },
  { h: 24, end: 999, title: 'Regeneração Máxima', desc: 'Autofagia em pico. Reset metabólico.', emoji: '❤️‍🔥', color: '#EF4444' },
]
export const PLANS = [
  { hours: 12, title: '12:12', sub: 'Iniciante' }, { hours: 14, title: '14:10', sub: 'Leve' },
  { hours: 16, title: '16:8', sub: 'Popular' }, { hours: 18, title: '18:6', sub: 'Avançado' },
  { hours: 20, title: '20:4', sub: 'Intenso' }, { hours: 24, title: '24h', sub: '1 dia' },
]
export const phaseAt = (hours: number) => PHASES.find((p) => hours >= p.h && hours < p.end) ?? PHASES[0]

export type Fast = { id: string; start_at: string; target_hours: number; end_at: string | null }
export async function getActiveFast(userId: string): Promise<Fast | null> {
  const { data } = await supabase.from('fasting_sessions').select('*').eq('user_id', userId).is('end_at', null).order('start_at', { ascending: false }).limit(1).maybeSingle()
  return (data as Fast) || null
}
export async function startFast(userId: string, targetHours: number) {
  const { error } = await supabase.from('fasting_sessions').insert({ user_id: userId, target_hours: targetHours })
  if (error) throw error
}
export async function endFast(userId: string, id: string) {
  const { error } = await supabase.from('fasting_sessions').update({ end_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId)
  if (error) throw error
}
export async function listFasts(userId: string): Promise<Fast[]> {
  const { data } = await supabase.from('fasting_sessions').select('*').eq('user_id', userId).not('end_at', 'is', null).order('start_at', { ascending: false }).limit(20)
  return (data as Fast[]) || []
}
