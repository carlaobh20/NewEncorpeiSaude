import { supabase } from './supabase'

/* ── Tipos ── */
export type FoodEntry = { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number; fiber?: number; emoji?: string }

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
export async function addMealFull(userId: string, m: Omit<MealFull, 'id'> & { fiber?: number | null; photo_logged?: boolean }) {
  const { error } = await supabase.from('meals').insert({
    user_id: userId, date: m.date, type: m.type, name: m.name,
    calories: m.calories, protein: m.protein, carbs: m.carbs ?? null, fat: m.fat ?? null,
    fiber: m.fiber ?? null, photo_logged: m.photo_logged ?? false,
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


/* ── Perfil energético (TDEE) ── */
export type EnergyProfile = {
  sex?: 'm' | 'f' | null
  birth_year?: number | null
  height_cm?: number | null
  activity_level?: number | null
  goal_type?: 'deficit' | 'manter' | 'superavit' | null
  calorie_goal?: number | null
  protein_goal?: number | null
}

export const ACTIVITY_LEVELS = [
  { v: 1.2, label: 'Sedentário', desc: 'pouco ou nenhum exercício' },
  { v: 1.375, label: 'Leve', desc: '1–3 treinos/semana' },
  { v: 1.55, label: 'Moderado', desc: '3–5 treinos/semana' },
  { v: 1.725, label: 'Intenso', desc: '6–7 treinos/semana' },
  { v: 1.9, label: 'Atleta', desc: '2x por dia / trabalho físico' },
]

export async function getEnergyProfile(userId: string): Promise<EnergyProfile> {
  const { data } = await supabase.from('profiles').select('sex,birth_year,height_cm,activity_level,goal_type,calorie_goal,protein_goal').eq('id', userId).maybeSingle()
  return (data as EnergyProfile) || {}
}

export async function saveEnergyProfile(userId: string, p: EnergyProfile) {
  const { error } = await supabase.from('profiles').update(p).eq('id', userId)
  if (error) throw error
}

export async function latestWeight(userId: string): Promise<number | null> {
  const { data } = await supabase.from('weights').select('kg').eq('user_id', userId).order('date', { ascending: false }).limit(1).maybeSingle()
  return (data as { kg?: number } | null)?.kg ?? null
}

/** Mifflin-St Jeor. Retorna { tmb, tdee } arredondados. */
export function computeTDEE(sex: 'm' | 'f', age: number, kg: number, cm: number, activity: number): { tmb: number; tdee: number } {
  const tmb = 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161)
  return { tmb: Math.round(tmb), tdee: Math.round(tmb * activity) }
}

export function goalCalories(tdee: number, goal: 'deficit' | 'manter' | 'superavit'): number {
  if (goal === 'deficit') return Math.round(tdee * 0.8)
  if (goal === 'superavit') return Math.round(tdee * 1.15)
  return tdee
}

/* ── Foto do prato (IA) ── */
export type PhotoFood = { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number; fiber: number }
export type PhotoAnalysis = { foods: PhotoFood[]; confidence?: string; notes?: string; error?: string; message?: string }

export async function analyzeMealPhoto(dataUrl: string): Promise<PhotoAnalysis> {
  const { data, error } = await supabase.functions.invoke('analyze-meal', { body: { image: dataUrl } })
  if (error) throw error
  return data as PhotoAnalysis
}

/** Reduz a foto para ~1024px JPEG antes de enviar. */
export function compressImage(file: File, maxSize = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas')); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')) }
    img.src = url
  })
}
