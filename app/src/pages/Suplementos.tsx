import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listSupplements, addSupplement, removeSupplement, takenToday, toggleTaken, todayISO, type Supplement } from '../lib/health'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6', border: '#EDF2F7' }
const card = { background: '#fff', borderRadius: 20, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function Suplementos() {
  const { user } = useAuth()
  const [items, setItems] = useState<Supplement[]>([])
  const [taken, setTaken] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({ name: '', dose: '', time_label: 'Manhã' })
  const [flash, setFlash] = useState('')
  const load = () => { if (user && supabaseReady) { listSupplements(user.id).then(setItems).catch(() => {}); takenToday(user.id, todayISO()).then(setTaken).catch(() => {}) } }
  useEffect(load, [user])

  const add = async () => {
    if (!form.name.trim() || !user) return
    try { await addSupplement(user.id, { name: form.name.trim(), dose: form.dose, time_label: form.time_label }); setForm({ name: '', dose: '', time_label: 'Manhã' }); load() }
    catch { setFlash('Erro: rodou o modules_schema.sql?'); setTimeout(() => setFlash(''), 2000) }
  }
  const toggle = async (id: string) => {
    if (!user) return
    const has = taken.has(id); const next = new Set(taken); has ? next.delete(id) : next.add(id); setTaken(next)
    try { await toggleTaken(user.id, id, todayISO(), !has) } catch {}
  }

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pb-28">
        <ScreenHeader title="Suplementos" />
        <div className="text-[13px] mb-3 px-1" style={{ color: T.sub }}>{taken.size}/{items.length} tomados hoje</div>

        {items.map((it) => {
          const done = taken.has(it.id)
          return (
            <div key={it.id} style={{ ...card, background: done ? '#F0FDFA' : '#fff', border: done ? '1px solid #99F6E4' : '1px solid #EDF2F7' }} className="p-4 mb-2 flex items-center gap-3">
              <button onClick={() => toggle(it.id)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? T.teal : 'transparent', border: done ? 'none' : '1.5px solid #CBD5E1' }}>
                {done && <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><path d="M5 12l5 5L20 6" /></svg>}
              </button>
              <div className="flex-1"><div className="font-semibold" style={{ color: T.text }}>{it.name}</div><div className="text-[12px]" style={{ color: T.sub }}>{[it.dose, it.time_label].filter(Boolean).join(' · ')}</div></div>
              <button onClick={async () => { if (user) { await removeSupplement(user.id, it.id); load() } }} className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>remover</button>
            </div>
          )
        })}

        <div style={card} className="p-4 mt-3">
          <div className="font-semibold mb-3" style={{ color: T.text }}>Adicionar suplemento</div>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome (ex: Creatina)" className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 mb-2 outline-none focus:border-emerald-400" style={{ borderColor: T.border }} />
          <div className="flex gap-2">
            <input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="Dose (5g)" className="flex-1 bg-slate-50 border rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400" style={{ borderColor: T.border }} />
            <select value={form.time_label} onChange={(e) => setForm({ ...form, time_label: e.target.value })} className="bg-slate-50 border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: T.border }}>
              {['Manhã', 'Pré-treino', 'Pós-treino', 'Almoço', 'Noite'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={add} className="w-full mt-3 py-2.5 rounded-xl font-semibold text-white" style={{ background: T.teal }}>+ Adicionar</button>
          {flash && <div className="text-[12px] text-center mt-2" style={{ color: '#DC2626' }}>{flash}</div>}
        </div>
      </div>
    </div>
  )
}
