import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { Card } from '../components/home/Sections'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { addMeal, listMeals, todayISO, type Meal } from '../lib/health'

const TYPES = ['Café', 'Almoço', 'Jantar', 'Lanche']
const CAL_GOAL = 2200, PROT_GOAL = 150

export default function Alimentacao() {
  const { user } = useAuth()
  const [meals, setMeals] = useState<Meal[]>([])
  const [form, setForm] = useState({ type: 'Café', name: '', calories: '', protein: '' })
  const [flash, setFlash] = useState('')
  const load = () => { if (user && supabaseReady) listMeals(user.id, todayISO()).then(setMeals).catch(() => {}) }
  useEffect(load, [user])

  const totals = meals.reduce((a, m) => ({ c: a.c + (m.calories || 0), p: a.p + (m.protein || 0) }), { c: 0, p: 0 })
  const save = async () => {
    if (!user || !form.name.trim()) return
    try {
      await addMeal(user.id, { date: todayISO(), type: form.type, name: form.name.trim(), calories: parseInt(form.calories) || 0, protein: parseInt(form.protein) || 0 })
      setForm({ ...form, name: '', calories: '', protein: '' }); setFlash('Refeição registrada!'); setTimeout(() => setFlash(''), 1400); load()
    } catch { setFlash('Erro: rodou o health_schema.sql?') }
  }

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title="Alimentação" />
      <div className="grid grid-cols-2 gap-3 mt-1">
        <Card className="p-4"><div className="text-xs text-slate-400">Calorias hoje</div><div className="text-2xl font-bold text-slate-900">{totals.c}<span className="text-sm text-slate-400"> / {CAL_GOAL}</span></div>
          <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-orange-400" style={{ width: `${Math.min(100, totals.c / CAL_GOAL * 100)}%` }} /></div></Card>
        <Card className="p-4"><div className="text-xs text-slate-400">Proteína hoje</div><div className="text-2xl font-bold text-slate-900">{totals.p}<span className="text-sm text-slate-400"> / {PROT_GOAL}g</span></div>
          <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-rose-400" style={{ width: `${Math.min(100, totals.p / PROT_GOAL * 100)}%` }} /></div></Card>
      </div>

      <Card className="p-5 mt-3">
        <div className="font-semibold text-slate-900 mb-3">Adicionar refeição</div>
        <div className="flex gap-2 flex-wrap mb-3">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setForm({ ...form, type: t })} className={`px-3 py-1.5 rounded-full text-sm font-medium ${form.type === t ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{t}</button>
          ))}
        </div>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="O que você comeu?" className="w-full bg-white border border-[#EDF2F7] rounded-xl px-4 py-3 outline-none focus:border-emerald-400 mb-2" />
        <div className="flex gap-2">
          <input value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} inputMode="numeric" placeholder="kcal" className="flex-1 bg-white border border-[#EDF2F7] rounded-xl px-3 py-2.5 text-center outline-none focus:border-emerald-400" />
          <input value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} inputMode="numeric" placeholder="proteína (g)" className="flex-1 bg-white border border-[#EDF2F7] rounded-xl px-3 py-2.5 text-center outline-none focus:border-emerald-400" />
        </div>
        <button onClick={save} className="w-full mt-3 py-2.5 rounded-xl font-semibold text-white bg-emerald-500">+ Adicionar</button>
        {flash && <div className="text-xs text-center mt-2 text-emerald-600">{flash}</div>}
      </Card>

      <h3 className="text-slate-900 font-semibold mt-6 mb-2 px-1">Refeições de hoje</h3>
      {meals.length === 0 ? <p className="text-center py-6 text-sm text-slate-400">Nenhuma refeição registrada hoje.</p> : (
        <Card className="p-2"><div className="divide-y divide-[#F2F4F8]">
          {meals.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-3">
              <div><div className="font-semibold text-slate-900 text-sm">{m.name}</div><div className="text-xs text-slate-400">{m.type}</div></div>
              <div className="text-right"><div className="text-sm font-semibold text-slate-900">{m.calories} kcal</div><div className="text-xs text-slate-400">{m.protein}g prot</div></div>
            </div>
          ))}
        </div></Card>
      )}
    </div>
  )
}
