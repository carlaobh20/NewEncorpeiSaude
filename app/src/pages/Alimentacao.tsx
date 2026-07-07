import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { todayISO } from '../lib/health'
import { getWater } from '../lib/db'
import {
  searchFoods, addMealFull, listMealsFull, deleteMeal, weekNutrition,
  listFavorites, saveFavorite, bumpFavorite,
  type FoodItem, type FoodEntry, type MealFull, type MealFavorite,
} from '../lib/nutrition'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

const CAL_GOAL = 2200, PROT_GOAL = 150, CARB_GOAL = 250, FAT_GOAL = 70
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

  /* Formulário de nova refeição */
  const [open, setOpen] = useState(false)
  const [mtype, setMtype] = useState('Café')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [asFavorite, setAsFavorite] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    if (!user || !supabaseReady) return
    const d = todayISO()
    listMealsFull(user.id, d).then(setMeals).catch(() => {})
    listFavorites(user.id).then(setFavorites).catch(() => {})
    weekNutrition(user.id).then(setWeek).catch(() => {})
    getWater(user.id, d).then(setWaterMl).catch(() => {})
  }
  useEffect(load, [user])

  /* Busca no banco de alimentos (debounce simples) */
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    const t = setTimeout(() => { searchFoods(query).then(setResults).catch(() => setResults([])) }, 250)
    return () => clearTimeout(t)
  }, [query])

  const totals = useMemo(() => meals.reduce(
    (a, m) => ({ cal: a.cal + (m.calories || 0), p: a.p + (m.protein || 0), c: a.c + (m.carbs || 0), f: a.f + (m.fat || 0) }),
    { cal: 0, p: 0, c: 0, f: 0 },
  ), [meals])

  const entryTotals = useMemo(() => entries.reduce(
    (a, e) => ({ cal: a.cal + e.calories, p: a.p + e.protein, c: a.c + e.carbs, f: a.f + e.fat }),
    { cal: 0, p: 0, c: 0, f: 0 },
  ), [entries])

  const addFood = (food: FoodItem) => {
    const grams = food.serving_size_g || 100
    const k = grams / 100
    setEntries((e) => [...e, {
      name: food.name, grams,
      calories: Math.round(food.calories * k), protein: Math.round(food.protein_g * k),
      carbs: Math.round(food.carbs_g * k), fat: Math.round(food.fat_g * k),
      emoji: food.emoji ?? undefined,
    }])
    setQuery(''); setResults([])
  }

  const setGrams = (i: number, grams: number) => {
    setEntries((list) => list.map((e, j) => {
      if (j !== i || !grams) return e
      const per = e.grams || 1
      const k = grams / per
      return { ...e, grams, calories: Math.round(e.calories * k), protein: Math.round(e.protein * k), carbs: Math.round(e.carbs * k), fat: Math.round(e.fat * k) }
    }))
  }

  const resetForm = () => { setEntries([]); setManual({ name: '', calories: '', protein: '', carbs: '', fat: '' }); setQuery(''); setAsFavorite(false); setOpen(false) }

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
      await addMealFull(user.id, { date: todayISO(), type: mtype, name, calories: cal, protein: p, carbs: c, fat: f, foods: entries })
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
  const calPct = Math.min(100, (totals.cal / CAL_GOAL) * 100)
  const maxWeekCal = Math.max(...week.map((w) => w.calories), CAL_GOAL)
  const r = 42, circ = 2 * Math.PI * r

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pb-32">
        <ScreenHeader title="Nutrição" />

        {/* ── Resumo de macros ── */}
        <div style={card} className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0" style={{ width: 104, height: 104 }}>
              <svg width="104" height="104" viewBox="0 0 104 104">
                <circle cx="52" cy="52" r={r} fill="none" stroke="#EEF1F5" strokeWidth="9" />
                <circle cx="52" cy="52" r={r} fill="none" stroke={totals.cal > CAL_GOAL ? '#F97316' : T.teal} strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (calPct / 100) * circ} transform="rotate(-90 52 52)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[19px] font-bold tabular-nums" style={{ color: T.text }}>{totals.cal}</div>
                <div className="text-[9px]" style={{ color: T.sub }}>de {CAL_GOAL} kcal</div>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              <MacroBar label="Proteína" value={totals.p} goal={PROT_GOAL} color="#12C9A6" />
              <MacroBar label="Carboidratos" value={totals.c} goal={CARB_GOAL} color="#F59E0B" />
              <MacroBar label="Gordura" value={totals.f} goal={FAT_GOAL} color="#F97316" />
            </div>
          </div>
        </div>

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
          {!open && <button onClick={() => setOpen(true)} className="text-[13px] font-bold px-3.5 py-1.5 rounded-full text-white active:scale-95 transition" style={{ background: T.teal }}>+ Refeição</button>}
        </div>

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

            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar alimento (ex: arroz, frango...)"
              className="w-full bg-white border rounded-2xl px-4 py-3 text-[14px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />

            {results.length > 0 && (
              <div className="mt-2 rounded-2xl overflow-hidden border" style={{ borderColor: '#EDF2F7', background: '#fff' }}>
                {results.slice(0, 6).map((food) => (
                  <button key={food.id} onClick={() => addFood(food)} className="w-full flex items-center justify-between px-3.5 py-2.5 text-left active:bg-slate-50" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <span className="text-[13px]" style={{ color: T.text }}>{food.emoji} {food.name}</span>
                    <span className="text-[11px]" style={{ color: T.sub }}>{Math.round(food.calories)} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}

            {entries.length > 0 && (
              <div className="mt-3 space-y-2">
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
                  Total: {entryTotals.cal} kcal · {entryTotals.p}g P · {entryTotals.c}g C · {entryTotals.f}g G
                </div>
              </div>
            )}

            {entries.length === 0 && (
              <div className="mt-3">
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
            <p className="text-[13px] mt-1" style={{ color: T.sub }}>Nenhuma refeição registrada hoje.</p>
          </div>
        )}

        {byType.map((g) => (
          <div key={g.key} className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider px-1 mb-1.5" style={{ color: T.sub }}>{g.emoji} {g.key}</p>
            <div style={card} className="p-2">
              {g.items.map((m) => (
                <div key={m.id} className="flex items-center px-3 py-2.5" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{m.name}</div>
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
                      <div className="w-full rounded-t-lg" style={{ height: `${hPct}%`, background: today ? T.teal : w.calories > CAL_GOAL ? '#FDBA74' : '#BAE6FD', minHeight: 3 }} />
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
