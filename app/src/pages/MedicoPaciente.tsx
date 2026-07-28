import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabase, supabaseReady } from '../lib/supabase'
import { canViewPatient, listMyPatients } from '../lib/careLinks'
import { listBP, listGlucose, bpClass, glucoseClass, type BPRecord, type GlucoseRecord } from '../lib/vitals'
import { listExams, resultStatus, listConsultations, type Exam, type Consultation } from '../lib/care'
import {
  listSymptoms, symptomLabel, myPlanItems, listDevices, setAlertStatus, subscribeProfessionalAlerts, alertLabel,
  PLAN_ITEMS, FREQ_LABEL, type PlanItem, type Alert, type SymptomLog,
} from '../lib/monitoring'
import {
  listPatientMedications, addMedicationForPatient, medicationWeekStats, medicationsTakenToday, type Medication,
} from '../lib/health'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }
const SEV = {
  vermelho: { color: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
  amarelo: { color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
} as const

type WeightRow = { date: string; kg: number }

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={card} className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[13px] font-semibold" style={{ color: T.text }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function MedicoPaciente() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const pid = params.get('p')

  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [name, setName] = useState('Paciente')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [bp, setBP] = useState<BPRecord[]>([])
  const [glu, setGlu] = useState<GlucoseRecord[]>([])
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([])
  const [weights, setWeights] = useState<WeightRow[]>([])
  const [plan, setPlan] = useState<PlanItem[]>([])
  const [devices, setDevices] = useState<string[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [consults, setConsults] = useState<Consultation[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [meds, setMeds] = useState<Medication[]>([])
  const [medsToday, setMedsToday] = useState<Set<string>>(new Set())
  const [medsWeek, setMedsWeek] = useState<{ pct: number; takenCount: number } | null>(null)
  const [medForm, setMedForm] = useState({ name: '', dose: '' })
  const [medOpen, setMedOpen] = useState(false)
  const [medBusy, setMedBusy] = useState(false)

  const load = useCallback(async () => {
    if (!user || !pid || !supabaseReady) return
    const ok = await canViewPatient(user.id, pid)
    setAllowed(ok)
    if (!ok) return
    listMyPatients(user.id).then((ps) => setName(ps.find((x) => x.patient_id === pid)?.name || 'Paciente')).catch(() => {})
    const { data: al } = await supabase.from('alerts').select('*').eq('patient_id', pid).eq('professional_id', user.id)
      .order('created_at', { ascending: false }).limit(50)
    setAlerts((al as Alert[]) || [])
    listBP(pid, 14).then(setBP).catch(() => setBP([]))
    listGlucose(pid, 14).then(setGlu).catch(() => setGlu([]))
    listSymptoms(pid, 20).then(setSymptoms).catch(() => setSymptoms([]))
    supabase.from('weights').select('date,kg').eq('user_id', pid).order('date', { ascending: false }).limit(30)
      .then(({ data }) => setWeights((data as WeightRow[]) || []))
    myPlanItems(pid).then(setPlan).catch(() => setPlan([]))
    listDevices(pid).then(setDevices).catch(() => setDevices([]))
    listExams(pid).then(setExams).catch(() => setExams([]))
    listConsultations(pid).then(setConsults).catch(() => setConsults([]))
    listPatientMedications(pid).then((ms) => {
      setMeds(ms)
      const ids = ms.map((m) => m.id)
      medicationsTakenToday(pid, ids).then(setMedsToday).catch(() => setMedsToday(new Set()))
      medicationWeekStats(pid, ids).then(setMedsWeek).catch(() => setMedsWeek(null))
    }).catch(() => setMeds([]))
  }, [user, pid])
  useEffect(() => { load() }, [load])

  async function prescreverMedicamento() {
    if (!pid || !medForm.name.trim() || medBusy) return
    setMedBusy(true)
    try {
      await addMedicationForPatient(pid, { name: medForm.name.trim(), dose: medForm.dose || undefined })
      setMedForm({ name: '', dose: '' }); setMedOpen(false); await load()
    } finally { setMedBusy(false) }
  }

  useEffect(() => {
    if (!user || !supabaseReady) return
    return subscribeProfessionalAlerts(user.id, load)
  }, [user, load])

  async function act(a: Alert, status: 'visto' | 'tratado') {
    if (!user || busy) return
    setBusy(a.id)
    try { await setAlertStatus(user.id, a.id, status); await load() } finally { setBusy(null) }
  }

  /* adesão: houve registro do item nos últimos 7 dias? */
  const since = new Date(Date.now() - 7 * 864e5)
  const did: Record<string, boolean> = {
    peso: weights.some((w) => new Date(w.date) >= since),
    pressao: bp.some((r) => new Date(r.recorded_at) >= since),
    glicemia: glu.some((r) => new Date(r.recorded_at) >= since),
    sintomas: symptoms.some((s) => new Date(s.recorded_at) >= since),
  }

  const kg72h = (() => {
    if (weights.length < 2) return null
    const latest = weights[0]
    const ref = weights.filter((w) => {
      const d = (new Date(latest.date).getTime() - new Date(w.date).getTime()) / 864e5
      return d > 0 && d <= 3
    })
    if (!ref.length) return null
    return +(latest.kg - Math.min(...ref.map((w) => w.kg))).toFixed(1)
  })()

  if (!pid) return <div className="max-w-md mx-auto px-4 pt-6 text-[13px]" style={{ color: T.sub }}>Paciente não informado.</div>
  if (allowed === false) return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div style={card} className="p-5 text-center text-[13px]">
        <span style={{ color: T.sub }}>Você não tem vínculo ativo com este paciente. Peça um convite no app dele.</span>
      </div>
    </div>
  )

  const open = alerts.filter((a) => a.status !== 'tratado')

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title={name} />
      <div className="space-y-4 mt-2">

        <div className="flex gap-2">
          <button onClick={() => nav(`/painel?p=${pid}`)} className="flex-1 rounded-xl py-2 text-[12px] font-semibold active:scale-95"
            style={{ background: '#F1F5F9', color: T.text }}>Painel completo</button>
          <button onClick={() => nav(`/pro/plano?p=${pid}`)} className="flex-1 rounded-xl py-2 text-[12px] font-semibold active:scale-95"
            style={{ background: '#F1F5F9', color: T.text }}>Plano e regras</button>
        </div>

        <Section title={`Alertas (${open.length} em aberto)`}>
          {alerts.length === 0 && <p className="text-[12px]" style={{ color: T.sub }}>Nenhum alerta. Defina regras em “Plano e regras”.</p>}
          {alerts.slice(0, 8).map((a) => {
            const sv = SEV[a.severity]
            return (
              <div key={a.id} className="py-2.5" style={{ borderTop: '1px solid #F1F5F9' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: sv.color, background: sv.bg }}>
                    {a.severity.toUpperCase()}{a.status !== 'aberto' ? ` · ${a.status}` : ''}
                  </span>
                  <span className="text-[11px]" style={{ color: T.sub }}>
                    {new Date(a.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[13px] mt-1" style={{ color: T.text }}>
                  {alertLabel(a)}
                </div>
                {a.status !== 'tratado' && (
                  <div className="flex gap-2 mt-2">
                    {a.status === 'aberto' && (
                      <button onClick={() => act(a, 'visto')} disabled={busy === a.id}
                        className="flex-1 rounded-lg py-1.5 text-[11px] font-semibold active:scale-95 disabled:opacity-50"
                        style={{ background: '#F1F5F9', color: T.text }}>Visto</button>
                    )}
                    <button onClick={() => act(a, 'tratado')} disabled={busy === a.id}
                      className="flex-1 rounded-lg py-1.5 text-[11px] font-semibold text-white active:scale-95 disabled:opacity-50"
                      style={{ background: T.teal }}>Tratado</button>
                  </div>
                )}
              </div>
            )
          })}
        </Section>

        <Section title="Vitais mais recentes">
          {bp[0] ? (() => { const c = bpClass(bp[0].systolic, bp[0].diastolic); return (
            <div className="flex items-center justify-between py-1.5">
              <div>
                <div className="text-[13px] font-medium" style={{ color: T.text }}>Pressão {bp[0].systolic}/{bp[0].diastolic}{bp[0].pulse ? ` · ${bp[0].pulse} bpm` : ''}</div>
                <div className="text-[11px]" style={{ color: T.sub }}>{new Date(bp[0].recorded_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: c.color, background: c.bg }}>{c.label}</span>
            </div>
          ) })() : <p className="text-[12px]" style={{ color: T.sub }}>Sem registro de pressão.</p>}
          {glu[0] ? (() => { const c = glucoseClass(glu[0].value_mgdl, glu[0].context); return (
            <div className="flex items-center justify-between py-1.5" style={{ borderTop: '1px solid #F1F5F9' }}>
              <div>
                <div className="text-[13px] font-medium" style={{ color: T.text }}>Glicemia {glu[0].value_mgdl} mg/dL ({glu[0].context})</div>
                <div className="text-[11px]" style={{ color: T.sub }}>{new Date(glu[0].recorded_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: c.color, background: c.bg }}>{c.label}</span>
            </div>
          ) })() : <p className="text-[12px] pt-1" style={{ color: T.sub }}>Sem registro de glicemia.</p>}
          <div className="flex items-center justify-between py-1.5" style={{ borderTop: '1px solid #F1F5F9' }}>
            <div className="text-[13px] font-medium" style={{ color: T.text }}>
              Peso {weights[0] ? `${weights[0].kg} kg` : '—'}
              {kg72h !== null && kg72h >= 2 && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#DC2626', background: 'rgba(220,38,38,0.10)' }}>+{kg72h} kg em 72h</span>}
            </div>
            <span className="text-[11px]" style={{ color: T.sub }}>{weights[0] ? new Date(weights[0].date).toLocaleDateString('pt-BR') : ''}</span>
          </div>
        </Section>

        <Section title="Sintomas relatados">
          {symptoms.length === 0 && <p className="text-[12px]" style={{ color: T.sub }}>Nenhum sintoma registrado.</p>}
          {symptoms.slice(0, 6).map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid #F1F5F9' }}>
              <div className="text-[13px]" style={{ color: T.text }}>{symptomLabel(s.symptom)} <span style={{ color: T.sub }}>· {s.intensity}/10</span></div>
              <span className="text-[11px]" style={{ color: T.sub }}>{new Date(s.recorded_at).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </Section>

        <Section title="Plano prescrito · adesão 7 dias">
          {plan.length === 0 && <p className="text-[12px]" style={{ color: T.sub }}>Nenhum plano ativo para este paciente.</p>}
          {plan.map((i) => {
            const meta = PLAN_ITEMS[i.item]
            const gated = i.requires_device && !devices.includes(i.requires_device)
            const ok = did[i.item]
            return (
              <div key={i.id} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: T.text }}>{meta?.label || i.item}</div>
                  <div className="text-[11px]" style={{ color: T.sub }}>{FREQ_LABEL[i.frequency] || i.frequency}{gated ? ' · aguardando aparelho' : ''}</div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={ok ? { color: '#0E9F6E', background: 'rgba(18,201,138,0.12)' } : { color: gated ? T.sub : '#D97706', background: gated ? '#F1F5F9' : 'rgba(217,119,6,0.12)' }}>
                  {gated ? '—' : ok ? 'Em dia' : 'Sem registro'}
                </span>
              </div>
            )
          })}
        </Section>

        <Section title="Medicamentos" action={
          medsWeek && meds.length > 0 ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: medsWeek.pct >= 80 ? '#0E9F6E' : '#D97706', background: medsWeek.pct >= 80 ? 'rgba(18,201,138,0.12)' : 'rgba(217,119,6,0.12)' }}>
              Adesão 7d: {medsWeek.pct}%
            </span>
          ) : undefined
        }>
          {meds.length === 0 && <p className="text-[12px]" style={{ color: T.sub }}>Nenhum medicamento prescrito ainda.</p>}
          {meds.map((m) => {
            const ok = medsToday.has(m.id)
            return (
              <div key={m.id} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: T.text }}>{m.name}</div>
                  {m.dose && <div className="text-[11px]" style={{ color: T.sub }}>{m.dose}</div>}
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={ok ? { color: '#0E9F6E', background: 'rgba(18,201,138,0.12)' } : { color: T.sub, background: '#F1F5F9' }}>
                  {ok ? 'Tomou hoje' : 'Ainda não hoje'}
                </span>
              </div>
            )
          })}

          {!medOpen ? (
            <button onClick={() => setMedOpen(true)} className="w-full mt-3 py-2.5 rounded-xl text-[12px] font-semibold active:scale-95"
              style={{ background: 'rgba(18,201,166,0.10)', color: '#0E9F6E' }}>
              + Prescrever medicamento
            </button>
          ) : (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
              <input value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} placeholder="Nome (ex: Losartana)"
                className="w-full bg-white border rounded-xl px-3 py-2 mb-2 text-[13px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
              <input value={medForm.dose} onChange={(e) => setMedForm({ ...medForm, dose: e.target.value })} placeholder="Dose (ex: 50mg, 1x ao dia)"
                className="w-full bg-white border rounded-xl px-3 py-2 mb-2 text-[13px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
              <div className="flex gap-2">
                <button onClick={() => setMedOpen(false)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold" style={{ background: '#F1F5F9', color: T.sub }}>Cancelar</button>
                <button onClick={prescreverMedicamento} disabled={medBusy} className="flex-1 py-2 rounded-xl font-bold text-white text-[12px] disabled:opacity-50" style={{ background: T.teal }}>
                  {medBusy ? 'Salvando…' : 'Prescrever'}
                </button>
              </div>
            </div>
          )}
          <p className="text-[10px] mt-2 leading-snug" style={{ color: T.sub }}>
            O paciente marca no app dele quando toma cada dose. Se ele ficar sem marcar por ~48h e o item "Tomar os medicamentos" estiver no plano dele, você recebe um alerta de adesão.
          </p>
        </Section>

        <Section title="Exames" action={
          <button onClick={() => nav(`/painel?p=${pid}`)} className="text-[11px] font-semibold px-2 py-1 rounded-full active:scale-95"
            style={{ background: 'rgba(18,201,166,0.10)', color: '#0E9F6E' }}>Ver todos</button>
        }>
          {exams.length === 0 && <p className="text-[12px]" style={{ color: T.sub }}>Nenhum exame anexado.</p>}
          {exams.slice(0, 4).map((e) => {
            const out = e.results.filter((r) => { const s = resultStatus(r); return s === 'low' || s === 'high' }).length
            return (
              <div key={e.id} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: T.text }}>{e.title}</div>
                  <div className="text-[11px]" style={{ color: T.sub }}>{new Date(e.date).toLocaleDateString('pt-BR')} · {e.category}</div>
                </div>
                {out > 0
                  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#DC2626', background: 'rgba(220,38,38,0.10)' }}>{out} fora da faixa</span>
                  : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#0E9F6E', background: 'rgba(18,201,138,0.12)' }}>OK</span>}
              </div>
            )
          })}
        </Section>

        <Section title="Consultas">
          {consults.length === 0 && <p className="text-[12px]" style={{ color: T.sub }}>Nenhuma consulta registrada.</p>}
          {consults.slice(0, 4).map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid #F1F5F9' }}>
              <div className="text-[13px]" style={{ color: T.text }}>{new Date(c.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
              <span className="text-[11px] font-semibold" style={{ color: c.status === 'realizada' ? '#0E9F6E' : c.status === 'cancelada' ? '#DC2626' : T.sub }}>{c.status}</span>
            </div>
          ))}
        </Section>

        <p className="text-[11px] leading-snug" style={{ color: T.sub }}>
          Dados registrados pelo próprio paciente. Este painel não interpreta resultados nem detecta emergências; a avaliação profissional é sua.
        </p>
      </div>
    </div>
  )
}
