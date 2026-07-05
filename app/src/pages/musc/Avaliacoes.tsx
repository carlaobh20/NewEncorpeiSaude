import { useEffect, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchAssessments, saveAssessment, type Assessment } from '../../lib/muscExtra'
import { listWeights, saveWeight, type WeightRow } from '../../lib/db'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784', border: '#EDF2F7' }
const card = { background: '#fff', borderRadius: 20, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }
// peso vem da tabela weights (fonte única); aqui só medidas corporais
const fields: [keyof Assessment, string][] = [['body_fat', 'Gordura (%)'], ['chest', 'Peito (cm)'], ['waist', 'Cintura (cm)'], ['hip', 'Quadril (cm)'], ['arm', 'Braço (cm)'], ['thigh', 'Coxa (cm)']]

function WeightChart({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="text-[12px] text-center py-6" style={{ color: T.sub }}>Registre ao menos 2 pesos pra ver o gráfico.</div>
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const w = 300, h = 90
  const path = data.map((p, i) => `${(i / (data.length - 1)) * w},${h - ((p - min) / range) * h}`).join(' ')
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24"><polyline fill="none" stroke={T.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" points={path} /></svg>
}

export default function Avaliacoes() {
  const { user } = useAuth()
  const [measures, setMeasures] = useState<Assessment[]>([])
  const [weights, setWeights] = useState<WeightRow[]>([])
  const [weight, setWeight] = useState('')
  const [form, setForm] = useState<Assessment>({ date: new Date().toISOString().slice(0, 10) })
  const [msg, setMsg] = useState('')

  const load = () => {
    if (!user || !supabaseReady) return
    fetchAssessments(user.id).then(setMeasures).catch(() => {})
    listWeights(user.id).then(setWeights).catch(() => {})
  }
  useEffect(load, [user])

  const save = async () => {
    if (!user) return
    try {
      const w = parseFloat(weight.replace(',', '.'))
      if (w > 0) await saveWeight(user.id, form.date, +w.toFixed(1))
      const hasMeasure = fields.some(([k]) => form[k] != null)
      if (hasMeasure) await saveAssessment(user.id, { ...form, weight: undefined })
      setWeight(''); setForm({ date: new Date().toISOString().slice(0, 10) })
      setMsg('Avaliação salva!'); setTimeout(() => setMsg(''), 1500); load()
    } catch { setMsg('Erro: rodou o musc_extra_schema.sql?') }
  }

  const latest = weights.length ? weights[weights.length - 1].kg : null
  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-[440px] mx-auto px-4 pb-24">
        <ScreenHeader title="Avaliações" />
        <div style={card} className="p-5 mb-3">
          <div className="text-[12px]" style={{ color: T.sub }}>Peso atual</div>
          <div className="text-[28px] font-bold" style={{ color: T.text }}>{latest ?? '—'} <span className="text-[14px]" style={{ color: T.sub }}>kg</span></div>
          <WeightChart data={weights.map((w) => w.kg)} />
        </div>
        <div style={card} className="p-5 mb-3">
          <div className="font-semibold mb-3" style={{ color: T.text }}>Nova avaliação</div>
          <div className="mb-2">
            <div className="text-[11px] mb-1" style={{ color: T.sub }}>Peso (kg)</div>
            <input value={weight} inputMode="decimal" onChange={(e) => setWeight(e.target.value)} placeholder="ex: 108.5"
              className="w-full bg-white border rounded-xl px-3 py-2 outline-none focus:border-emerald-400" style={{ borderColor: T.border }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {fields.map(([k, label]) => (
              <div key={k}>
                <div className="text-[11px] mb-1" style={{ color: T.sub }}>{label}</div>
                <input value={(form[k] as number) ?? ''} inputMode="decimal" onChange={(e) => setForm({ ...form, [k]: parseFloat(e.target.value) || undefined })}
                  className="w-full bg-white border rounded-xl px-3 py-2 outline-none focus:border-emerald-400" style={{ borderColor: T.border }} />
              </div>
            ))}
          </div>
          <button onClick={save} className="w-full mt-3 py-2.5 rounded-xl font-semibold text-white" style={{ background: T.green }}>Salvar avaliação</button>
          {msg && <div className="text-[12px] mt-2 text-center" style={{ color: T.green }}>{msg}</div>}
        </div>
        {measures.length > 0 && (
          <div style={card} className="p-4">
            <div className="font-semibold mb-2 text-[14px]" style={{ color: T.text }}>Medidas registradas</div>
            {[...measures].reverse().map((a) => (
              <div key={a.id} className="flex justify-between py-2 border-t first:border-t-0 text-[13px]" style={{ borderColor: T.border }}>
                <span style={{ color: T.sub }}>{new Date(a.date).toLocaleDateString('pt-BR')}</span>
                <span style={{ color: T.text }}>{a.waist ? `cintura ${a.waist}cm` : ''} {a.arm ? `· braço ${a.arm}cm` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
