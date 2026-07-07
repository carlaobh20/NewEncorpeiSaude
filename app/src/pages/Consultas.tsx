import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listConsultations, addConsultation, setConsultationStatus, type Consultation } from '../lib/care'
import CareChat from '../components/CareChat'
import ShareCare from '../components/ShareCare'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

const TYPES = [
  { k: 'medico', l: '🩺 Médico' },
  { k: 'personal', l: '💪 Personal' },
  { k: 'nutricionista', l: '🥗 Nutricionista' },
]
const LABEL: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.k, t.l]))

export default function Consultas() {
  const { user } = useAuth()
  const [items, setItems] = useState<Consultation[] | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ professional_type: 'medico', date: new Date().toISOString().slice(0, 10), time: '09:00', notes: '' })
  const [flash, setFlash] = useState('')

  const load = () => { if (user && supabaseReady) listConsultations(user.id).then(setItems).catch(() => setItems([])); else setItems([]) }
  useEffect(load, [user])

  const save = async () => {
    if (!user) return
    try {
      await addConsultation(user.id, { professional_type: form.professional_type, scheduled_at: new Date(`${form.date}T${form.time}:00`).toISOString(), notes: form.notes.trim() || undefined })
      setOpen(false); setForm({ ...form, notes: '' })
      setFlash('Consulta agendada!'); setTimeout(() => setFlash(''), 1400); load()
    } catch { setFlash('Erro ao agendar'); setTimeout(() => setFlash(''), 2000) }
  }

  const upcoming = (items || []).filter((c) => c.status === 'agendada' && new Date(c.scheduled_at) >= new Date())
  const past = (items || []).filter((c) => c.status !== 'agendada' || new Date(c.scheduled_at) < new Date())

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-32">
        <ScreenHeader title="Consultas" />

        {/* chat primeiro: é o canal do dia a dia */}
        <CareChat as="paciente" height={340} />

        <ShareCare />

        <div className="flex items-center justify-between mt-5 mb-2 px-1">
          <h3 className="font-semibold" style={{ color: T.text }}>Agendadas</h3>
          {!open && <button onClick={() => setOpen(true)} className="text-[13px] font-bold px-3.5 py-1.5 rounded-full text-white active:scale-95 transition" style={{ background: T.teal }}>+ Consulta</button>}
        </div>

        {open && (
          <div style={card} className="p-4 mb-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              {TYPES.map((t) => (
                <button key={t.k} onClick={() => setForm({ ...form, professional_type: t.k })} className="py-2 rounded-xl text-[11px] font-semibold transition"
                  style={form.professional_type === t.k ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{t.l}</button>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="flex-1 bg-white border rounded-2xl px-3 py-2.5 text-[13px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="bg-white border rounded-2xl px-3 py-2.5 text-[13px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
            </div>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Motivo / observações (opcional)"
              className="w-full bg-white border rounded-2xl px-4 py-2.5 mb-3 text-[13px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold" style={{ background: '#EEF1F5', color: T.sub }}>Cancelar</button>
              <button onClick={save} className="flex-1 py-3 rounded-2xl font-bold text-white text-[14px]" style={{ background: T.teal }}>Agendar</button>
            </div>
          </div>
        )}

        {items === null ? <p className="text-center py-6 text-sm" style={{ color: T.sub }}>Carregando…</p>
          : upcoming.length === 0 && !open ? (
            <div style={card} className="p-5 text-center">
              <p className="text-[13px]" style={{ color: T.sub }}>Nenhuma consulta agendada.</p>
            </div>
          ) : upcoming.map((c) => (
            <div key={c.id} style={card} className="p-4 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-bold" style={{ color: T.text }}>{LABEL[c.professional_type]}</div>
                  <div className="text-[12px]" style={{ color: T.sub }}>
                    {new Date(c.scheduled_at).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {c.notes ? ` · ${c.notes}` : ''}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={async () => { if (user) { await setConsultationStatus(user.id, c.id, 'realizada').catch(() => {}); load() } }} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: 'rgba(18,201,138,0.12)', color: '#0E9F6E' }}>✓ Feita</button>
                  <button onClick={async () => { if (user) { await setConsultationStatus(user.id, c.id, 'cancelada').catch(() => {}); load() } }} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: '#FEF2F2', color: '#DC2626' }}>✕</button>
                </div>
              </div>
            </div>
          ))}

        {past.length > 0 && (
          <>
            <h3 className="font-semibold mt-5 mb-2 px-1" style={{ color: T.text }}>Anteriores</h3>
            <div style={card} className="p-2">
              {past.slice(0, 10).map((c) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2.5 text-[13px]" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                  <span style={{ color: T.sub }}>{LABEL[c.professional_type]} · {new Date(c.scheduled_at).toLocaleDateString('pt-BR')}</span>
                  <span className="text-[11px] font-semibold" style={{ color: c.status === 'realizada' ? '#0E9F6E' : c.status === 'cancelada' ? '#DC2626' : T.sub }}>
                    {c.status === 'realizada' ? '✓ realizada' : c.status === 'cancelada' ? 'cancelada' : 'passada'}
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
