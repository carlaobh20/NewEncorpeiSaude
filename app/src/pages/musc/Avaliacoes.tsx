import { useEffect, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchAssessments, saveAssessment, type Assessment } from '../../lib/muscExtra'
import { listWeights, saveWeight, type WeightRow } from '../../lib/db'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784', border: '#EDF2F7' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

type NumKey = Exclude<keyof Assessment, 'id' | 'date' | 'notes'>

const SECTIONS: { title: string; emoji: string; fields: [NumKey, string][] }[] = [
  { title: 'Composição', emoji: '📊', fields: [['body_fat', 'Gordura (%)']] },
  { title: 'Tronco', emoji: '🫁', fields: [['neck', 'Pescoço'], ['shoulders', 'Ombros'], ['chest', 'Peito'], ['waist', 'Cintura'], ['abdomen', 'Abdômen'], ['hip', 'Quadril']] },
  { title: 'Braços', emoji: '💪', fields: [['arm', 'Braço D'], ['arm_l', 'Braço E'], ['forearm_r', 'Antebraço D'], ['forearm_l', 'Antebraço E']] },
  { title: 'Pernas', emoji: '🦵', fields: [['thigh', 'Coxa D'], ['thigh_l', 'Coxa E'], ['calf_r', 'Panturrilha D'], ['calf_l', 'Panturrilha E']] },
]
const ALL_FIELDS: [NumKey, string][] = SECTIONS.flatMap((s) => s.fields)
const LABEL: Record<string, string> = Object.fromEntries(ALL_FIELDS)

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
  const [notes, setNotes] = useState('')
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [expandId, setExpandId] = useState<string | null>(null)

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
      const hasMeasure = ALL_FIELDS.some(([k]) => form[k] != null) || notes.trim()
      if (hasMeasure) await saveAssessment(user.id, { ...form, notes: notes.trim() || undefined, weight: undefined })
      setWeight(''); setNotes(''); setForm({ date: new Date().toISOString().slice(0, 10) }); setOpen(false)
      setMsg('Avaliação salva!'); setTimeout(() => setMsg(''), 1500); load()
    } catch { setMsg('Erro ao salvar avaliação'); setTimeout(() => setMsg(''), 2000) }
  }

  const latest = weights.length ? weights[weights.length - 1].kg : null
  const prevOf = (a: Assessment, k: NumKey): number | undefined => {
    const idx = measures.findIndex((m) => m.id === a.id)
    for (let i = idx - 1; i >= 0; i--) { const v = measures[i][k]; if (v != null) return v as number }
    return undefined
  }

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div className="max-w-[440px] md:max-w-2xl mx-auto px-4 pb-24">
        <ScreenHeader title="Avaliações" />

        <div style={card} className="p-5 mb-3">
          <div className="text-[12px]" style={{ color: T.sub }}>Peso atual</div>
          <div className="text-[28px] font-bold" style={{ color: T.text }}>{latest ?? '—'} <span className="text-[14px]" style={{ color: T.sub }}>kg</span></div>
          <WeightChart data={weights.map((w) => w.kg)} />
        </div>

        {!open ? (
          <button onClick={() => setOpen(true)} className="w-full py-3.5 rounded-2xl font-bold text-white text-[15px] mb-3 active:scale-[0.99] transition" style={{ background: T.green, boxShadow: '0 10px 24px -6px rgba(22,199,132,0.5)' }}>
            + Nova avaliação completa
          </button>
        ) : (
          <div style={card} className="p-5 mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold" style={{ color: T.text }}>Nova avaliação</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-white border rounded-xl px-2 py-1 text-[12px] outline-none" style={{ borderColor: T.border, color: T.text }} />
            </div>

            <div className="mb-3">
              <div className="text-[11px] mb-1 font-semibold" style={{ color: T.sub }}>⚖️ Peso (kg)</div>
              <input value={weight} inputMode="decimal" onChange={(e) => setWeight(e.target.value)} placeholder="ex: 108.5"
                className="w-full bg-white border rounded-xl px-3 py-2 outline-none focus:border-emerald-400" style={{ borderColor: T.border, color: T.text }} />
            </div>

            {SECTIONS.map((sec) => (
              <div key={sec.title} className="mb-3">
                <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: T.sub }}>{sec.emoji} {sec.title} {sec.title !== 'Composição' && <span className="font-normal normal-case">(cm)</span>}</div>
                <div className="grid grid-cols-2 gap-2">
                  {sec.fields.map(([k, label]) => (
                    <div key={k}>
                      <div className="text-[10px] mb-0.5" style={{ color: '#94A3B8' }}>{label}</div>
                      <input value={(form[k] as number) ?? ''} inputMode="decimal" placeholder="—"
                        onChange={(e) => setForm({ ...form, [k]: parseFloat(e.target.value.replace(',', '.')) || undefined })}
                        className="w-full bg-white border rounded-xl px-3 py-2 outline-none focus:border-emerald-400" style={{ borderColor: T.border, color: T.text }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mb-3">
              <div className="text-[11px] mb-1 font-semibold" style={{ color: T.sub }}>📝 Observações</div>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ex: medido em jejum, pós-treino…"
                className="w-full bg-white border rounded-xl px-3 py-2 outline-none focus:border-emerald-400" style={{ borderColor: T.border, color: T.text }} />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-[13px]" style={{ background: '#F1F5F9', color: T.sub }}>Cancelar</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl font-bold text-white text-[13px]" style={{ background: T.green }}>Salvar avaliação</button>
            </div>
          </div>
        )}
        {msg && <div className="text-[12px] mb-3 text-center font-semibold" style={{ color: T.green }}>{msg}</div>}

        {measures.length > 0 && (
          <div style={card} className="p-4">
            <div className="font-semibold mb-2 text-[14px]" style={{ color: T.text }}>Histórico de medidas</div>
            {[...measures].reverse().map((a) => {
              const filled = ALL_FIELDS.filter(([k]) => a[k] != null)
              const expanded = expandId === a.id
              return (
                <div key={a.id} className="py-2 border-t first:border-t-0" style={{ borderColor: T.border }}>
                  <button onClick={() => setExpandId(expanded ? null : (a.id ?? null))} className="w-full flex justify-between items-center text-left">
                    <span className="text-[13px]" style={{ color: T.sub }}>{new Date(a.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    <span className="text-[12px] font-semibold" style={{ color: T.green }}>{filled.length} medida{filled.length !== 1 ? 's' : ''} {expanded ? '▴' : '▾'}</span>
                  </button>
                  {expanded && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      {filled.map(([k]) => {
                        const v = a[k] as number
                        const prev = prevOf(a, k)
                        const delta = prev != null ? +(v - prev).toFixed(1) : null
                        return (
                          <div key={k} className="flex justify-between text-[12px]">
                            <span style={{ color: T.sub }}>{LABEL[k]}</span>
                            <span style={{ color: T.text }}>
                              <b>{v}</b>{k === 'body_fat' ? '%' : 'cm'}
                              {delta != null && delta !== 0 && <span className="ml-1" style={{ color: delta < 0 ? '#0E9F6E' : '#D97706' }}>{delta > 0 ? '+' : ''}{delta}</span>}
                            </span>
                          </div>
                        )
                      })}
                      {a.notes && <div className="col-span-2 text-[11px] mt-1" style={{ color: '#94A3B8' }}>📝 {a.notes}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
