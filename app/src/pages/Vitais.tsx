import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listBP, addBP, deleteBP, bpClass, listGlucose, addGlucose, deleteGlucose, glucoseClass, type BPRecord, type GlucoseRecord } from '../lib/vitals'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

const GCONTEXTS = [
  { k: 'jejum', label: 'Jejum' },
  { k: 'pos_refeicao', label: 'Pós-refeição' },
  { k: 'aleatorio', label: 'Aleatório' },
]

export default function Vitais() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'pressao' | 'glicemia'>('pressao')
  const [bps, setBps] = useState<BPRecord[]>([])
  const [glus, setGlus] = useState<GlucoseRecord[]>([])
  const [bpForm, setBpForm] = useState({ sys: '', dia: '', pulse: '' })
  const [gForm, setGForm] = useState({ value: '', context: 'jejum' })
  const [flash, setFlash] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    if (!user || !supabaseReady) return
    listBP(user.id).then(setBps).catch(() => {})
    listGlucose(user.id).then(setGlus).catch(() => {})
  }
  useEffect(load, [user])

  const saveBP = async () => {
    if (!user || busy) return
    const s = parseInt(bpForm.sys), d = parseInt(bpForm.dia), p = parseInt(bpForm.pulse)
    if (!s || !d || s < 50 || s > 260 || d < 30 || d > 200) { setFlash('Confira os valores'); setTimeout(() => setFlash(''), 1500); return }
    setBusy(true)
    try {
      await addBP(user.id, { systolic: s, diastolic: d, pulse: p || undefined })
      setBpForm({ sys: '', dia: '', pulse: '' }); setFlash('Pressão registrada!'); setTimeout(() => setFlash(''), 1400); load()
    } catch { setFlash('Erro ao salvar'); setTimeout(() => setFlash(''), 2000) } finally { setBusy(false) }
  }

  const saveG = async () => {
    if (!user || busy) return
    const v = parseInt(gForm.value)
    if (!v || v < 20 || v > 800) { setFlash('Confira o valor'); setTimeout(() => setFlash(''), 1500); return }
    setBusy(true)
    try {
      await addGlucose(user.id, { value_mgdl: v, context: gForm.context })
      setGForm({ value: '', context: gForm.context }); setFlash('Glicemia registrada!'); setTimeout(() => setFlash(''), 1400); load()
    } catch { setFlash('Erro ao salvar'); setTimeout(() => setFlash(''), 2000) } finally { setBusy(false) }
  }

  const lastBP = bps[0]
  const lastG = glus[0]

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-32">
        <ScreenHeader title="Vitais" />

        <div className="grid grid-cols-2 gap-2">
          {([['pressao', '🫀 Pressão'], ['glicemia', '🩸 Glicemia']] as ['pressao' | 'glicemia', string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="py-2.5 rounded-2xl text-[13px] font-semibold transition active:scale-95"
              style={tab === k ? { background: '#0F172A', color: '#fff' } : { background: '#fff', border: '1px solid #EDF2F7', color: T.sub }}>{l}</button>
          ))}
        </div>

        {tab === 'pressao' && (
          <>
            {lastBP && (() => { const c = bpClass(lastBP.systolic, lastBP.diastolic); return (
              <div style={card} className="p-5 mt-3 text-center">
                <div className="text-[12px]" style={{ color: T.sub }}>Última medição · {new Date(lastBP.recorded_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-[38px] font-bold tabular-nums mt-1" style={{ color: T.text }}>
                  {lastBP.systolic}<span className="text-[20px]" style={{ color: T.sub }}>/</span>{lastBP.diastolic}
                  <span className="text-[13px] ml-1" style={{ color: T.sub }}>mmHg</span>
                </div>
                {lastBP.pulse && <div className="text-[12px]" style={{ color: T.sub }}>♥ {lastBP.pulse} bpm</div>}
                <span className="inline-block mt-2 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ color: c.color, background: c.bg }}>{c.label}</span>
              </div>
            ) })()}

            <div style={card} className="p-4 mt-3">
              <div className="text-[13px] font-bold mb-2" style={{ color: T.text }}>Nova medição</div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {([['sys', 'Sistólica', '120'], ['dia', 'Diastólica', '80'], ['pulse', 'Pulso (opc)', '70']] as const).map(([k, l, ph]) => (
                  <div key={k}>
                    <div className="text-[10px] mb-0.5 text-center" style={{ color: '#94A3B8' }}>{l}</div>
                    <input type="number" value={bpForm[k]} onChange={(e) => setBpForm({ ...bpForm, [k]: e.target.value })} placeholder={ph}
                      className="w-full bg-white border rounded-xl px-2 py-3 text-[18px] font-bold text-center outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
                  </div>
                ))}
              </div>
              <button onClick={saveBP} disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white text-[14px] disabled:opacity-50" style={{ background: T.teal }}>Registrar pressão</button>
            </div>

            {bps.length > 0 && (
              <div style={card} className="p-2 mt-3">
                {bps.map((r) => {
                  const c = bpClass(r.systolic, r.diastolic)
                  return (
                    <div key={r.id} className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                      <span className="text-[12px]" style={{ color: T.sub }}>{new Date(r.recorded_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[13px] font-bold" style={{ color: T.text }}>{r.systolic}/{r.diastolic}{r.pulse ? <span className="font-normal text-[11px]" style={{ color: T.sub }}> · {r.pulse}bpm</span> : null}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: c.color, background: c.bg }}>{c.label.split(' ')[0]}</span>
                      <button onClick={async () => { if (user) { await deleteBP(user.id, r.id).catch(() => {}); load() } }} className="text-[12px]" style={{ color: '#CBD5E1' }}>✕</button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'glicemia' && (
          <>
            {lastG && (() => { const c = glucoseClass(lastG.value_mgdl, lastG.context); return (
              <div style={card} className="p-5 mt-3 text-center">
                <div className="text-[12px]" style={{ color: T.sub }}>Última medição · {GCONTEXTS.find((g) => g.k === lastG.context)?.label} · {new Date(lastG.recorded_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-[38px] font-bold tabular-nums mt-1" style={{ color: T.text }}>{lastG.value_mgdl}<span className="text-[13px] ml-1" style={{ color: T.sub }}>mg/dL</span></div>
                <span className="inline-block mt-2 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ color: c.color, background: c.bg }}>{c.label}</span>
              </div>
            ) })()}

            <div style={card} className="p-4 mt-3">
              <div className="text-[13px] font-bold mb-2" style={{ color: T.text }}>Nova medição</div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {GCONTEXTS.map((g) => (
                  <button key={g.k} onClick={() => setGForm({ ...gForm, context: g.k })} className="py-2 rounded-xl text-[11px] font-semibold transition"
                    style={gForm.context === g.k ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{g.label}</button>
                ))}
              </div>
              <input type="number" value={gForm.value} onChange={(e) => setGForm({ ...gForm, value: e.target.value })} placeholder="mg/dL (ex: 95)"
                className="w-full bg-white border rounded-xl px-3 py-3 text-[18px] font-bold text-center outline-none focus:border-emerald-400 mb-3" style={{ borderColor: '#EDF2F7', color: T.text }} />
              <button onClick={saveG} disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white text-[14px] disabled:opacity-50" style={{ background: T.teal }}>Registrar glicemia</button>
            </div>

            {glus.length > 0 && (
              <div style={card} className="p-2 mt-3">
                {glus.map((r) => {
                  const c = glucoseClass(r.value_mgdl, r.context)
                  return (
                    <div key={r.id} className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                      <span className="text-[12px]" style={{ color: T.sub }}>{new Date(r.recorded_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {GCONTEXTS.find((g) => g.k === r.context)?.label}</span>
                      <span className="text-[13px] font-bold" style={{ color: T.text }}>{r.value_mgdl}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: c.color, background: c.bg }}>{c.label.split(' ')[0]}</span>
                      <button onClick={async () => { if (user) { await deleteGlucose(user.id, r.id).catch(() => {}); load() } }} className="text-[12px]" style={{ color: '#CBD5E1' }}>✕</button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        <p className="text-[10px] text-center mt-4 px-4" style={{ color: '#94A3B8' }}>Classificações de referência (AHA/ADA) — não substituem avaliação médica. Valores fora do padrão aparecem para seu profissional no painel.</p>

        {flash && <div className="fixed bottom-24 inset-x-0 flex justify-center z-40"><span className="px-4 py-2 rounded-full text-[13px] font-semibold text-white" style={{ background: '#0F172A' }}>{flash}</span></div>}
      </div>
    </div>
  )
}
