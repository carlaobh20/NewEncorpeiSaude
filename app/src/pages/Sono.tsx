import { useEffect, useMemo, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { todayISO } from '../lib/health'
import { saveSleepFull, getSleepFull, listSleepFull, hoursBetween, type SleepFull } from '../lib/sleep'

const T = { text: '#0F172A', sub: '#64748B', indigo: '#6366F1' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

const GOAL_H = 8
const QUALITIES = [
  { v: 1, emoji: '😫', label: 'Péssimo' },
  { v: 2, emoji: '😕', label: 'Ruim' },
  { v: 3, emoji: '😐', label: 'Ok' },
  { v: 4, emoji: '🙂', label: 'Bom' },
  { v: 5, emoji: '😴', label: 'Ótimo' },
]

const fmtH = (h: number) => `${Math.floor(h)}h${Math.round((h % 1) * 60) ? String(Math.round((h % 1) * 60)).padStart(2, '0') : ''}`

export default function Sono() {
  const { user } = useAuth()
  const [today, setToday] = useState<SleepFull | null>(null)
  const [hist, setHist] = useState<SleepFull[]>([])
  const [bed, setBed] = useState('23:00')
  const [wake, setWake] = useState('07:00')
  const [quality, setQuality] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [flash, setFlash] = useState('')

  const load = () => {
    if (!user || !supabaseReady) return
    getSleepFull(user.id, todayISO()).then((s) => {
      setToday(s)
      if (s?.bed_time) setBed(s.bed_time.slice(0, 5))
      if (s?.wake_time) setWake(s.wake_time.slice(0, 5))
      if (s?.quality) setQuality(s.quality)
    }).catch(() => {})
    listSleepFull(user.id).then(setHist).catch(() => {})
  }
  useEffect(load, [user])

  const hours = hoursBetween(bed, wake)

  const save = async () => {
    if (!user) return
    try {
      await saveSleepFull(user.id, { date: todayISO(), hours, quality, bed_time: bed, wake_time: wake })
      setEditing(false); setFlash('Sono registrado!'); setTimeout(() => setFlash(''), 1400); load()
    } catch { setFlash('Erro ao salvar'); setTimeout(() => setFlash(''), 2000) }
  }

  /* Semana: últimos 7 dias em ordem cronológica */
  const week = useMemo(() => {
    const days: { date: string; hours: number; quality: number | null }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      const rec = hist.find((h) => h.date === d)
      days.push({ date: d, hours: rec?.hours ? Number(rec.hours) : 0, quality: rec?.quality ?? null })
    }
    return days
  }, [hist])

  const withData = week.filter((w) => w.hours > 0)
  const avgH = withData.length ? withData.reduce((a, w) => a + w.hours, 0) / withData.length : 0
  const avgQ = (() => { const qs = withData.filter((w) => w.quality); return qs.length ? qs.reduce((a, w) => a + (w.quality || 0), 0) / qs.length : 0 })()
  const registered = today && Number(today.hours) > 0

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pb-28">
        <ScreenHeader title="Sono" />

        {/* ── Hoje ── */}
        {registered && !editing ? (
          <div style={{ ...card, background: '#0F172A', border: 'none' }} className="p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[32px]">🌙</span>
                <div>
                  <div className="text-[24px] font-bold">{fmtH(Number(today!.hours))}</div>
                  <div className="text-[12px]" style={{ color: '#94A3B8' }}>
                    {today!.bed_time && today!.wake_time ? `${today!.bed_time.slice(0, 5)} → ${today!.wake_time.slice(0, 5)}` : 'última noite'}
                    {today!.quality ? ` · ${QUALITIES.find((q) => q.v === today!.quality)?.emoji}` : ''}
                  </div>
                </div>
              </div>
              <button onClick={() => setEditing(true)} className="text-[12px] font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: '#CBD5E1' }}>editar</button>
            </div>
            <div className="mt-3 pt-3 text-[12px]" style={{ borderTop: '1px solid #1E293B', color: Number(today!.hours) >= 7 ? '#5EEAD4' : '#FCA5A5' }}>
              {Number(today!.hours) >= 8 ? '✨ Excelente! Meta de 8h atingida.' : Number(today!.hours) >= 7 ? '👍 Bom sono. Perto da meta de 8h.' : '⚠️ Abaixo do recomendado (7–9h). Tente dormir mais cedo hoje.'}
            </div>
          </div>
        ) : (
          <div style={card} className="p-5">
            <h2 className="font-bold text-[16px] mb-3" style={{ color: T.text }}>🌙 Como foi sua noite?</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold" style={{ color: T.sub }}>Dormi às</label>
                <input type="time" value={bed} onChange={(e) => setBed(e.target.value)}
                  className="w-full mt-1 bg-white border rounded-2xl px-3 py-2.5 text-[15px] outline-none focus:border-indigo-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
              </div>
              <div>
                <label className="text-[11px] font-semibold" style={{ color: T.sub }}>Acordei às</label>
                <input type="time" value={wake} onChange={(e) => setWake(e.target.value)}
                  className="w-full mt-1 bg-white border rounded-2xl px-3 py-2.5 text-[15px] outline-none focus:border-indigo-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
              </div>
            </div>
            <div className="text-center text-[13px] mt-3" style={{ color: T.sub }}>
              Total: <b style={{ color: T.indigo }}>{fmtH(hours)}</b> de sono
            </div>

            <p className="text-[11px] font-semibold mt-4 mb-2" style={{ color: T.sub }}>Qualidade do sono</p>
            <div className="grid grid-cols-5 gap-1.5">
              {QUALITIES.map((q) => (
                <button key={q.v} onClick={() => setQuality(q.v)} className="py-2 rounded-xl text-center transition active:scale-95" style={quality === q.v ? { background: T.indigo } : { background: '#EEF1F5' }}>
                  <div className="text-[18px]">{q.emoji}</div>
                  <div className="text-[8px] font-semibold" style={{ color: quality === q.v ? '#fff' : T.sub }}>{q.label}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              {editing && <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold" style={{ background: '#EEF1F5', color: T.sub }}>Cancelar</button>}
              <button onClick={save} className="flex-1 py-3 rounded-2xl font-bold text-white text-[15px] active:scale-[0.98] transition" style={{ background: T.indigo, boxShadow: '0 10px 24px -6px rgba(99,102,241,0.5)' }}>
                Salvar sono
              </button>
            </div>
          </div>
        )}

        {/* ── Semana ── */}
        <h3 className="font-semibold mt-5 mb-2 px-1" style={{ color: T.text }}>Últimos 7 dias</h3>
        <div style={card} className="p-4">
          <div className="relative flex items-end justify-between gap-1.5" style={{ height: 110 }}>
            <div className="absolute inset-x-0 border-t border-dashed" style={{ bottom: `${(GOAL_H / 12) * 100}%`, borderColor: 'rgba(99,102,241,0.35)' }} />
            {week.map((w) => {
              const isToday = w.date === todayISO()
              const hPct = Math.min(100, (w.hours / 12) * 100)
              return (
                <div key={w.date} className="flex-1 flex flex-col items-center gap-1 relative">
                  <div className="w-full rounded-t-lg" style={{ height: `${Math.max(hPct, 2)}%`, background: w.hours === 0 ? '#EEF1F5' : w.hours >= 7 ? T.indigo : '#C7D2FE', minHeight: 3 }} />
                  <span className="text-[9px]" style={{ color: isToday ? T.indigo : T.sub, fontWeight: isToday ? 700 : 400 }}>
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][new Date(w.date + 'T12:00:00').getDay()]}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 pt-2 text-[11px]" style={{ borderTop: '1px solid rgba(15,23,42,0.05)', color: T.sub }}>
            <span>Média: <b style={{ color: T.text }}>{avgH ? fmtH(avgH) : '—'}</b> / noite</span>
            <span>Qualidade média: <b style={{ color: T.text }}>{avgQ ? `${avgQ.toFixed(1)}/5 ${QUALITIES[Math.round(avgQ) - 1]?.emoji ?? ''}` : '—'}</b></span>
          </div>
        </div>

        {/* ── Histórico ── */}
        {hist.length > 0 && (
          <>
            <h3 className="font-semibold mt-5 mb-2 px-1" style={{ color: T.text }}>Histórico</h3>
            <div style={card} className="p-2">
              {hist.map((s) => (
                <div key={s.date} className="flex items-center justify-between px-3 py-2.5 text-[13px]" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                  <span style={{ color: T.sub }}>{new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                  <span style={{ color: T.text }}>
                    {s.bed_time && s.wake_time && <span className="text-[11px] mr-2" style={{ color: T.sub }}>{s.bed_time.slice(0, 5)}→{s.wake_time.slice(0, 5)}</span>}
                    <b>{fmtH(Number(s.hours))}</b> {s.quality ? QUALITIES.find((q) => q.v === s.quality)?.emoji : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {flash && <div className="fixed bottom-24 inset-x-0 flex justify-center z-40"><span className="px-4 py-2 rounded-full text-[13px] font-semibold text-white" style={{ background: '#0F172A' }}>{flash}</span></div>}
      </div>
    </div>
  )
}
