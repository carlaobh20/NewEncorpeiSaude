import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getProfileName, listWeights, getWater, type WeightRow } from '../lib/db'
import { todayISO, listSupplements } from '../lib/health'
import { listSleepFull, supplementWeekStats, type SleepFull } from '../lib/sleep'
import { weekNutrition, getWaterGoal } from '../lib/nutrition'
import { listFasts, type Fast } from '../lib/fasting'
import { fetchTrainingStats, type TrainingStats } from '../lib/training'
import { fetchMonthActivity, type MonthActivity } from '../lib/monthActivity'
import { listExams, resultStatus, type Exam } from '../lib/care'
import { fetchAssessments, type Assessment } from '../lib/muscExtra'
import { listConsultations, type Consultation } from '../lib/care'
import CareChat from '../components/CareChat'
import { canViewPatient } from '../lib/careLinks'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

function Metric({ label, value, sub, color = T.text }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={card} className="p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: T.sub }}>{label}</div>
      <div className="text-[24px] font-bold mt-1" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: T.sub }}>{sub}</div>}
    </div>
  )
}

function MiniLine({ data, color = T.teal }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div className="text-[11px] py-4 text-center" style={{ color: T.sub }}>Sem dados suficientes</div>
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const w = 300, h = 60
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 8) - 4}`).join(' ')
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14"><polyline fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" points={pts} /></svg>
}

const PROF_LABEL: Record<string, string> = { medico: '🩺 Médico', personal: '💪 Personal', nutricionista: '🥗 Nutricionista' }

export default function Painel() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const pParam = params.get('p')
  const [viewId, setViewId] = useState<string | null>(null)
  useEffect(() => {
    if (!user) return
    if (pParam && pParam !== user.id) canViewPatient(user.id, pParam).then((ok) => setViewId(ok ? pParam : user.id)).catch(() => setViewId(user.id))
    else setViewId(user.id)
  }, [user, pParam])
  const now = new Date()

  const [name, setName] = useState('')
  const [weights, setWeights] = useState<WeightRow[]>([])
  const [waterMl, setWaterMl] = useState(0)
  const [waterGoal, setWaterGoal] = useState(3000)
  const [sleep, setSleep] = useState<SleepFull[]>([])
  const [nutri, setNutri] = useState<{ date: string; calories: number; protein: number }[]>([])
  const [fasts, setFasts] = useState<Fast[]>([])
  const [tstats, setTstats] = useState<TrainingStats | null>(null)
  const [month, setMonth] = useState<MonthActivity | null>(null)
  const [supp, setSupp] = useState<{ pct: number } | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [assess, setAssess] = useState<Assessment[]>([])
  const [consults, setConsults] = useState<Consultation[]>([])
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const load = useCallback(() => {
    if (!user || !viewId || !supabaseReady) return
    const d = todayISO()
    getProfileName(viewId).then((n) => setName(n || 'Paciente')).catch(() => {})
    listWeights(viewId).then(setWeights).catch(() => {})
    getWater(viewId, d).then(setWaterMl).catch(() => {})
    getWaterGoal(viewId).then(setWaterGoal).catch(() => {})
    listSleepFull(viewId, 7).then(setSleep).catch(() => {})
    weekNutrition(viewId).then(setNutri).catch(() => {})
    listFasts(viewId).then(setFasts).catch(() => {})
    fetchTrainingStats(viewId).then(setTstats).catch(() => {})
    fetchMonthActivity(viewId, now.getFullYear(), now.getMonth()).then(setMonth).catch(() => {})
    listSupplements(viewId).then((l) => supplementWeekStats(viewId, l.length).then((w) => setSupp({ pct: w.pct }))).catch(() => {})
    listExams(viewId).then(setExams).catch(() => {})
    fetchAssessments(viewId).then(setAssess).catch(() => {})
    listConsultations(viewId).then(setConsults).catch(() => {})
    setUpdatedAt(new Date())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, viewId])

  useEffect(load, [load])

  const lastW = weights.length ? weights[weights.length - 1] : null
  const prevW = weights.length > 1 ? weights[weights.length - 2] : null
  const deltaW = lastW && prevW ? +(lastW.kg - prevW.kg).toFixed(1) : null

  const sleepWithData = sleep.filter((s) => Number(s.hours) > 0)
  const avgSleep = sleepWithData.length ? sleepWithData.reduce((a, s) => a + Number(s.hours), 0) / sleepWithData.length : 0
  const avgKcal = nutri.length ? Math.round(nutri.reduce((a, n) => a + n.calories, 0) / 7) : 0
  const avgProt = nutri.length ? Math.round(nutri.reduce((a, n) => a + n.protein, 0) / 7) : 0
  const fastsDone = fasts.filter((f) => f.end_at)
  const flaggedExams = exams.flatMap((e) => e.results.filter((r) => resultStatus(r) === 'low' || resultStatus(r) === 'high').map((r) => ({ exam: e, r })))
  const lastAssess = assess.length ? assess[assess.length - 1] : null
  const upcoming = consults.filter((c) => c.status === 'agendada' && new Date(c.scheduled_at) >= new Date())

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-28 pt-6">
        {/* header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full flex items-center justify-center bg-white active:scale-95 transition" style={{ border: '1px solid #E4E9F1' }}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={T.text} strokeWidth={2} strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <h1 className="text-[24px] font-bold" style={{ color: T.text }}>🩺 Painel do Profissional</h1>
              {pParam && <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(18,201,138,0.12)", color: "#0E9F6E" }}>acesso vinculado</span>}
            </div>
            <p className="text-[13px] mt-1" style={{ color: T.sub }}>
              Paciente: <b style={{ color: T.text }}>{name}</b>
              {updatedAt && <> · dados de {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>}
            </p>
          </div>
          <button onClick={load} className="px-4 py-2 rounded-2xl text-[13px] font-bold text-white active:scale-95 transition" style={{ background: T.teal }}>↻ Atualizar</button>
        </div>

        {/* métricas principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Metric label="Peso atual" value={lastW ? `${lastW.kg} kg` : '—'} sub={deltaW != null ? `${deltaW > 0 ? '+' : ''}${deltaW} kg vs anterior` : 'sem registro anterior'} color={deltaW != null && deltaW < 0 ? '#0E9F6E' : T.text} />
          <Metric label="Treinos no mês" value={month ? `${month.full + month.partial}` : '—'} sub={month ? `${month.full} completos · ${month.partial} parciais · ${month.missed} faltas` : ''} color="#16C784" />
          <Metric label="Sono médio (7d)" value={avgSleep ? `${avgSleep.toFixed(1)}h` : '—'} sub="meta 8h" color="#6366F1" />
          <Metric label="Calorias médias (7d)" value={avgKcal ? `${avgKcal}` : '—'} sub={avgProt ? `${avgProt}g proteína/dia` : ''} color="#F97316" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <Metric label="Água hoje" value={`${(waterMl / 1000).toFixed(1)}L`} sub={`meta ${(waterGoal / 1000).toFixed(1)}L`} color="#3B82F6" />
          <Metric label="Adesão suplementos" value={supp ? `${supp.pct}%` : '—'} sub="últimos 7 dias" color={supp && supp.pct >= 80 ? '#0E9F6E' : '#D97706'} />
          <Metric label="Jejuns (20 últimos)" value={`${fastsDone.length}`} sub={fastsDone.length ? `mais longo: ${Math.max(...fastsDone.map((f) => (new Date(f.end_at!).getTime() - new Date(f.start_at).getTime()) / 3600000)).toFixed(0)}h` : ''} color="#A855F7" />
          <Metric label="Volume 30 dias" value={tstats ? `${(tstats.volumeTotal / 1000).toFixed(1)}t` : '—'} sub={tstats ? `${tstats.sessions} sessões` : ''} color="#0F172A" />
        </div>

        {/* gráficos + alertas */}
        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <div style={card} className="p-4">
            <div className="text-[12px] font-bold mb-1" style={{ color: T.text }}>⚖️ Evolução do peso</div>
            <MiniLine data={weights.map((w) => w.kg)} />
          </div>
          <div style={card} className="p-4">
            <div className="text-[12px] font-bold mb-1" style={{ color: T.text }}>🍽️ Calorias — 7 dias</div>
            <MiniLine data={nutri.map((n) => n.calories)} color="#F97316" />
          </div>
          <div style={card} className="p-4">
            <div className="text-[12px] font-bold mb-1" style={{ color: T.text }}>🌙 Sono — 7 dias</div>
            <MiniLine data={[...sleep].reverse().map((s) => Number(s.hours))} color="#6366F1" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mt-3">
          {/* exames com alerta */}
          <div style={card} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-bold" style={{ color: T.text }}>🧪 Exames — atenção</span>
              <button onClick={() => nav('/exames')} className="text-[11px] font-semibold" style={{ color: T.teal }}>ver todos ›</button>
            </div>
            {flaggedExams.length === 0 ? (
              <p className="text-[12px]" style={{ color: T.sub }}>{exams.length === 0 ? 'Nenhum exame registrado.' : '✅ Todos os marcadores dentro da referência.'}</p>
            ) : flaggedExams.slice(0, 6).map(({ exam, r }, i) => {
              const st = resultStatus(r)
              return (
                <div key={i} className="flex items-center justify-between py-1.5" style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
                  <div>
                    <div className="text-[12px] font-semibold" style={{ color: T.text }}>{r.marker}</div>
                    <div className="text-[10px]" style={{ color: T.sub }}>{exam.title} · {new Date(exam.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: st === 'high' ? '#DC2626' : '#B45309' }}>
                    {r.value} {r.unit || ''} {st === 'high' ? '↑' : '↓'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* medidas + consultas */}
          <div className="space-y-3">
            <div style={card} className="p-4">
              <div className="text-[13px] font-bold mb-2" style={{ color: T.text }}>📏 Última avaliação física</div>
              {!lastAssess ? <p className="text-[12px]" style={{ color: T.sub }}>Nenhuma avaliação registrada.</p> : (
                <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[12px]">
                  <div style={{ color: T.sub }}>Data <b style={{ color: T.text }}>{new Date(lastAssess.date + 'T12:00:00').toLocaleDateString('pt-BR')}</b></div>
                  {lastAssess.body_fat != null && <div style={{ color: T.sub }}>Gordura <b style={{ color: T.text }}>{lastAssess.body_fat}%</b></div>}
                  {lastAssess.waist != null && <div style={{ color: T.sub }}>Cintura <b style={{ color: T.text }}>{lastAssess.waist}cm</b></div>}
                  {lastAssess.chest != null && <div style={{ color: T.sub }}>Peito <b style={{ color: T.text }}>{lastAssess.chest}cm</b></div>}
                  {lastAssess.arm != null && <div style={{ color: T.sub }}>Braço <b style={{ color: T.text }}>{lastAssess.arm}cm</b></div>}
                  {lastAssess.thigh != null && <div style={{ color: T.sub }}>Coxa <b style={{ color: T.text }}>{lastAssess.thigh}cm</b></div>}
                </div>
              )}
            </div>
            <div style={card} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold" style={{ color: T.text }}>📅 Próximas consultas</span>
                <button onClick={() => nav('/consultas')} className="text-[11px] font-semibold" style={{ color: T.teal }}>agendar ›</button>
              </div>
              {upcoming.length === 0 ? <p className="text-[12px]" style={{ color: T.sub }}>Nenhuma consulta agendada.</p> : upcoming.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-1.5 text-[12px]">
                  <span style={{ color: T.text }}>{PROF_LABEL[c.professional_type]}</span>
                  <span style={{ color: T.sub }}>{new Date(c.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* chat lado profissional */}
        <div className="grid md:grid-cols-2 gap-3 mt-3 items-start">
          <div>
            <p className="text-[12px] font-bold mb-2 px-1" style={{ color: T.text }}>💬 Responder como profissional</p>
            <CareChat as="profissional" userId={viewId ?? undefined} height={420} />
          </div>
          <div style={{ ...card, background: '#0F172A', border: 'none' }} className="p-5 text-white">
            <div className="text-[14px] font-bold">ℹ️ Sobre este painel</div>
            <p className="text-[12px] mt-2 leading-relaxed" style={{ color: '#CBD5E1' }}>
              Visão consolidada e em tempo real de tudo que o paciente registra no app: peso, treinos, nutrição, água, sono, jejum, suplementos, exames e avaliações.
              Abra este endereço no computador para a melhor experiência.
            </p>
            <p className="text-[12px] mt-2 leading-relaxed" style={{ color: '#94A3B8' }}>
              O chat ao lado envia como <b style={{ color: '#5EEAD4' }}>profissional</b> — o paciente vê a mensagem na hora, no app dele (menu + → Consultas).
              Login separado para o profissional com múltiplos pacientes é a próxima etapa.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
