import { supabase } from './supabase'
export const todayISO = () => new Date().toISOString().slice(0, 10)

// ---- Sono ----
export type SleepDay = { date: string; hours: number; quality?: number }
export async function getSleep(userId: string, date: string): Promise<number | null> {
  const { data } = await supabase.from('sleep_logs').select('hours').eq('user_id', userId).eq('date', date).maybeSingle()
  return data?.hours ?? null
}
export async function saveSleep(userId: string, date: string, hours: number, quality?: number) {
  const { error } = await supabase.from('sleep_logs').upsert({ user_id: userId, date, hours, quality }, { onConflict: 'user_id,date' })
  if (error) throw error
}
export async function listSleep(userId: string): Promise<SleepDay[]> {
  const { data } = await supabase.from('sleep_logs').select('date,hours,quality').eq('user_id', userId).order('date', { ascending: false }).limit(14)
  return (data as SleepDay[]) || []
}

// ---- Alimentação ----
export type Meal = { id?: string; date: string; type: string; name: string; calories: number; protein: number }
export async function addMeal(userId: string, m: Omit<Meal, 'id'>) {
  const { error } = await supabase.from('meals').insert({ ...m, user_id: userId })
  if (error) throw error
}
export async function listMeals(userId: string, date: string): Promise<Meal[]> {
  const { data } = await supabase.from('meals').select('*').eq('user_id', userId).eq('date', date).order('created_at')
  return (data as Meal[]) || []
}
export async function todayNutrition(userId: string, date: string): Promise<{ calories: number; protein: number }> {
  const meals = await listMeals(userId, date)
  return { calories: meals.reduce((a, m) => a + (m.calories || 0), 0), protein: meals.reduce((a, m) => a + (m.protein || 0), 0) }
}

// ---- Minha Academia (aparelhos) ----
export type Equipment = { id: string; name: string }
export async function listEquipment(userId: string): Promise<Equipment[]> {
  const { data } = await supabase.from('gym_equipment').select('id,name').eq('user_id', userId).order('name')
  return (data as Equipment[]) || []
}
export async function addEquipment(userId: string, name: string) {
  const { error } = await supabase.from('gym_equipment').insert({ user_id: userId, name })
  if (error) throw error
}
export async function removeEquipment(userId: string, id: string) {
  const { error } = await supabase.from('gym_equipment').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}
