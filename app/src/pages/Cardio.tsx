import { useEffect, useMemo, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { latestWeight } from '../lib/nutrition'
import { listCardio, addCardio, deleteCardio, weekCardioStats, estimateCalories, MODALITIES, modalityOf, type CardioRecord } from '../lib/vitals'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

const OMS_GOAL_MIN = 150

export default function Cardio() {
  const { user } = useAuth()
  const [records, setRecords] = useState<CardioRecord[]>([])
  const [kg, setKg] = useState<number>(80)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ modality: 'caminhada', minutes: '', km: '', kcal: '', intensity: 'moderate' as 'light' | 'moderate' | 'vigorous' })
  const [flash, setFlash] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    if (!user || !supabaseReady) return
    listCardio(user.id).then(setRecords).catch(() => {})
    latestWeight(user.id).then((w) => { if (w) setKg(w) }).catch(() => {})
  }
  useEffect(load, [user])

  /* kcal auto ao mudar modalidade/minutos */
  const autoKcal = useMemo(() => {
    const min = parseInt(form.minutes) || 0
    if (!min) return 0
    const base = estimateCalories(modalityOf(form.modality).met, kg, min)
    const factor = form.intensity === 'light' ? 0.85 : form.intensity === 'vigorous' ? 1.2 : 1
    return Math.round(base * factor)
  }, [form.modality, form.minutes, form.intensity, kg])

  const save = async () => {
    if (!user || busy) return
    const min = parseInt(form.minutes)
    if (!min || min < 1 || min > 600) { setFlash('Informe a duração em minutos'); setTimeout(() => setFlash(''), 1500); return }
    setBusy(true)
    try {
      await addCardio(user.id, {
        modality: form.modality,
        duration_seconds: min * 60,
        distance_meters: form.km ? Math.round(parseFloat(form.km.replace(',', '.')) * 1000) : null,
        calories: parseInt(form.kcal) || autoKcal || null,
        intensity: form.intensity,
      })
      setForm({ ...form, minutes: '', km: '', kcal: '' }); setOpen(false)
      setFlash('Cardio registrado!'); setTimeout(() => setFlash(''), 1400); load()
    } catch { setFlash('Erro ao salvar'); setTimeout(() => setFlash(''), 2000) } finally { setBusy(false) }
  }

  const week = weekCardioStats(records)
  const pct = Math.min(100, Math.round((week.minutes / OMS_GOAL_MIN) * 100))

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pb-32">
        <ScreenHeader title="Cardio" />

        {/* meta semanal OMS */}
        <div style={card} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold" style={{ color: T.text }}>Meta da semana (OMS)</div>
              <div className="text-[11px]" style={{ color: T.sub }}>{OMS_GOAL_MIN} min de atividade aeróbica</div>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-bold" style={{ color: pct >= 100 ? '#0E9F6E' : T.text }}>{week.minutes}<span className="text-[12px]" style={{ color: T.sub }}> min</span></div>
              <div className="text-[10px]" style={{ color: T.sub }}>{week.count} atividade{week.count !== 1 ? 's' : ''} · {week.calories} kcal</div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: '#EEF1F5' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? '#0E9F6E' : 'linear-gradient(90deg,#2EE6C6,#12C98A)' }} />
          </div>
          {pct >= 100 && <p className="text-[11px] font-semibold mt-2" style={{ color: '#0E9F6E' }}>🎉 Meta da OMS batida esta semana!</p>}
        </div>

        {/* registrar */}
        {!open ? (
          <button onClick={() => setOpen(true)} className="w-full mt-3 py-3.5 rounded-2xl font-bold text-white text-[15px] active:scale-[0.99] transition" style={{ background: T.teal, boxShadow: '0 10px 24px -6px rgba(18,201,166,0.5)' }}>
            + Registrar atividade
          </button>
        ) : (
          <div style={card} className="p-4 mt-3">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {MODALITIES.map((m) => (
                <button key={m.k} onClick={() => setForm({ ...form, modality: m.k })} className="py-2 rounded-xl text-center transition active:scale-95"
                  style={form.modality === m.k ? { background: T.teal } : { background: '#EEF1F5' }}>
                  <div className="text-[18px]">{m.emoji}</div>
                  <div className="text-[9px] font-semibold" style={{ color: form.modality === m.k ? '#fff' : T.sub }}>{m.label}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <div className="text-[10px] mb-0.5 text-center" style={{ color: '#94A3B8' }}>Minutos</div>
                <input type="number" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} placeholder="30"
                  className="w-full bg-white border rounded-xl px-2 py-2.5 text-[15px] font-bold text-center outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
              </div>
              <div>
                <div className="text-[10px] mb-0.5 text-center" style={{ color: '#94A3B8' }}>Km (opc)</div>
                <input value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} placeholder="5.0" inputMode="decimal"
                  className="w-full bg-white border rounded-xl px-2 py-2.5 text-[15px] font-bold text-center outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
              </div>
              <div>
                <div className="text-[10px] mb-0.5 text-center" style={{ color: '#94A3B8' }}>Kcal</div>
                <input type="number" value={form.kcal} onChange={(e) => setForm({ ...form, kcal: e.target.value })} placeholder={autoKcal ? String(autoKcal) : 'auto'}
                  className="w-full bg-white border rounded-xl px-2 py-2.5 text-[15px] font-bold text-center outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([['light', '🌿 Leve'], ['moderate', '💪 Moderado'], ['vigorous', '🔥 Intenso']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setForm({ ...form, intensity: k })} className="py-2 rounded-xl text-[11px] font-semibold transition"
                  style={form.intensity === k ? { background: '#0F172A', color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{l}</button>
              ))}
            </div>
            {autoKcal > 0 && !form.kcal && <p className="text-[11px] mb-3" style={{ color: T.sub }}>Estimativa: <b style={{ color: T.text }}>{autoKcal} kcal</b> ({modalityOf(form.modality).label}, {form.minutes} min, {kg} kg)</p>}
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold" style={{ background: '#EEF1F5', color: T.sub }}>Cancelar</button>
              <button onClick={save} disabled={busy} className="flex-1 py-3 rounded-2xl font-bold text-white text-[14px] disabled:opacity-50" style={{ background: T.teal }}>Salvar</button>
            </div>
          </div>
        )}

        {/* histórico */}
        {records.length > 0 ? (
          <>
            <h3 className="font-semibold mt-5 mb-2 px-1" style={{ color: T.text }}>Histórico</h3>
            <div style={card} className="p-2">
              {records.map((r) => {
                const m = modalityOf(r.modality)
                return (
                  <div key={r.id} className="flex items-center gap-3 px-3 py-2.5" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                    <span className="text-[20px]">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold" style={{ color: T.text }}>{m.label} · {Math.round(r.duration_seconds / 60)} min</div>
                      <div className="text-[11px]" style={{ color: T.sub }}>
                        {new Date(r.started_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        {r.distance_meters ? ` · ${(r.distance_meters / 1000).toFixed(1)} km` : ''}
                        {r.calories ? ` · ${r.calories} kcal` : ''}
                      </div>
                    </div>
                    <button onClick={async () => { if (user) { await deleteCardio(user.id, r.id).catch(() => {}); load() } }} className="text-[12px] px-1" style={{ color: '#CBD5E1' }}>✕</button>
                  </div>
                )
              })}
            </div>
          </>
        ) : !open && (
          <div style={card} className="p-6 mt-3 text-center">
            <div className="text-[32px]">🏃</div>
            <p className="text-[13px] mt-1" style={{ color: T.sub }}>Registre caminhadas, corridas e pedaladas — as kcal são estimadas pelo seu peso.</p>
          </div>
        )}

        {flash && <div className="fixed bottom-24 inset-x-0 flex justify-center z-40"><span className="px-4 py-2 rounded-full text-[13px] font-semibold text-white" style={{ background: '#0F172A' }}>{flash}</span></div>}
      </div>
    </div>
  )
}
