import { useEffect, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchAssessments, saveAssessment, type Assessment } from '../../lib/muscExtra'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784', border: '#EDF2F7' }
const card = { background: '#fff', borderRadius: 20, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }
const fields: [keyof Assessment, string][] = [['weight', 'Peso (kg)'], ['body_fat', 'Gordura (%)'], ['chest', 'Peito (cm)'], ['waist', 'Cintura (cm)'], ['arm', 'Braço (cm)'], ['thigh', 'Coxa (cm)']]

function WeightChart({ data }: { data: { date: string; weight?: number }[] }) {
  const pts = data.filter((d) => d.weight).map((d) => d.weight as number)
  if (pts.length < 2) return <div className="text-[12px] text-center py-6" style={{ color: T.sub }}>Registre ao menos 2 avaliações pra ver o gráfico.</div>
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1
  const w = 300, h = 90
  const path = pts.map((p, i) => `${(i / (pts.length - 1)) * w},${h - ((p - min) / range) * h}`).join(' ')
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24"><polyline fill="none" stroke={T.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" points={path} /></svg>
}

export default function Avaliacoes() {
  const { user } = useAuth()
  const [list, setList] = useState<Assessment[]>([])
  const [form, setForm] = useState<Assessment>({ date: new Date().toISOString().slice(0, 10) })
  const [msg, setMsg] = useState('')
  const load = () => { if (user && supabaseReady) fetchAssessments(user.id).then(setList).catch(() => {}) }
  useEffect(load, [user])
  const save = async () => {
    if (!user) return
    try { await saveAssessment(user.id, form); setForm({ date: new Date().toISOString().slice(0, 10) }); setMsg('Avaliação salva!'); setTimeout(() => setMsg(''), 1500); load() }
    catch (e: any) { setMsg('Erro: rodou o musc_extra_schema.sql?') }
  }
  const latest = list[list.length - 1]
  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-[440px] mx-auto px-4 pb-24">
        <ScreenHeader title="Avaliações" />
        <div style={card} className="p-5 mb-3">
          <div className="text-[12px]" style={{ color: T.sub }}>Peso atual</div>
          <div className="text-[28px] font-bold" style={{ color: T.text }}>{latest?.weight ?? '—'} <span className="text-[14px]" style={{ color: T.sub }}>kg</span></div>
          <WeightChart data={list} />
        </div>
        <div style={card} className="p-5 mb-3">
          <div className="font-semibold mb-3" style={{ color: T.text }}>Nova avaliação</div>
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
        {list.length > 0 && (
          <div style={card} className="p-4">
            <div className="font-semibold mb-2 text-[14px]" style={{ color: T.text }}>Histórico</div>
            {[...list].reverse().map((a) => (
              <div key={a.id} className="flex justify-between py-2 border-t first:border-t-0 text-[13px]" style={{ borderColor: T.border }}>
                <span style={{ color: T.sub }}>{new Date(a.date).toLocaleDateString('pt-BR')}</span>
                <span style={{ color: T.text }}>{a.weight ? `${a.weight}kg` : ''} {a.waist ? `· cintura ${a.waist}` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
