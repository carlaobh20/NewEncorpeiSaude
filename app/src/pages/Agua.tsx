import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { todayISO } from '../lib/health'
import { getWater, addWater, listWater, type WaterDay } from '../lib/db'
import { getWaterGoal, setWaterGoal } from '../lib/nutrition'

const T = { text: '#0F172A', sub: '#64748B', blue: '#3B82F6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

const QUICK = [
  { ml: 250, label: 'Copo', emoji: '🥛' },
  { ml: 500, label: 'Garrafa P', emoji: '🍶' },
  { ml: 750, label: 'Garrafa M', emoji: '🫙' },
  { ml: 1000, label: 'Litro', emoji: '💧' },
]

export default function Agua() {
  const { user } = useAuth()
  const [ml, setMl] = useState(0)
  const [goal, setGoal] = useState(3000)
  const [hist, setHist] = useState<WaterDay[]>([])
  const [custom, setCustom] = useState('')
  const [editGoal, setEditGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    if (!user || !supabaseReady) return
    getWater(user.id, todayISO()).then(setMl).catch(() => {})
    listWater(user.id).then(setHist).catch(() => {})
    getWaterGoal(user.id).then(setGoal).catch(() => {})
  }
  useEffect(load, [user])

  const add = async (delta: number) => {
    if (!user || busy || !delta) return
    if (delta > 0 && (delta < 1 || delta > 5000)) return
    setBusy(true)
    try { const next = await addWater(user.id, todayISO(), delta); setMl(next); listWater(user.id).then(setHist).catch(() => {}) } catch { /* noop */ } finally { setBusy(false) }
  }

  const saveGoal = async () => {
    const g = parseInt(goalInput)
    if (!user || !g || g < 500 || g > 8000) return
    try { await setWaterGoal(user.id, g); setGoal(g); setEditGoal(false) } catch { /* noop */ }
  }

  const pct = Math.min(100, (ml / goal) * 100)
  const cups = Math.round(ml / 250)
  const r = 78, c = 2 * Math.PI * r
  const maxHist = Math.max(...hist.map((h) => h.ml), goal)

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pb-28">
        <ScreenHeader title="Água" />

        {/* ── Anel de progresso ── */}
        <div style={card} className="p-6 flex flex-col items-center">
          <div className="relative" style={{ width: 200, height: 200 }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={r} fill="none" stroke="#EEF1F5" strokeWidth="12" />
              <circle cx="100" cy="100" r={r} fill="none" stroke={T.blue} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[26px]">💧</span>
              <div className="text-[30px] font-bold tabular-nums" style={{ color: T.text }}>{(ml / 1000).toFixed(2).replace('.', ',')}L</div>
              <div className="text-[12px]" style={{ color: T.sub }}>{Math.round(pct)}% da meta</div>
            </div>
          </div>

          {!editGoal ? (
            <button onClick={() => { setGoalInput(String(goal)); setEditGoal(true) }} className="mt-2 text-[12px] font-semibold px-3 py-1.5 rounded-full active:scale-95 transition" style={{ color: T.blue, background: 'rgba(59,130,246,0.10)' }}>
              Meta: {(goal / 1000).toFixed(1).replace('.', ',')}L · editar
            </button>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} placeholder="ml"
                className="w-24 bg-white border rounded-xl px-3 py-2 text-[13px] text-center outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
              <button onClick={saveGoal} className="text-[12px] font-bold px-3 py-2 rounded-xl text-white" style={{ background: T.blue }}>OK</button>
              <button onClick={() => setEditGoal(false)} className="text-[12px] px-2" style={{ color: T.sub }}>cancelar</button>
            </div>
          )}
          {pct >= 100 && <p className="text-[13px] font-semibold mt-2" style={{ color: '#0E9F6E' }}>🎉 Meta batida! Continue hidratado.</p>}
        </div>

        {/* ── Adição rápida ── */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {QUICK.map((q) => (
            <button key={q.ml} onClick={() => add(q.ml)} disabled={busy} style={card} className="py-3 text-center active:scale-95 transition">
              <div className="text-[20px]">{q.emoji}</div>
              <div className="text-[12px] font-bold" style={{ color: T.text }}>+{q.ml >= 1000 ? '1L' : `${q.ml}ml`}</div>
              <div className="text-[9px]" style={{ color: T.sub }}>{q.label}</div>
            </button>
          ))}
        </div>

        {/* ── Valor customizado / remover ── */}
        <div className="flex gap-2 mt-2.5">
          <input type="number" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Outro valor (ml)"
            className="flex-1 bg-white border rounded-2xl px-4 py-3 text-[14px] outline-none focus:border-sky-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
          <button onClick={() => { add(parseInt(custom) || 0); setCustom('') }} className="px-5 rounded-2xl font-bold text-white active:scale-95 transition" style={{ background: T.blue }}>+</button>
          <button onClick={() => add(-250)} className="px-4 rounded-2xl font-bold active:scale-95 transition" style={{ background: '#EEF1F5', color: T.sub }} title="Remover um copo">−</button>
        </div>
        <p className="text-[11px] mt-1.5 px-1" style={{ color: T.sub }}>≈ {cups} copos de 250ml hoje</p>

        {/* ── Histórico ── */}
        {hist.length > 0 && (
          <>
            <h3 className="font-semibold mt-6 mb-2 px-1" style={{ color: T.text }}>Últimos dias</h3>
            <div style={card} className="p-4">
              {hist.slice(0, 10).map((h) => {
                const p = Math.min(100, (h.ml / maxHist) * 100)
                const hit = h.ml >= goal
                return (
                  <div key={h.date} className="flex items-center gap-3 py-1.5">
                    <span className="text-[11px] w-12 flex-shrink-0" style={{ color: T.sub }}>{new Date(h.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#EEF1F5' }}>
                      <div className="h-full rounded-full" style={{ width: `${p}%`, background: hit ? '#12C9A6' : T.blue }} />
                    </div>
                    <span className="text-[11px] font-semibold w-14 text-right flex-shrink-0" style={{ color: T.text }}>{(h.ml / 1000).toFixed(1).replace('.', ',')}L {hit ? '✅' : ''}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
