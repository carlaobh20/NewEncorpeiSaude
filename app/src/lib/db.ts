import { supabase } from './supabase'

export type WeightRow = { id?: string; date: string; kg: number }

export async function getProfileName(userId: string): Promise<string | null> {
  const { data } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle()
  return data?.name ?? null
}

export async function ensureProfile(userId: string, name: string) {
  await supabase.from('profiles').upsert({ id: userId, name }, { onConflict: 'id' })
}

export async function listWeights(userId: string): Promise<WeightRow[]> {
  const { data, error } = await supabase.from('weights').select('id,date,kg').eq('user_id', userId).order('date')
  if (error) throw error
  return (data ?? []).map((r) => ({ id: r.id, date: r.date, kg: Number(r.kg) }))
}

export async function saveWeight(userId: string, date: string, kg: number) {
  const { error } = await supabase.from('weights').upsert(
    { user_id: userId, date, kg }, { onConflict: 'user_id,date' })
  if (error) throw error
}

export type WaterDay = { date: string; ml: number }
export async function getWater(userId: string, date: string): Promise<number> {
  const { data } = await supabase.from('water_logs').select('ml').eq('user_id', userId).eq('date', date).maybeSingle()
  return data?.ml ?? 0
}
export async function addWater(userId: string, date: string, deltaMl: number): Promise<number> {
  const cur = await getWater(userId, date)
  const next = Math.max(0, cur + deltaMl)
  const { error } = await supabase.from('water_logs').upsert({ user_id: userId, date, ml: next }, { onConflict: 'user_id,date' })
  if (error) throw error
  return next
}
export async function listWater(userId: string): Promise<WaterDay[]> {
  const { data } = await supabase.from('water_logs').select('date,ml').eq('user_id', userId).order('date', { ascending: false }).limit(14)
  return (data as WaterDay[]) || []
}
