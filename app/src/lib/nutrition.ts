import { supabase } from './supabase'

/* ── Tipos ── */
export type FoodEntry = { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number; emoji?: string }

export type MealFull = {
  id?: string
  date: string
  type: string
  name: string
  calories: number
  protein: number
  carbs?: number | null
  fat?: number | null
  foods?: FoodEntry[]
}

export type FoodItem = {
  id: string
  name: string
  category: string
  serving_size_g: number
  serving_label: string | null
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  is_processed: boolean | null
  emoji: string | null
}

export type MealFavorite = {
  id: string
  name: string
  meal_type: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  foods: FoodEntry[] | null
  use_count: number
}

/* ── Banco de alimentos ── */
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').trim()

export async function searchFoods(query: string): Promise<FoodItem[]> {
  const q = normalize(query)
  if (q.length < 2) return []
  const { data, error } = await supabase.from('food_database').select('*').ilike('name_normalized', `%${q}%`).order('name').limit(20)
  if (error) throw error
  return (data as FoodItem[]) || []
}

/* ── Refeições ── */
export async function addMealFull(userId: string, m: Omit<MealFull, 'id'>) {
  const { error } = await supabase.from('meals').insert({
    user_id: userId, date: m.date, type: m.type, name: m.name,
    calories: m.calories, protein: m.protein, carbs: m.carbs ?? null, fat: m.fat ?? null,
    foods: m.foods ?? [],
  })
  if (error) throw error
}

export async function listMealsFull(userId: string, date: string): Promise<MealFull[]> {
  const { data, error } = await supabase.from('meals').select('id,date,type,name,calories,protein,carbs,fat,foods').eq('user_id', userId).eq('date', date).order('created_at')
  if (error) throw error
  return (data as MealFull[]) || []
}

export async function deleteMeal(userId: string, id: string) {
  const { error } = await supabase.from('meals').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

/** Últimos 7 dias: total de kcal e proteína por dia. */
export async function weekNutrition(userId: string): Promise<{ date: string; calories: number; protein: number }[]> {
  const from = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  const { data } = await supabase.from('meals').select('date,calories,protein').eq('user_id', userId).gte('date', from)
  const byDay = new Map<string, { calories: number; protein: number }>()
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10)
    byDay.set(d, { calories: 0, protein: 0 })
  }
  for (const r of (data as { date: string; calories: number; protein: number }[]) || []) {
    const cur = byDay.get(r.date)
    if (cur) { cur.calories += r.calories || 0; cur.protein += r.protein || 0 }
  }
  return Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }))
}

/* ── Favoritos ── */
export async function listFavorites(userId: string): Promise<MealFavorite[]> {
  const { data } = await supabase.from('meal_favorites').select('*').eq('user_id', userId).order('use_count', { ascending: false }).limit(12)
  return (data as MealFavorite[]) || []
}

export async function saveFavorite(userId: string, f: Omit<MealFavorite, 'id' | 'use_count'>) {
  const { error } = await supabase.from('meal_favorites').insert({ user_id: userId, ...f })
  if (error) throw error
}

export async function bumpFavorite(userId: string, id: string, useCount: number) {
  await supabase.from('meal_favorites').update({ use_count: useCount + 1 }).eq('id', id).eq('user_id', userId)
}

export async function deleteFavorite(userId: string, id: string) {
  const { error } = await supabase.from('meal_favorites').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

/* ── Água (meta no perfil) ── */
export async function getWaterGoal(userId: string): Promise<number> {
  const { data } = await supabase.from('profiles').select('water_goal_ml').eq('id', userId).maybeSingle()
  return (data as { water_goal_ml?: number } | null)?.water_goal_ml || 3000
}

export async function setWaterGoal(userId: string, ml: number) {
  const { error } = await supabase.from('profiles').update({ water_goal_ml: ml }).eq('id', userId)
  if (error) throw error
}
