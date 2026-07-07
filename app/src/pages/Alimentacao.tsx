import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { todayISO } from '../lib/health'
import { getWater } from '../lib/db'
import {
  searchFoods, addMealFull, listMealsFull, deleteMeal, weekNutrition,
  listFavorites, saveFavorite, bumpFavorite,
  getEnergyProfile, saveEnergyProfile, latestWeight, computeTDEE, goalCalories, ACTIVITY_LEVELS,
  analyzeMealPhoto, compressImage,
  type FoodItem, type FoodEntry, type MealFull, type MealFavorite, type EnergyProfile,
} from '../lib/nutrition'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

const TYPES = [
  { key: 'Café', emoji: '☕' },
  { key: 'Almoço', emoji: '🍛' },
  { key: 'Jantar', emoji: '🍽️' },
  { key: 'Lanche', emoji: '🥪' },
]
const typeEmoji = (t: string) => TYPES.find((x) => x.key === t)?.emoji ?? '🍽️'

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(100, (value / goal) * 100)
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="font-semibold" style={{ color: T.text }}>{label}</span>
        <span style={{ color: T.sub }}>{Math.round(value)} / {goal}g</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EEF1F5' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function Alimentacao() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [meals, setMeals] = useState<MealFull[]>([])
  const [favorites, setFavorites] = useState<MealFavorite[]>([])
  const [week, setWeek] = useState<{ date: string; calories: number; protein: number }[]>([])
  const [waterMl, setWaterMl] = useState(0)
  const [flash, setFlash] = useState('')

  /* perfil energético */
  const [energy, setEnergy] = useState<EnergyProfile | null>(null)
  const [kg, setKg] = useState<number | null>(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const [setup, setSetup] = useState({ sex: 'm' as 'm' | 'f', birth_year: '1990', height: '', activity: 1.375, goal: 'deficit' as 'deficit' | 'manter' | 'superavit' })

  /* formulário de refeição */
  const [open, setOpen] = useState(false)
  const [mtype, setMtype] = useState('Café')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [asFavorite, setAsFavorite] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fromPhoto, setFromPhoto] = useState(false)

  /* foto do prato */
  const fileRef = useRef<HTMLInputElement>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [photoNote, setPhotoNote] = useState('')

  const load = () => {
    if (!user || !supabaseReady) return
    const d = todayISO()
    listMealsFull(user.id, d).then(setMeals).catch(() => {})
    listFavorites(user.id).then(setFavorites).catch(() => {})
    weekNutrition(user.id).then(setWeek).catch(() => {})
    getWater(user.id, d).then(setWaterMl).catch(() => {})
    getEnergyProfile(user.id).then((p) => {
      setEnergy(p)
      setSetup((s) => ({
        ...s,
        sex: (p.sex as 'm' | 'f') || 'm',
        birth_year: p.birth_year ? String(p.birth_year) : '1990',
        height: p.height_cm ? String(p.height_cm) : '',
        activity: Number(p.activity_level) || 1.375,
        goal: (p.goal_type as 'deficit' | 'manter' | 'superavit') || 'deficit',
      }))
    }).catch(() => {})
    latestWeight(user.id).then(setKg).catch(() => {})
  }
  useEffect(load, [user])

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    const t = setTimeout(() => { searchFoods(query).then(setResults).catch(() => setResults([])) }, 250)
    return () => clearTimeout(t)
  }, [query])

  /* TDEE e metas */
  const tdeeInfo = useMemo(() => {
    if (!energy?.sex || !energy?.birth_year || !energy?.height_cm || !kg) return null
    const age = new Date().getFullYear() - energy.birth_year
    return computeTDEE(energy.sex as 'm' | 'f', age, kg, energy.height_cm, Number(energy.activity_level) || 1.375)
  }, [energy, kg])

  const calGoal = energy?.calorie_goal || (tdeeInfo ? goalCalories(tdeeInfo.tdee, (energy?.goal_type as never) || 'deficit') : 2200)
  const protGoal = energy?.protein_goal || (kg ? Math.round(kg * 1.8) : 150)
  const carbGoal = Math.round((calGoal * 0.4) / 4)
  const fatGoal = Math.round((calGoal * 0.28) / 9)

  const totals = useMemo(() => meals.reduce(
    (a, m) => ({ cal: a.cal + (m.calories || 0), p: a.p + (m.protein || 0), c: a.c + (m.carbs || 0), f: a.f + (m.fat || 0) }),
    { cal: 0, p: 0, c: 0, f: 0 },
  ), [meals])

  const entryTotals = useMemo(() => entries.reduce(
    (a, e) => ({ cal: a.cal + e.calories, p: a.p + e.protein, c: a.c + e.carbs, f: a.f + e.fat, fb: a.fb + (e.fiber || 0) }),
    { cal: 0, p: 0, c: 0, f: 0, fb: 0 },
  ), [entries])

  const balance = tdeeInfo ? totals.cal - tdeeInfo.tdee : null
  const remaining = calGoal - totals.cal

  const saveSetup = async () => {
    if (!user) return
    const by = parseInt(setup.birth_year), h = parseInt(setup.height)
    if (!by || by < 1920 || by > 2015 || !h || h < 120 || h > 230) { setFlash('Confira ano e altura'); setTimeout(() => setFlash(''), 1800); return }
    const w = kg || 80
    const age = new Date().getFullYear() - by
    const { tdee } = computeTDEE(setup.sex, age, w, h, setup.activity)
    const cg = goalCalories(tdee, setup.goal)
    try {
      await saveEnergyProfile(user.id, {
        sex: setup.sex, birth_year: by, height_cm: h, activity_level: setup.activity,
        goal_type: setup.goal, calorie_goal: cg, protein_goal: Math.round(w * 1.8),
      })
      setSetupOpen(false); setFlash('Gasto calórico configurado!'); setTimeout(() => setFlash(''), 1500); load()
    } catch { setFlash('Erro ao salvar'); setTimeout(() => setFlash(''), 2000) }
  }

  const addFood = (food: FoodItem) => {
    const grams = food.serving_size_g || 100
    const k = grams / 100
    setEntries((e) => [...e, {
      name: food.name, grams,
      calories: Math.round(food.calories * k), protein: Math.round(food.protein_g * k),
      carbs: Math.round(food.carbs_g * k), fat: Math.round(food.fat_g * k),
      fiber: Math.round(Number((food as unknown as { fiber_g?: number }).fiber_g || 0) * k),
      emoji: food.emoji ?? undefined,
    }])
    setQuery(''); setResults([])
  }

  const setGrams = (i: number, grams: number) => {
    setEntries((list) => list.map((e, j) => {
      if (j !== i || !grams) return e
      const per = e.grams || 1
      const k = grams / per
      return { ...e, grams, calories: Math.round(e.calories * k), protein: Math.round(e.protein * k), carbs: Math.round(e.carbs * k), fat: Math.round(e.fat * k), fiber: Math.round((e.fiber || 0) * k) }
    }))
  }

  const takePhoto = () => fileRef.current?.click()

  const onPhoto = async (f: File | null) => {
    if (!f || analyzing) return
    setAnalyzing(true); setPhotoNote(''); setOpen(true)
    try {
      const dataUrl = await compressImage(f)
      const res = await analyzeMealPhoto(dataUrl)
      if (res.error === 'missing_key') { setPhotoNote('⚠️ IA ainda não ativada — falta configurar a chave. Me avise no chat do projeto.'); return }
      if (!res.foods || res.foods.length === 0) { setPhotoNote(res.notes || 'Nenhum alimento identificado. Tente outra foto, mais de cima e com boa luz.'); return }
      setEntries((prev) => [...prev, ...res.foods.map((fd) => ({
        name: fd.name, grams: fd.grams || 100, calories: fd.calories || 0, protein: fd.protein || 0,
        carbs: fd.carbs || 0, fat: fd.fat || 0, fiber: fd.fiber || 0, emoji: '📷',
      }))])
      setFromPhoto(true)
      setPhotoNote(`✨ ${res.foods.length} alimento${res.foods.length > 1 ? 's' : ''} identificado${res.foods.length > 1 ? 's' : ''} (confiança ${res.confidence || 'média'}). Ajuste as gramas se precisar.`)
    } catch { setPhotoNote('Erro ao analisar a foto. Tente de novo.') } finally {
      setAnalyzing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const resetForm = () => { setEntries([]); setManual({ name: '', calories: '', protein: '', carbs: '', fat: '' }); setQuery(''); setAsFavorite(false); setOpen(false); setFromPhoto(false); setPhotoNote('') }

  const save = async () => {
    if (!user || saving) return
    const hasManual = manual.name.trim() && (parseInt(manual.calories) || 0) > 0
    if (entries.length === 0 && !hasManual) return
    setSaving(true)
    try {
      const name = entries.length > 0 ? entries.map((e) => e.name).join(', ') : manual.name.trim()
      const cal = entries.length > 0 ? entryTotals.cal : parseInt(manual.calories) || 0
      const p = entries.length > 0 ? entryTotals.p : parseInt(manual.protein) || 0
      const c = entries.length > 0 ? entryTotals.c : parseInt(manual.carbs) || 0
      const f = entries.length > 0 ? entryTotals.f : parseInt(manual.fat) || 0
      const fb = entries.length > 0 ? entryTotals.fb : 0
      await addMealFull(user.id, { date: todayISO(), type: mtype, name, calories: cal, protein: p, carbs: c, fat: f, fiber: fb, photo_logged: fromPhoto, foods: entries })
      if (asFavorite) await saveFavorite(user.id, { name, meal_type: mtype, calories: cal, protein: p, carbs: c, fat: f, foods: entries })
      resetForm(); setFlash('Refeição registrada!'); setTimeout(() => setFlash(''), 1400); load()
    } catch { setFlash('Erro ao salvar refeição'); setTimeout(() => setFlash(''), 2000) } finally { setSaving(false) }
  }

  const quickAddFavorite = async (fav: MealFavorite) => {
    if (!user) return
    try {
      await addMealFull(user.id, { date: todayISO(), type: fav.meal_type, name: fav.name, calories: fav.calories || 0, protein: fav.protein || 0, carbs: fav.carbs || 0, fat: fav.fat || 0, foods: fav.foods || [] })
      bumpFavorite(user.id, fav.id, fav.use_count).catch(() => {})
      setFlash(`${fav.name} adicionado!`); setTimeout(() => setFlash(''), 1400); load()
    } catch { /* noop */ }
  }

  const remove = async (id?: string) => { if (user && id) { await deleteMeal(user.id, id).catch(() => {}); load() } }

  const byType = TYPES.map((t) => ({ ...t, items: meals.filter((m) => m.type === t.key) })).filter((g) => g.items.length > 0)
  const calPct = Math.min(100, (totals.cal / calGoal) * 100)
  const maxWeekCal = Math.max(...week.map((w) => w.calories), calGoal)
  const r = 42, circ = 2 * Math.PI * r

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pb-32">
        <ScreenHeader title="Nutrição" />

        {/* ── Resumo: restantes + macros ── */}
        <div style={card} className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0" style={{ width: 104, height: 104 }}>
              <svg width="104" height="104" viewBox="0 0 104 104">
                <circle cx="52" cy="52" r={r} fill="none" stroke="#EEF1F5" strokeWidth="9" />
                <circle cx="52" cy="52" r={r} fill="none" stroke={remaining < 0 ? '#F97316' : T.teal} strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (calPct / 100) * circ} transform="rotate(-90 52 52)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[19px] font-bold tabular-nums" style={{ color: remaining < 0 ? '#EA580C' : T.text }}>{Math.abs(remaining)}</div>
                <div className="text-[9px]" style={{ color: T.sub }}>{remaining >= 0 ? 'restantes' : 'acima'} · meta {calGoal}</div>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              <MacroBar label="Proteína" value={totals.p} goal={protGoal} color="#12C9A6" />
              <MacroBar label="Carboidratos" value={totals.c} goal={carbGoal} color="#F59E0B" />
              <MacroBar label="Gordura" value={totals.f} goal={fatGoal} color="#F97316" />
            </div>
          </div>
        </div>

        {/* ── Balanço energético (TDEE) ── */}
        {tdeeInfo ? (
          <div style={{ ...card, background: '#0F172A', border: 'none' }} className="p-4 mt-3 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px]" style={{ color: '#94A3B8' }}>⚡ Balanço de hoje · gasto estimado {tdeeInfo.tdee} kcal</div>
                <div className="text-[20px] font-bold mt-0.5" style={{ color: (balance ?? 0) <= 0 ? '#5EEAD4' : '#FDBA74' }}>
                  {balance != null && balance <= 0 ? `Déficit de ${Math.abs(balance)} kcal` : `Superávit de ${balance} kcal`}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>
                  TMB {tdeeInfo.tmb} kcal · objetivo: {energy?.goal_type === 'deficit' ? 'emagrecer' : energy?.goal_type === 'superavit' ? 'ganhar massa' : 'manter'}
                </div>
              </div>
              <button onClick={() => setSetupOpen(true)} className="text-[11px] font-semibold px-3 py-1.5 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.1)', color: '#CBD5E1' }}>ajustar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setSetupOpen(true)} style={{ ...card, borderStyle: 'dashed' }} className="w-full p-4 mt-3 text-left active:scale-[0.99] transition">
            <div className="text-[14px] font-bold" style={{ color: T.text }}>⚡ Configure seu gasto calórico</div>
            <p className="text-[12px] mt-0.5" style={{ color: T.sub }}>Com sexo, idade, altura e nível de atividade eu calculo seu gasto diário e mostro se você está em déficit ou não.</p>
          </button>
        )}

        {/* ── Setup TDEE ── */}
        {setupOpen && (
          <div style={card} className="p-4 mt-3">
            <div className="text-[14px] font-bold mb-3" style={{ color: T.text }}>Seu gasto calórico diário</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {([['m', '👨 Masculino'], ['f', '👩 Feminino']] as ['m' | 'f', string][]).map(([k, l]) => (
                <button key={k} onClick={() => setSetup({ ...setup, sex: k })} className="py-2.5 rounded-xl text-[12px] font-semibold transition" style={setup.sex === k ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{l}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="text-[10px] mb-0.5" style={{ color: '#94A3B8' }}>Ano de nascimento</div>
                <input type="number" value={setup.birth_year} onChange={(e) => setSetup({ ...setup, birth_year: e.target.value })} className="w-full bg-white border rounded-xl px-3 py-2 text-[13px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
              </div>
              <div>
                <div className="text-[10px] mb-0.5" style={{ color: '#94A3B8' }}>Altura (cm)</div>
                <input type="number" value={setup.height} onChange={(e) => setSetup({ ...setup, height: e.target.value })} placeholder="ex: 178" className="w-full bg-white border rounded-xl px-3 py-2 text-[13px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
              </div>
            </div>
            <div className="text-[10px] mb-1" style={{ color: '#94A3B8' }}>Nível de atividade</div>
            <div className="space-y-1.5 mb-2">
              {ACTIVITY_LEVELS.map((a) => (
                <button key={a.v} onClick={() => setSetup({ ...setup, activity: a.v })} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition" style={setup.activity === a.v ? { background: 'rgba(18,201,166,0.12)', border: '1.5px solid #12C9A6' } : { background: '#F8FAFC', border: '1.5px solid transparent' }}>
                  <span className="text-[12px] font-semibold" style={{ color: T.text }}>{a.label}</span>
                  <span className="text-[10px]" style={{ color: T.sub }}>{a.desc}</span>
                </button>
              ))}
            </div>
            <div className="text-[10px] mb-1" style={{ color: '#94A3B8' }}>Objetivo</div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([['deficit', '🔥 Emagrecer'], ['manter', '⚖️ Manter'], ['superavit', '💪 Ganhar']] as ['deficit' | 'manter' | 'superavit', string][]).map(([k, l]) => (
                <button key={k} onClick={() => setSetup({ ...setup, goal: k })} className="py-2 rounded-xl text-[11px] font-semibold transition" style={setup.goal === k ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{l}</button>
              ))}
            </div>
            <p className="text-[10px] mb-3" style={{ color: '#94A3B8' }}>Peso usado: {kg ? `${kg} kg (do seu registro)` : '80 kg (registre seu peso pra ficar exato)'} · Fórmula Mifflin-St Jeor. Estimativa — não substitui avaliação profissional.</p>
            <div className="flex gap-2">
              <button onClick={() => setSetupOpen(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold" style={{ background: '#EEF1F5', color: T.sub }}>Cancelar</button>
              <button onClick={saveSetup} className="flex-1 py-3 rounded-2xl font-bold text-white text-[14px]" style={{ background: T.teal }}>Calcular e salvar</button>
            </div>
          </div>
        )}

        {/* ── Água (atalho) ── */}
        <button onClick={() => nav('/corpo/agua')} style={card} className="w-full mt-3 p-3.5 flex items-center justify-between active:scale-[0.99] transition">
          <div className="flex items-center gap-2.5">
            <span className="text-[20px]">💧</span>
            <span className="text-[13px] font-semibold" style={{ color: T.text }}>Água</span>
          </div>
          <span className="text-[13px] font-bold" style={{ color: '#3B82F6' }}>{(waterMl / 1000).toFixed(1)}L hoje →</span>
        </button>

        {/* ── Favoritos ── */}
        {favorites.length > 0 && !open && (
          <>
            <h3 className="font-semibold mt-5 mb-2 px-1" style={{ color: T.text }}>Favoritos</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {favorites.map((f) => (
                <button key={f.id} onClick={() => quickAddFavorite(f)} style={card} className="flex-shrink-0 px-3.5 py-2.5 text-left active:scale-95 transition">
                  <div className="text-[12px] font-bold whitespace-nowrap max-w-[160px] truncate" style={{ color: T.text }}>{typeEmoji(f.meal_type)} {f.name}</div>
                  <div className="text-[10px]" style={{ color: T.sub }}>{f.calories} kcal · {f.protein}g prot · toque p/ adicionar</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Refeições de hoje ── */}
        <div className="flex items-center justify-between mt-5 mb-2 px-1">
          <h3 className="font-semibold" style={{ color: T.text }}>Hoje</h3>
          {!open && (
            <div className="flex gap-2">
              <button onClick={takePhoto} className="text-[13px] font-bold px-3.5 py-1.5 rounded-full text-white active:scale-95 transition" style={{ background: '#0F172A' }}>📷 Foto do prato</button>
              <button onClick={() => setOpen(true)} className="text-[13px] font-bold px-3.5 py-1.5 rounded-full text-white active:scale-95 transition" style={{ background: T.teal }}>+ Refeição</button>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />

        {/* ── Formulário ── */}
        {open && (
          <div style={card} className="p-4 mb-3">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {TYPES.map((t) => (
                <button key={t.key} onClick={() => setMtype(t.key)} className="py-2 rounded-xl text-[11px] font-semibold transition active:scale-95" style={mtype === t.key ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>
                  {t.emoji} {t.key}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar alimento (ex: arroz, frango...)"
                className="flex-1 bg-white border rounded-2xl px-4 py-3 text-[14px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
              <button onClick={takePhoto} disabled={analyzing} className="px-3.5 rounded-2xl text-[18px] active:scale-95 transition disabled:opacity-50" style={{ background: '#0F172A' }} title="Analisar foto do prato">📷</button>
            </div>

            {analyzing && (
              <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl mb-2" style={{ background: '#F1F5F9' }}>
                <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#12C9A6', borderTopColor: 'transparent' }} />
                <span className="text-[12px] font-semibold" style={{ color: T.sub }}>Analisando seu prato com IA…</span>
              </div>
            )}
            {photoNote && !analyzing && <p className="text-[11px] px-1 mb-2 font-semibold" style={{ color: photoNote.startsWith('✨') ? '#0E9F6E' : '#B45309' }}>{photoNote}</p>}

            {results.length > 0 && (
              <div className="mt-1 mb-2 rounded-2xl overflow-hidden border" style={{ borderColor: '#EDF2F7', background: '#fff' }}>
                {results.slice(0, 6).map((food) => (
                  <button key={food.id} onClick={() => addFood(food)} className="w-full flex items-center justify-between px-3.5 py-2.5 text-left active:bg-slate-50" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <span className="text-[13px]" style={{ color: T.text }}>{food.emoji} {food.name}</span>
                    <span className="text-[11px]" style={{ color: T.sub }}>{Math.round(food.calories)} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}

            {entries.length > 0 && (
              <div className="mt-2 space-y-2">
                {entries.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F1F5F9' }}>
                    <span className="text-[13px] flex-1 truncate" style={{ color: T.text }}>{e.emoji} {e.name}</span>
                    <input type="number" value={e.grams} onChange={(ev) => setGrams(i, parseInt(ev.target.value) || 0)}
                      className="w-16 bg-white rounded-lg px-2 py-1 text-[12px] text-center outline-none" style={{ color: T.text }} />
                    <span className="text-[11px]" style={{ color: T.sub }}>g · {e.calories} kcal</span>
                    <button onClick={() => setEntries((l) => l.filter((_, j) => j !== i))} className="text-[14px]" style={{ color: '#EF4444' }}>×</button>
                  </div>
                ))}
                <div className="text-[12px] font-semibold text-right" style={{ color: T.text }}>
                  Total: {entryTotals.cal} kcal · {entryTotals.p}g P · {entryTotals.c}g C · {entryTotals.f}g G{entryTotals.fb ? ` · ${entryTotals.fb}g fibra` : ''}
                </div>
              </div>
            )}

            {entries.length === 0 && !analyzing && (
              <div className="mt-2">
                <p className="text-[11px] mb-2" style={{ color: T.sub }}>Ou registre manualmente:</p>
                <input value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} placeholder="Nome da refeição"
                  className="w-full bg-white border rounded-2xl px-4 py-2.5 text-[14px] outline-none mb-2" style={{ borderColor: '#EDF2F7', color: T.text }} />
                <div className="grid grid-cols-4 gap-2">
                  {(['calories', 'protein', 'carbs', 'fat'] as const).map((k, i) => (
                    <input key={k} type="number" value={manual[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })}
                      placeholder={['kcal', 'prot g', 'carb g', 'gord g'][i]}
                      className="bg-white border rounded-xl px-2 py-2 text-[12px] text-center outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 mt-3 text-[12px]" style={{ color: T.sub }}>
              <input type="checkbox" checked={asFavorite} onChange={(e) => setAsFavorite(e.target.checked)} className="accent-emerald-500" />
              Salvar como favorito
            </label>

            <div className="flex gap-2 mt-3">
              <button onClick={resetForm} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold" style={{ background: '#EEF1F5', color: T.sub }}>Cancelar</button>
              <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-white active:scale-[0.98] transition" style={{ background: T.teal, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Salvando…' : 'Salvar refeição'}
              </button>
            </div>
          </div>
        )}

        {byType.length === 0 && !open && (
          <div style={card} className="p-6 text-center">
            <div className="text-[32px]">🍽️</div>
            <p className="text-[13px] mt-1" style={{ color: T.sub }}>Nenhuma refeição hoje. Tire uma 📷 foto do prato ou adicione manual.</p>
          </div>
        )}

        {byType.map((g) => (
          <div key={g.key} className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider px-1 mb-1.5" style={{ color: T.sub }}>{g.emoji} {g.key}</p>
            <div style={card} className="p-2">
              {g.items.map((m) => (
                <div key={m.id} className="flex items-center px-3 py-2.5" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{(m as MealFull & { photo_logged?: boolean }).photo_logged ? '📷 ' : ''}{m.name}</div>
                    <div className="text-[11px]" style={{ color: T.sub }}>
                      {m.calories} kcal · {m.protein}g P{m.carbs ? ` · ${m.carbs}g C` : ''}{m.fat ? ` · ${m.fat}g G` : ''}
                    </div>
                  </div>
                  <button onClick={() => remove(m.id)} className="text-[13px] px-2" style={{ color: '#CBD5E1' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* ── Semana ── */}
        {week.some((w) => w.calories > 0) && (
          <>
            <h3 className="font-semibold mt-5 mb-2 px-1" style={{ color: T.text }}>Últimos 7 dias</h3>
            <div style={card} className="p-4">
              <div className="flex items-end justify-between gap-1.5" style={{ height: 90 }}>
                {week.map((w) => {
                  const today = w.date === todayISO()
                  const hPct = Math.max(4, (w.calories / maxWeekCal) * 100)
                  return (
                    <div key={w.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-lg" style={{ height: `${hPct}%`, background: today ? T.teal : w.calories > calGoal ? '#FDBA74' : '#BAE6FD', minHeight: 3 }} />
                      <span className="text-[9px]" style={{ color: today ? T.teal : T.sub, fontWeight: today ? 700 : 400 }}>
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][new Date(w.date + 'T12:00:00').getDay()]}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 pt-2 text-[11px]" style={{ borderTop: '1px solid rgba(15,23,42,0.05)', color: T.sub }}>
                <span>Média: <b style={{ color: T.text }}>{Math.round(week.reduce((a, w) => a + w.calories, 0) / 7)} kcal/dia</b></span>
                <span>Proteína média: <b style={{ color: T.text }}>{Math.round(week.reduce((a, w) => a + w.protein, 0) / 7)}g</b></span>
              </div>
            </div>
          </>
        )}

        {flash && <div className="fixed bottom-24 inset-x-0 flex justify-center z-40"><span className="px-4 py-2 rounded-full text-[13px] font-semibold text-white" style={{ background: '#0F172A' }}>{flash}</span></div>}
      </div>
    </div>
  )
}
