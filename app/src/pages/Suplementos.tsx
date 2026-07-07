import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady, supabase } from '../lib/supabase'
import { listSupplements, removeSupplement, takenToday, toggleTaken, todayISO, type Supplement } from '../lib/health'
import { supplementWeekStats } from '../lib/sleep'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

const PERIODS = ['Manhã', 'Pré-treino', 'Pós-treino', 'Almoço', 'Tarde', 'Noite']
const PERIOD_EMOJI: Record<string, string> = { 'Manhã': '🌅', 'Pré-treino': '🏋️', 'Pós-treino': '🥤', 'Almoço': '🍛', 'Tarde': '☀️', 'Noite': '🌙' }
type SupplementFull = Supplement & { type?: string }

export default function Suplementos() {
  const { user } = useAuth()
  const [items, setItems] = useState<SupplementFull[]>([])
  const [taken, setTaken] = useState<Set<string>>(new Set())
  const [week, setWeek] = useState<{ pct: number; takenCount: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', dose: '', time_label: 'Manhã', type: 'suplemento' })
  const [flash, setFlash] = useState('')

  const load = () => {
    if (!user || !supabaseReady) return
    supabase.from('supplements').select('id,name,dose,time_label,type').eq('user_id', user.id).order('created_at')
      .then(({ data }) => {
        const list = (data as SupplementFull[]) || []
        setItems(list)
        supplementWeekStats(user.id, list.length).then((w) => setWeek({ pct: w.pct, takenCount: w.takenCount })).catch(() => {})
      })
    takenToday(user.id, todayISO()).then(setTaken).catch(() => {})
  }
  useEffect(load, [user])

  const add = async () => {
    if (!form.name.trim() || !user) return
    try {
      const { error } = await supabase.from('supplements').insert({ user_id: user.id, name: form.name.trim(), dose: form.dose || null, time_label: form.time_label, type: form.type })
      if (error) throw error
      setForm({ name: '', dose: '', time_label: 'Manhã', type: 'suplemento' }); setOpen(false); load()
    } catch { setFlash('Erro ao adicionar'); setTimeout(() => setFlash(''), 2000) }
  }

  const toggle = async (id: string) => {
    if (!user) return
    const has = taken.has(id)
    const next = new Set(taken); has ? next.delete(id) : next.add(id); setTaken(next)
    try { await toggleTaken(user.id, id, todayISO(), !has) } catch { /* noop */ }
  }

  const pct = items.length ? Math.round((taken.size / items.length) * 100) : 0
  const r = 30, c = 2 * Math.PI * r
  const groups = PERIODS.map((p) => ({ period: p, list: items.filter((i) => i.time_label === p) })).filter((g) => g.list.length > 0)
  const others = items.filter((i) => !PERIODS.includes(i.time_label || ''))

  const Item = ({ it }: { it: SupplementFull }) => {
    const done = taken.has(it.id)
    return (
      <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
        <button onClick={() => toggle(it.id)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition active:scale-90" style={{ background: done ? T.teal : 'transparent', border: done ? 'none' : '1.5px solid #CBD5E1' }}>
          {done && <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><path d="M5 12l5 5L20 6" /></svg>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold truncate" style={{ color: done ? '#94A3B8' : T.text, textDecoration: done ? 'line-through' : 'none' }}>
            {it.type === 'medicamento' ? '💉' : '💊'} {it.name}
          </div>
          {it.dose && <div className="text-[11px]" style={{ color: T.sub }}>{it.dose}</div>}
        </div>
        <button onClick={async () => { if (user) { await removeSupplement(user.id, it.id).catch(() => {}); load() } }} className="text-[12px] px-1.5" style={{ color: '#CBD5E1' }}>✕</button>
      </div>
    )
  }

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-32">
        <ScreenHeader title="Suplementos" />

        {/* ── Resumo do dia ── */}
        <div style={card} className="p-4 flex items-center gap-4">
          <div className="relative flex-shrink-0" style={{ width: 76, height: 76 }}>
            <svg width="76" height="76" viewBox="0 0 76 76">
              <circle cx="38" cy="38" r={r} fill="none" stroke="#EEF1F5" strokeWidth="7" />
              <circle cx="38" cy="38" r={r} fill="none" stroke={T.teal} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} transform="rotate(-90 38 38)" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[15px] font-bold" style={{ color: T.text }}>{taken.size}/{items.length}</div>
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold" style={{ color: T.text }}>
              {items.length === 0 ? 'Monte seu protocolo' : pct === 100 ? '✅ Protocolo completo hoje!' : 'Protocolo de hoje'}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: T.sub }}>
              {items.length === 0 ? 'Adicione suplementos e medicamentos.' : `${taken.size} de ${items.length} tomados`}
            </div>
            {week && items.length > 0 && (
              <div className="text-[11px] mt-1 font-semibold" style={{ color: week.pct >= 80 ? '#0E9F6E' : '#D97706' }}>
                Adesão 7 dias: {week.pct}%
              </div>
            )}
          </div>
        </div>

        {/* ── Grupos por horário ── */}
        {groups.map((g) => (
          <div key={g.period} className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider px-1 mb-1.5" style={{ color: T.sub }}>
              {PERIOD_EMOJI[g.period]} {g.period}
            </p>
            <div style={card} className="p-1.5">{g.list.map((it) => <Item key={it.id} it={it} />)}</div>
          </div>
        ))}
        {others.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider px-1 mb-1.5" style={{ color: T.sub }}>Outros</p>
            <div style={card} className="p-1.5">{others.map((it) => <Item key={it.id} it={it} />)}</div>
          </div>
        )}

        {/* ── Adicionar ── */}
        {!open ? (
          <button onClick={() => setOpen(true)} className="w-full mt-4 py-3.5 rounded-2xl font-bold text-white text-[15px] active:scale-[0.99] transition" style={{ background: T.teal, boxShadow: '0 10px 24px -6px rgba(18,201,166,0.5)' }}>
            + Adicionar suplemento
          </button>
        ) : (
          <div style={card} className="p-4 mt-4">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{ k: 'suplemento', l: '💊 Suplemento' }, { k: 'medicamento', l: '💉 Medicamento' }].map((t) => (
                <button key={t.k} onClick={() => setForm({ ...form, type: t.k })} className="py-2.5 rounded-xl text-[12px] font-semibold transition" style={form.type === t.k ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{t.l}</button>
              ))}
            </div>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.type === 'medicamento' ? 'Nome (ex: Losartana)' : 'Nome (ex: Creatina)'}
              className="w-full bg-white border rounded-2xl px-4 py-2.5 mb-2 text-[14px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
            <input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="Dose (ex: 5g, 1 comprimido)"
              className="w-full bg-white border rounded-2xl px-4 py-2.5 mb-2 text-[14px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
            <div className="flex flex-wrap gap-1.5 mb-3">
              {PERIODS.map((p) => (
                <button key={p} onClick={() => setForm({ ...form, time_label: p })} className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition" style={form.time_label === p ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{p}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold" style={{ background: '#EEF1F5', color: T.sub }}>Cancelar</button>
              <button onClick={add} className="flex-1 py-3 rounded-2xl font-bold text-white text-[14px]" style={{ background: T.teal }}>Adicionar</button>
            </div>
          </div>
        )}

        {flash && <div className="fixed bottom-24 inset-x-0 flex justify-center z-40"><span className="px-4 py-2 rounded-full text-[13px] font-semibold text-white" style={{ background: '#0F172A' }}>{flash}</span></div>}
      </div>
    </div>
  )
}
