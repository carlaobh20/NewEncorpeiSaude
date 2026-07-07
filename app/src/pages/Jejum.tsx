import { useEffect, useMemo, useRef, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getActiveFast, startFast, endFast, listFasts, type Fast } from '../lib/fasting'
import {
  FASTING_PLANS_RICH, FASTING_PHASES_RICH, FASTING_PHASES_DETAILED, QUICK_TIPS, SEVERITY_STYLE,
  richPhaseAt, findCurrentPhaseIndex,
} from '../lib/fastingPhases'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6', border: '#EDF2F7' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }
const pad = (n: number) => String(n).padStart(2, '0')

export default function Jejum() {
  const { user } = useAuth()
  const [active, setActive] = useState<Fast | null>(null)
  const [hist, setHist] = useState<Fast[]>([])
  const [now, setNow] = useState(Date.now())
  const [plan, setPlan] = useState(16)
  const [loading, setLoading] = useState(true)
  const [showAllPhases, setShowAllPhases] = useState(false)

  const load = () => {
    if (user && supabaseReady) {
      getActiveFast(user.id).then(setActive).catch(() => {}).finally(() => setLoading(false))
      listFasts(user.id).then(setHist).catch(() => {})
    } else setLoading(false)
  }
  useEffect(load, [user])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  const start = async () => { if (user) { await startFast(user.id, plan); load() } }
  const stop = async () => { if (user && active) { await endFast(user.id, active.id); load() } }

  const elapsedMs = active ? now - new Date(active.start_at).getTime() : 0
  const hours = elapsedMs / 3600000
  const h = Math.floor(hours), m = Math.floor((elapsedMs % 3600000) / 60000), s = Math.floor((elapsedMs % 60000) / 1000)
  const targetMs = active ? active.target_hours * 3600000 : 0
  const pct = active ? Math.min(100, (elapsedMs / targetMs) * 100) : 0

  const phase = richPhaseAt(hours)
  const phaseIdx = FASTING_PHASES_RICH.indexOf(phase)
  const next = FASTING_PHASES_RICH[phaseIdx + 1]
  const detailedIdx = findCurrentPhaseIndex(hours)

  const selectedPlan = FASTING_PLANS_RICH.find((p) => p.hours === plan)
  const intermittent = FASTING_PLANS_RICH.filter((p) => p.type === 'intermittent')
  const extended = FASTING_PLANS_RICH.filter((p) => p.type === 'extended')

  /* Estatísticas (últimas 20 sessões) */
  const stats = useMemo(() => {
    const done = hist.filter((f) => f.end_at)
    const completed = done.filter((f) => (new Date(f.end_at!).getTime() - new Date(f.start_at).getTime()) / 3600000 >= f.target_hours).length
    const totalH = done.reduce((acc, f) => acc + (new Date(f.end_at!).getTime() - new Date(f.start_at).getTime()) / 3600000, 0)
    const longest = done.reduce((mx, f) => Math.max(mx, (new Date(f.end_at!).getTime() - new Date(f.start_at).getTime()) / 3600000), 0)
    return {
      total: done.length,
      completed,
      adherence: done.length ? Math.round((completed / done.length) * 100) : 0,
      totalH: Math.round(totalH),
      longest,
    }
  }, [hist])

  /* Régua de fases: rola até a fase atual */
  const rulerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (active && rulerRef.current && detailedIdx >= 0) {
      const el = rulerRef.current.children[detailedIdx] as HTMLElement | undefined
      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [active, detailedIdx])

  const r = 78, c = 2 * Math.PI * r

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-28">
        <ScreenHeader title="Jejum" />

        {loading ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p> : !active ? (
          <>
            {/* ── Escolha de protocolo ── */}
            <div style={card} className="p-5 text-center mb-3">
              <div className="text-[40px]">⏱️</div>
              <h2 className="font-bold text-[18px] mt-1" style={{ color: T.text }}>Iniciar jejum</h2>
              <p className="text-[13px]" style={{ color: T.sub }}>Escolha seu protocolo e comece.</p>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: T.sub }}>Jejum intermitente</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {intermittent.map((p) => (
                <button key={p.hours} onClick={() => setPlan(p.hours)} className="py-2.5 rounded-2xl text-center transition active:scale-95" style={plan === p.hours ? { background: T.teal, color: '#fff' } : { ...card, borderRadius: 16 }}>
                  <div className="text-[14px] font-bold" style={{ color: plan === p.hours ? '#fff' : T.text }}>{p.title}</div>
                  <div className="text-[9px]" style={{ color: plan === p.hours ? 'rgba(255,255,255,0.8)' : T.sub }}>{p.sub}</div>
                </button>
              ))}
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: T.sub }}>Jejum prolongado</p>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {extended.map((p) => (
                <button key={p.hours} onClick={() => setPlan(p.hours)} className="py-2.5 rounded-2xl text-center transition active:scale-95" style={plan === p.hours ? { background: '#D97706', color: '#fff' } : { ...card, borderRadius: 16 }}>
                  <div className="text-[13px] font-bold" style={{ color: plan === p.hours ? '#fff' : T.text }}>{p.title}</div>
                  <div className="text-[9px]" style={{ color: plan === p.hours ? 'rgba(255,255,255,0.8)' : T.sub }}>{p.sub}</div>
                </button>
              ))}
            </div>

            {selectedPlan && (
              <div style={card} className="p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-bold" style={{ color: T.text }}>Jejum {selectedPlan.title}</div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={selectedPlan.requiresMedical ? { color: '#DC2626', background: 'rgba(220,38,38,0.10)' } : { color: '#0E9F6E', background: 'rgba(18,201,138,0.12)' }}>
                    {selectedPlan.requiresMedical ? 'Requer acompanhamento médico' : 'Prática comum'}
                  </span>
                </div>
                <p className="text-[13px] mt-1" style={{ color: T.sub }}>{selectedPlan.benefit}</p>
              </div>
            )}

            {selectedPlan?.requiresMedical && (
              <div className="p-3.5 rounded-2xl mb-3 text-[12px]" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#991B1B' }}>
                ⚠️ Jejuns de 48h ou mais devem ser feitos apenas com acompanhamento profissional. Atenção a hidratação, eletrólitos e sinais do corpo.
              </div>
            )}

            <button onClick={start} className="w-full py-4 rounded-2xl font-bold text-white text-[16px] active:scale-[0.99] transition" style={{ background: selectedPlan?.requiresMedical ? '#D97706' : T.teal, boxShadow: '0 10px 24px -6px rgba(18,201,166,0.5)' }}>
              Iniciar jejum de {plan}h
            </button>
          </>
        ) : (
          <>
            {/* ── Timer ── */}
            <div style={card} className="p-6 flex flex-col items-center">
              <div className="relative" style={{ width: 200, height: 200 }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r={r} fill="none" stroke="#EEF1F5" strokeWidth="12" />
                  <circle cx="100" cy="100" r={r} fill="none" stroke={phase.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[22px]">{phase.emoji}</span>
                  <div className="text-[32px] font-bold tabular-nums" style={{ color: T.text }}>{pad(h)}:{pad(m)}:{pad(s)}</div>
                  <div className="text-[12px]" style={{ color: T.sub }}>de {active.target_hours}h · {Math.round(pct)}%</div>
                </div>
              </div>
              <div className="text-[12px] mt-1" style={{ color: T.sub }}>
                Início: {new Date(active.start_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
              <button onClick={stop} className="mt-4 px-6 py-3 rounded-2xl font-bold text-white active:scale-95 transition" style={{ background: '#EF4444' }}>Encerrar jejum</button>
            </div>

            {/* ── Fase atual (o que acontece no corpo) ── */}
            <div style={{ ...card, background: '#0F172A', border: 'none' }} className="p-5 mt-3 text-white">
              <div className="flex items-center gap-3">
                <span className="text-[32px]">{phase.emoji}</span>
                <div>
                  <div className="text-[15px] font-bold">{phase.title}</div>
                  <div className="text-[12px]" style={{ color: '#94A3B8' }}>Fase atual · {phase.hour}–{phase.endHour}h</div>
                </div>
              </div>
              <p className="text-[13px] mt-3" style={{ color: '#CBD5E1' }}>{phase.body}</p>
              <div className="mt-3 px-3 py-2 rounded-xl text-[12px]" style={{ background: 'rgba(255,255,255,0.07)', color: '#E2E8F0' }}>
                🔬 {phase.process}
              </div>
              {next && (
                <div className="text-[12px] mt-3 pt-3 flex items-center justify-between" style={{ color: '#94A3B8', borderTop: '1px solid #1E293B' }}>
                  <span>Próxima: {next.emoji} {next.title}</span>
                  <span className="font-semibold text-white">em {Math.max(0, next.hour - hours).toFixed(1)}h</span>
                </div>
              )}
            </div>

            {/* ── Régua de fases detalhadas (4 em 4h) ── */}
            <div className="flex items-center justify-between mt-5 mb-2 px-1">
              <h3 className="font-semibold" style={{ color: T.text }}>Linha do tempo do corpo</h3>
              <button onClick={() => setShowAllPhases(!showAllPhases)} className="text-[12px] font-semibold" style={{ color: T.teal }}>
                {showAllPhases ? 'Ver menos' : 'Ver todas'}
              </button>
            </div>
            {!showAllPhases ? (
              <div ref={rulerRef} className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                {FASTING_PHASES_DETAILED.map((p, i) => {
                  const on = i === detailedIdx
                  const past = i < detailedIdx
                  const sv = SEVERITY_STYLE[p.severity]
                  return (
                    <div key={p.range} className="flex-shrink-0 w-40 p-3 rounded-2xl" style={on ? { background: '#0F172A', color: '#fff' } : { ...card, opacity: past ? 0.55 : 1 }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold" style={{ color: on ? '#5EEAD4' : sv.color }}>{p.range}</span>
                        {past && <span className="text-[10px]">✓</span>}
                        {on && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(94,234,212,0.15)', color: '#5EEAD4' }}>agora</span>}
                      </div>
                      <div className="text-[12px] font-bold mt-1" style={{ color: on ? '#fff' : T.text }}>{p.title}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: on ? '#94A3B8' : T.sub }}>{p.focus}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={card} className="p-2">
                {FASTING_PHASES_DETAILED.map((p, i) => {
                  const on = i === detailedIdx
                  const sv = SEVERITY_STYLE[p.severity]
                  return (
                    <div key={p.range} className="px-3 py-2.5" style={{ borderTop: i > 0 ? '1px solid rgba(15,23,42,0.05)' : 'none', background: on ? 'rgba(18,201,166,0.07)' : 'transparent', borderRadius: on ? 14 : 0 }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold" style={{ color: T.text }}>{p.range} · {p.title}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: sv.color, background: sv.bg }}>{sv.label}</span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: T.sub }}>{p.description}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Dicas rápidas ── */}
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              {QUICK_TIPS.map((tip) => (
                <div key={tip.title} style={card} className="p-3 flex items-center gap-2.5">
                  <span className="text-[20px]">{tip.emoji}</span>
                  <div>
                    <div className="text-[12px] font-bold" style={{ color: T.text }}>{tip.title}</div>
                    <div className="text-[10px]" style={{ color: T.sub }}>{tip.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Estatísticas ── */}
        {!loading && stats.total > 0 && (
          <>
            <h3 className="font-semibold mt-6 mb-2 px-1" style={{ color: T.text }}>Suas estatísticas</h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div style={card} className="p-3 text-center">
                <div className="text-[20px] font-bold" style={{ color: T.teal }}>{stats.adherence}%</div>
                <div className="text-[10px]" style={{ color: T.sub }}>Aderência</div>
              </div>
              <div style={card} className="p-3 text-center">
                <div className="text-[20px] font-bold" style={{ color: T.text }}>{stats.total}</div>
                <div className="text-[10px]" style={{ color: T.sub }}>Sessões</div>
              </div>
              <div style={card} className="p-3 text-center">
                <div className="text-[20px] font-bold" style={{ color: '#F97316' }}>{stats.longest.toFixed(0)}h</div>
                <div className="text-[10px]" style={{ color: T.sub }}>Mais longo</div>
              </div>
            </div>
          </>
        )}

        {/* ── Histórico ── */}
        {hist.length > 0 && (
          <>
            <h3 className="font-semibold mt-5 mb-2 px-1" style={{ color: T.text }}>Histórico</h3>
            <div style={card} className="p-2">
              {hist.map((f) => {
                const dur = (new Date(f.end_at!).getTime() - new Date(f.start_at).getTime()) / 3600000
                return (
                  <div key={f.id} className="flex justify-between px-3 py-2.5 text-[13px]" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                    <span style={{ color: T.sub }}>{new Date(f.start_at).toLocaleDateString('pt-BR')}</span>
                    <span style={{ color: T.text }}><b>{dur.toFixed(1)}h</b> {dur >= f.target_hours ? '✅' : `/ ${f.target_hours}h`}</span>
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
