import { useEffect, useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { Card } from '../components/home/Sections'
import { iconMap } from '../components/home/ica'
import { tones } from '../lib/homeData'
import { modules, type Slug } from '../lib/modules'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listWeights, saveWeight, type WeightRow, getWater, addWater, listWater, type WaterDay } from '../lib/db'
import { getSleep, saveSleep, listSleep, todayNutrition, listMeals, todayISO, type SleepDay, type Meal } from '../lib/health'

export default function ModuleScreen() {
  const { slug } = useParams<{ slug: string }>()
  const nav = useNavigate()
  const cfg = slug ? modules[slug as Slug] : undefined
  const { user } = useAuth()
  const [flash, setFlash] = useState<string | null>(null)
  const [val, setVal] = useState('')
  const [weights, setWeights] = useState<WeightRow[] | null>(null)
  const [waterToday, setWaterToday] = useState<number | null>(null)
  const [waterDays, setWaterDays] = useState<WaterDay[]>([])
  const [sleepDays, setSleepDays] = useState<SleepDay[]>([])
  const [nutri, setNutri] = useState<{ calories: number; protein: number } | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])

  const on = supabaseReady && !!user
  const isPeso = cfg?.slug === 'peso' && on
  const isWater = cfg?.slug === 'agua' && on
  const isSono = cfg?.slug === 'sono' && on
  const isNutri = (cfg?.slug === 'calorias' || cfg?.slug === 'proteina') && on

  useEffect(() => {
    if (!user) return
    if (isPeso) listWeights(user.id).then(setWeights).catch(() => setWeights([]))
    if (isWater) { getWater(user.id, todayISO()).then(setWaterToday).catch(() => setWaterToday(0)); listWater(user.id).then(setWaterDays).catch(() => {}) }
    if (isSono) listSleep(user.id).then(setSleepDays).catch(() => {})
    if (isNutri) { todayNutrition(user.id, todayISO()).then(setNutri).catch(() => {}); listMeals(user.id, todayISO()).then(setMeals).catch(() => {}) }
  }, [isPeso, isWater, isSono, isNutri, user])

  if (!cfg) return <Navigate to="/" replace />
  const Icon = iconMap[cfg.icon]
  const t = tones[cfg.tone]
  const toast = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 1800) }

  const savePeso = async () => {
    const kg = parseFloat(val.replace(',', '.')); if (!kg || !user) return
    try { await saveWeight(user.id, todayISO(), +kg.toFixed(1)); setVal(''); toast(`Peso salvo: ${kg.toFixed(1)} kg`); listWeights(user.id).then(setWeights) }
    catch (e: any) { toast('Erro: ' + (e?.message || 'falha')) }
  }
  const saveSono = async () => {
    const h = parseFloat(val.replace(',', '.')); if (!h || !user) return
    try { await saveSleep(user.id, todayISO(), h); setVal(''); toast(`Sono salvo: ${h}h`); listSleep(user.id).then(setSleepDays) }
    catch (e: any) { toast('Erro: ' + (e?.message || 'rodou health_schema.sql?')) }
  }
  const doAddWater = async (ml: number) => {
    if (!user) return
    try { const n = await addWater(user.id, todayISO(), ml); setWaterToday(n); listWater(user.id).then(setWaterDays) }
    catch (e: any) { toast('Erro: ' + (e?.message || 'falha')) }
  }

  const goalMl = 3000
  const latest = weights && weights.length ? weights[weights.length - 1].kg : null
  let heroValue = cfg.hero, heroSub = cfg.heroSub, goalLabel = cfg.goalLabel
  if (isPeso) { heroValue = latest != null ? String(latest) : '—'; heroSub = latest != null ? 'último registro' : 'sem registros' }
  if (isWater) { const ml = waterToday ?? 0; heroValue = (ml / 1000).toFixed(1); heroSub = `de ${(goalMl / 1000).toFixed(1)} L hoje`; goalLabel = ml >= goalMl ? 'Meta batida! 💧' : `Faltam ${((goalMl - ml) / 1000).toFixed(1)} L` }
  if (isSono) { const last = sleepDays[0]; heroValue = last ? String(last.hours) : '—'; heroSub = last ? `última noite (${last.date})` : 'sem registros'; goalLabel = 'Meta 8h' }
  if (isNutri && nutri) { const isCal = cfg.slug === 'calorias'; heroValue = String(isCal ? nutri.calories : nutri.protein); heroSub = isCal ? 'de 2.200 kcal hoje' : 'de 150 g hoje'; goalLabel = 'Registrado via Alimentação' }

  const history = isPeso ? (weights ? [...weights].reverse().map((w) => ({ label: w.date, value: `${w.kg} kg` })) : [])
    : isWater ? waterDays.map((w) => ({ label: w.date, value: `${(w.ml / 1000).toFixed(1)} L` }))
    : isSono ? sleepDays.map((s) => ({ label: s.date, value: `${s.hours} h` }))
    : isNutri ? meals.map((m) => ({ label: `${m.type} · ${m.name}`, value: cfg.slug === 'calorias' ? `${m.calories} kcal` : `${m.protein} g` }))
    : cfg.history

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title={cfg.title} />
      <Card className="p-6 mt-1">
        <div className="flex items-center gap-4">
          <span className={`w-14 h-14 rounded-2xl ${t.bg} flex items-center justify-center`}>{Icon && <Icon className={`w-7 h-7 ${t.fg}`} />}</span>
          <div><div className="flex items-end gap-1"><span className="text-4xl font-bold text-slate-900 tracking-tight">{heroValue}</span><span className="text-slate-400 font-medium mb-1">{cfg.unit}</span></div><div className="text-slate-500 text-sm">{heroSub}</div></div>
        </div>
        <div className={`mt-4 text-sm font-medium ${t.fg}`}>{goalLabel}</div>
        {(isPeso || isWater || isSono || isNutri) && <div className="mt-1 text-xs text-emerald-600">● dados reais (Supabase)</div>}
      </Card>

      <h3 className="text-slate-900 font-semibold mt-6 mb-3 px-1">Registrar</h3>
      {isNutri ? (
        <button onClick={() => nav('/m/alimentacao')} className="w-full bg-emerald-500 text-white font-semibold py-3.5 rounded-2xl">Registrar refeição →</button>
      ) : isWater ? (
        <div className="grid grid-cols-3 gap-2.5">
          {[250, 500, 750].map((ml) => (<button key={ml} onClick={() => doAddWater(ml)} className="bg-white border border-[#EDF2F7] rounded-2xl py-4 font-semibold text-sky-500 hover:border-sky-300 active:scale-[0.98] transition shadow-[0_1px_2px_rgba(16,24,40,0.04)]">+{ml}ml</button>))}
          <button onClick={() => doAddWater(-250)} className="col-span-3 bg-white border border-[#EDF2F7] rounded-2xl py-2.5 font-medium text-slate-500 active:scale-[0.98] transition">− Remover 250ml</button>
        </div>
      ) : (isPeso || isSono) ? (
        <div className="flex gap-2">
          <input value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal" onKeyDown={(e) => e.key === 'Enter' && (isPeso ? savePeso() : saveSono())}
            placeholder={isSono ? 'Horas de sono (ex: 7.5)' : `Novo valor (${cfg.unit})`} className="flex-1 bg-white border border-[#EDF2F7] rounded-2xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-400" />
          <button onClick={() => isPeso ? savePeso() : saveSono()} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 rounded-2xl transition">Salvar</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {cfg.quickAdd.map((q) => (<button key={q.label} onClick={() => toast(`${cfg.title}: ${q.label} (em breve real)`)} className="bg-white border border-[#EDF2F7] rounded-2xl py-4 font-semibold text-slate-700 hover:border-emerald-300 active:scale-[0.98] transition shadow-[0_1px_2px_rgba(16,24,40,0.04)]">{q.label}</button>))}
        </div>
      )}

      <h3 className="text-slate-900 font-semibold mt-6 mb-3 px-1">Histórico</h3>
      <Card className="p-2">
        {history.length === 0 ? <div className="px-4 py-6 text-center text-slate-400 text-sm">Nenhum registro ainda.</div> : (
          <div className="divide-y divide-[#F2F4F8]">
            {history.map((h, i) => (<div key={i} className="flex items-center justify-between px-3 py-3"><span className="text-slate-500 text-sm">{h.label}</span><span className="font-semibold text-slate-900">{h.value}</span></div>))}
          </div>
        )}
      </Card>

      <div className="mt-4 rounded-[22px] p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider"><svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></svg>Insight da IA</div>
        <p className="text-sm text-slate-200 mt-1.5 leading-relaxed">{cfg.insight}</p>
      </div>

      {flash && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">{flash}</div>}
    </div>
  )
}
