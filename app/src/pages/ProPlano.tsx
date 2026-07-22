import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listMyPatients, type LinkedPatient } from '../lib/careLinks'
import {
  ensurePlan, listPlanItems, addPlanItem, removePlanItem,
  listRules, addRule, deactivateRule,
  PLAN_ITEMS, FREQ_LABEL, METRICS, CARDIO_PRESET, symptomLabel, SYMPTOMS,
  type Plan, type PlanItem, type AlertRule,
} from '../lib/monitoring'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }
const input: React.CSSProperties = { border: '1px solid #E4E9F1', borderRadius: 12, padding: '8px 10px', fontSize: 13, color: T.text, background: '#fff' }
const sevStyle = (s: string) => s === 'vermelho'
  ? { color: '#DC2626', bg: 'rgba(220,38,38,0.10)', label: 'Vermelho' }
  : { color: '#D97706', bg: 'rgba(217,119,6,0.12)', label: 'Amarelo' }

export default function ProPlano() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const patientId = params.get('p')

  const [patients, setPatients] = useState<LinkedPatient[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [items, setItems] = useState<PlanItem[]>([])
  const [rules, setRules] = useState<AlertRule[]>([])
  const [busy, setBusy] = useState(false)

  const [newItem, setNewItem] = useState('peso')
  const [newFreq, setNewFreq] = useState('diario')

  const [rMetric, setRMetric] = useState('pa_sistolica')
  const [rSymptom, setRSymptom] = useState('dor_no_peito')
  const [rOp, setROp] = useState<'>' | '<' | '>=' | '<='>('>=')
  const [rThreshold, setRThreshold] = useState('')
  const [rSev, setRSev] = useState<'amarelo' | 'vermelho'>('vermelho')

  useEffect(() => {
    if (!user || !supabaseReady) return
    listMyPatients(user.id).then(setPatients).catch(() => setPatients([]))
  }, [user])

  const loadPatient = useCallback(async () => {
    if (!user || !patientId || !supabaseReady) return
    const p = await ensurePlan(user.id, patientId)
    setPlan(p)
    setItems(await listPlanItems(p.id))
    setRules(await listRules(user.id, patientId))
  }, [user, patientId])
  useEffect(() => { loadPatient().catch(() => {}) }, [loadPatient])

  async function doAddItem() {
    if (!plan || busy) return
    setBusy(true)
    try { await addPlanItem(plan.id, newItem, newFreq); await loadPatient() } finally { setBusy(false) }
  }
  async function doAddRule() {
    if (!user || !patientId || busy) return
    const t = Number(rThreshold.replace(',', '.'))
    if (!Number.isFinite(t)) return
    setBusy(true)
    try {
      await addRule({ patient_id: patientId, professional_id: user.id, metric: rMetric, symptom: rMetric === 'sintoma' ? rSymptom : null, operator: rOp, threshold: t, severity: rSev })
      setRThreshold('')
      await loadPatient()
    } finally { setBusy(false) }
  }
  async function applyPreset() {
    if (!user || !patientId || busy) return
    setBusy(true)
    try {
      for (const r of CARDIO_PRESET) {
        const dup = rules.some((x) => x.metric === r.metric && x.operator === r.operator && Number(x.threshold) === r.threshold)
        if (!dup) await addRule({ patient_id: patientId, professional_id: user.id, ...r })
      }
      await loadPatient()
    } finally { setBusy(false) }
  }

  if (!patientId) {
    return (
      <div className="max-w-md mx-auto px-4 pb-28">
        <ScreenHeader title="Plano de monitoramento" />
        <div className="mt-2 space-y-3">
          <p className="text-[12px]" style={{ color: T.sub }}>Escolha o paciente para montar o plano e as regras de alerta.</p>
          {patients.length === 0 && (
            <div style={card} className="p-5 text-center text-[12px]">
              <span style={{ color: T.sub }}>Você ainda não tem pacientes vinculados. Peça ao paciente para gerar um convite no app.</span>
            </div>
          )}
          {patients.map((p) => (
            <button key={p.patient_id} onClick={() => setParams({ p: p.patient_id })}
              style={card} className="w-full p-4 text-left flex items-center justify-between transition active:scale-[0.99]">
              <span className="text-[14px] font-medium" style={{ color: T.text }}>{p.name}</span>
              <span style={{ color: T.teal }}>›</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const patientName = patients.find((p) => p.patient_id === patientId)?.name || 'Paciente'

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title={`Plano — ${patientName}`} />
      <div className="space-y-4 mt-2">

        <div style={card} className="p-4">
          <div className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>O que o paciente deve registrar</div>
          <p className="text-[11px] mb-3" style={{ color: T.sub }}>
            Itens que exigem aparelho (pressão, glicemia) só aparecem para o paciente depois que ele confirmar que tem o aparelho e sabe usar.
          </p>
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between py-2.5" style={{ borderTop: '1px solid #F1F5F9' }}>
              <div>
                <div className="text-[13px] font-medium" style={{ color: T.text }}>{PLAN_ITEMS[i.item]?.label || i.item}</div>
                <div className="text-[11px]" style={{ color: T.sub }}>{FREQ_LABEL[i.frequency] || i.frequency}{i.requires_device ? ' · exige aparelho' : ''}</div>
              </div>
              <button onClick={() => removePlanItem(i.id).then(loadPatient)} className="text-[11px] px-2 py-1 rounded-full hover:bg-slate-100" style={{ color: T.sub }}>✕</button>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <select value={newItem} onChange={(e) => setNewItem(e.target.value)} style={input} className="flex-1">
              {Object.entries(PLAN_ITEMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={newFreq} onChange={(e) => setNewFreq(e.target.value)} style={input}>
              {Object.entries(FREQ_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button onClick={doAddItem} disabled={busy}
              className="rounded-xl px-3 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-50" style={{ background: T.teal }}>+</button>
          </div>
        </div>

        <div style={card} className="p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[13px] font-semibold" style={{ color: T.text }}>Regras de alerta</div>
            <button onClick={applyPreset} disabled={busy}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full active:scale-95 disabled:opacity-50"
              style={{ background: 'rgba(18,201,166,0.10)', color: '#0E9F6E' }}>
              + Modelo cardiológico
            </button>
          </div>
          <p className="text-[11px] mb-3" style={{ color: T.sub }}>
            Você define as faixas; o app apenas compara os registros do paciente com elas e te avisa. A avaliação clínica é sua. Os valores do modelo são ponto de partida — revise cada um.
          </p>
          {rules.map((r) => {
            const sv = sevStyle(r.severity)
            return (
              <div key={r.id} className="flex items-center justify-between py-2.5" style={{ borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: T.text }}>
                    {r.metric === 'sintoma' ? `${symptomLabel(r.symptom || '')}` : METRICS[r.metric] || r.metric} {r.operator} {r.threshold}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: sv.color, background: sv.bg }}>{sv.label}</span>
                </div>
                <button onClick={() => user && deactivateRule(user.id, r.id).then(loadPatient)}
                  className="text-[11px] px-2 py-1 rounded-full hover:bg-slate-100" style={{ color: T.sub }}>✕</button>
              </div>
            )
          })}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <select value={rMetric} onChange={(e) => setRMetric(e.target.value)} style={input} className="col-span-2">
              {Object.entries(METRICS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {rMetric === 'sintoma' && (
              <select value={rSymptom} onChange={(e) => setRSymptom(e.target.value)} style={input} className="col-span-2">
                {SYMPTOMS.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
              </select>
            )}
            <select value={rOp} onChange={(e) => setROp(e.target.value as typeof rOp)} style={input}>
              <option value=">=">maior ou igual a</option>
              <option value=">">maior que</option>
              <option value="<=">menor ou igual a</option>
              <option value="<">menor que</option>
            </select>
            <input value={rThreshold} onChange={(e) => setRThreshold(e.target.value)} placeholder="valor" inputMode="decimal" style={input} />
            <select value={rSev} onChange={(e) => setRSev(e.target.value as 'amarelo' | 'vermelho')} style={input}>
              <option value="vermelho">🔴 Vermelho</option>
              <option value="amarelo">🟡 Amarelo</option>
            </select>
            <button onClick={doAddRule} disabled={busy || !rThreshold}
              className="rounded-xl py-2 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-50" style={{ background: T.teal }}>
              Adicionar regra
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
