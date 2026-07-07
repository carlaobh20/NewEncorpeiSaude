import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { PHASES, PLANS, phaseAt, getActiveFast, startFast, endFast, listFasts, type Fast } from '../lib/fasting'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6', border: '#EDF2F7' }
const card = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }
const pad = (n: number) => String(n).padStart(2, '0')

export default function Jejum() {
  const { user } = useAuth()
  const [active, setActive] = useState<Fast | null>(null)
  const [hist, setHist] = useState<Fast[]>([])
  const [now, setNow] = useState(Date.now())
  const [plan, setPlan] = useState(16)
  const [loading, setLoading] = useState(true)

  const load = () => { if (user && supabaseReady) { getActiveFast(user.id).then(setActive).catch(() => {}).finally(() => setLoading(false)); listFasts(user.id).then(setHist).catch(() => {}) } else setLoading(false) }
  useEffect(load, [user])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  const start = async () => { if (user) { await startFast(user.id, plan); load() } }
  const stop = async () => { if (user && active) { await endFast(user.id, active.id); load() } }

  const elapsedMs = active ? now - new Date(active.start_at).getTime() : 0
  const hours = elapsedMs / 3600000
  const h = Math.floor(hours), m = Math.floor((elapsedMs % 3600000) / 60000), s = Math.floor((elapsedMs % 60000) / 1000)
  const targetMs = active ? active.target_hours * 3600000 : 0
  const pct = active ? Math.min(100, (elapsedMs / targetMs) * 100) : 0
  const phase = phaseAt(hours)
  const phaseIdx = PHASES.indexOf(phase)
  const next = PHASES[phaseIdx + 1]
  const r = 78, c = 2 * Math.PI * r

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pb-28">
        <ScreenHeader title="Jejum" />
        {loading ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p> : !active ? (
          <>
            <div style={card} className="p-5 text-center mb-3">
              <div className="text-[40px]">⏱️</div>
              <h2 className="font-bold text-[18px] mt-1" style={{ color: T.text }}>Iniciar jejum</h2>
              <p className="text-[13px]" style={{ color: T.sub }}>Escolha seu protocolo e comece.</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {PLANS.map((p) => (
                <button key={p.hours} onClick={() => setPlan(p.hours)} className="py-3 rounded-2xl text-center transition" style={plan === p.hours ? { background: T.teal, color: '#fff' } : { ...card }}>
                  <div className="text-[16px] font-bold" style={{ color: plan === p.hours ? '#fff' : T.text }}>{p.title}</div>
                  <div className="text-[10px]" style={{ color: plan === p.hours ? 'rgba(255,255,255,0.8)' : T.sub }}>{p.sub}</div>
                </button>
              ))}
            </div>
            <button onClick={start} className="w-full py-4 rounded-2xl font-bold text-white text-[16px]" style={{ background: T.teal, boxShadow: '0 10px 24px -6px rgba(18,201,166,0.6)' }}>Iniciar jejum de {plan}h</button>
          </>
        ) : (
          <>
            <div style={card} className="p-6 flex flex-col items-center">
              <div className="relative" style={{ width: 200, height: 200 }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r={r} fill="none" stroke="#EEF1F5" strokeWidth="12" />
                  <circle cx="100" cy="100" r={r} fill="none" stroke={phase.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[34px] font-bold tabular-nums" style={{ color: T.text }}>{pad(h)}:{pad(m)}:{pad(s)}</div>
                  <div className="text-[12px]" style={{ color: T.sub }}>de {active.target_hours}h · {Math.round(pct)}%</div>
                </div>
              </div>
              <button onClick={stop} className="mt-4 px-6 py-3 rounded-2xl font-bold text-white" style={{ background: '#EF4444' }}>Encerrar jejum</button>
            </div>

            <div style={{ ...card, background: '#0F172A' }} className="p-5 mt-3 text-white">
              <div className="flex items-center gap-3">
                <span className="text-[32px]">{phase.emoji}</span>
                <div><div className="text-[15px] font-bold">{phase.title}</div><div className="text-[12px]" style={{ color: '#94A3B8' }}>Fase atual</div></div>
              </div>
              <p className="text-[13px] mt-2" style={{ color: '#CBD5E1' }}>{phase.desc}</p>
              {next && next.h < 999 && <div className="text-[12px] mt-3 pt-3" style={{ color: '#94A3B8', borderTop: '1px solid #1E293B' }}>Próxima: {next.emoji} {next.title} em {Math.max(0, next.h - hours).toFixed(1)}h</div>}
            </div>
          </>
        )}

        {hist.length > 0 && (
          <>
            <h3 className="font-semibold mt-6 mb-2 px-1" style={{ color: T.text }}>Histórico</h3>
            <div style={card} className="p-2">
              {hist.map((f) => {
                const dur = ((new Date(f.end_at!).getTime() - new Date(f.start_at).getTime()) / 3600000)
                return <div key={f.id} className="flex justify-between px-3 py-2.5 text-[13px]" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}><span style={{ color: T.sub }}>{new Date(f.start_at).toLocaleDateString('pt-BR')}</span><span style={{ color: T.text }}><b>{dur.toFixed(1)}h</b> {dur >= f.target_hours ? '✅' : `/ ${f.target_hours}h`}</span></div>
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
