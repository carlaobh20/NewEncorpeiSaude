import { useCallback, useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import {
  getMyTelemedProfile, saveTelemedProfile, listAvailability, addAvailability, removeAvailability,
  listBookingsForProfessional, setBookingStatus,
  type TelemedProfile, type AvailabilitySlot, type Booking,
} from '../lib/telemedicine'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }
const input: React.CSSProperties = { border: '1px solid #E4E9F1', borderRadius: 12, padding: '8px 10px', fontSize: 13, color: T.text, background: '#fff' }
const DOW_FULL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function TelemedicinaPro() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<TelemedProfile | null>(null)
  const [form, setForm] = useState({ specialty: '', crm: '', bio: '', listed: false })
  const [avail, setAvail] = useState<AvailabilitySlot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [newSlot, setNewSlot] = useState({ weekday: 1, start_time: '09:00', end_time: '12:00', slot_minutes: 30 })
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState('')

  const load = useCallback(async () => {
    if (!user || !supabaseReady) return
    const p = await getMyTelemedProfile(user.id)
    setProfile(p)
    if (p) setForm({ specialty: p.specialty, crm: p.crm || '', bio: p.bio || '', listed: p.listed })
    setAvail(await listAvailability(user.id))
    setBookings(await listBookingsForProfessional(user.id))
  }, [user])
  useEffect(() => { load() }, [load])

  async function saveProfile() {
    if (!user || busy) return
    setBusy(true)
    try {
      await saveTelemedProfile(user.id, form)
      setFlash('Salvo!'); setTimeout(() => setFlash(''), 1400)
      load()
    } finally { setBusy(false) }
  }

  async function addSlot() {
    if (!user || busy) return
    setBusy(true)
    try { await addAvailability(user.id, newSlot); load() } finally { setBusy(false) }
  }

  async function act(id: string, status: Booking['status']) {
    if (busy) return
    setBusy(true)
    try { await setBookingStatus(id, status); load() } finally { setBusy(false) }
  }

  const pending = bookings.filter((b) => b.status === 'solicitada')
  const confirmed = bookings.filter((b) => b.status === 'confirmada' && new Date(b.scheduled_at) >= new Date())

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title="Telemedicina — meu painel" />

      <div style={card} className="p-4 mt-2">
        <div className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Meu perfil de telemedicina</div>
        <p className="text-[11px] mb-3" style={{ color: T.sub }}>
          Só aparece pra paciente escolher se "Listar meu perfil" estiver ligado. Você pode preencher tudo antes e ativar quando quiser.
        </p>
        <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Especialidade (ex: Cardiologia, Personal Trainer)"
          className="w-full mb-2" style={input} />
        <input value={form.crm} onChange={(e) => setForm({ ...form, crm: e.target.value })} placeholder="CRM (se aplicável)"
          className="w-full mb-2" style={input} />
        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio curta pro paciente ver"
          className="w-full mb-2" style={{ ...input, minHeight: 70 }} />
        <label className="flex items-center gap-2 mb-3 text-[13px]" style={{ color: T.text }}>
          <input type="checkbox" checked={form.listed} onChange={(e) => setForm({ ...form, listed: e.target.checked })} />
          Listar meu perfil pra pacientes marcarem
        </label>
        <button onClick={saveProfile} disabled={busy || !form.specialty.trim()}
          className="w-full py-3 rounded-2xl font-bold text-white text-[14px] disabled:opacity-50" style={{ background: T.teal }}>Salvar perfil</button>
        {flash && <p className="text-[12px] mt-2 text-center" style={{ color: T.teal }}>{flash}</p>}
      </div>

      <div style={card} className="p-4 mt-3">
        <div className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Minha disponibilidade semanal</div>
        <p className="text-[11px] mb-3" style={{ color: T.sub }}>Horários que se repetem toda semana. O app já converte em horários de verdade pros próximos 14 dias.</p>
        {avail.length === 0 && <p className="text-[12px] py-2" style={{ color: T.sub }}>Nenhum horário cadastrado ainda.</p>}
        {avail.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid #F1F5F9' }}>
            <span className="text-[13px]" style={{ color: T.text }}>{DOW_FULL[a.weekday]} · {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)} ({a.slot_minutes}min por paciente)</span>
            <button onClick={() => removeAvailability(a.id).then(load)} className="text-[11px] px-2 py-1 rounded-full hover:bg-slate-100" style={{ color: T.sub }}>✕</button>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <select value={newSlot.weekday} onChange={(e) => setNewSlot({ ...newSlot, weekday: Number(e.target.value) })} style={input}>
            {DOW_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <select value={newSlot.slot_minutes} onChange={(e) => setNewSlot({ ...newSlot, slot_minutes: Number(e.target.value) })} style={input}>
            {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
          <input type="time" value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })} style={input} />
          <input type="time" value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })} style={input} />
          <button onClick={addSlot} disabled={busy} className="col-span-2 rounded-xl py-2 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-50" style={{ background: T.teal }}>+ Adicionar horário</button>
        </div>
      </div>

      <div style={card} className="p-4 mt-3">
        <div className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Pedidos de consulta {pending.length > 0 && `(${pending.length})`}</div>
        {pending.length === 0 && confirmed.length === 0 && <p className="text-[12px] py-2" style={{ color: T.sub }}>Nenhum pedido no momento.</p>}
        {[...pending, ...confirmed].map((b) => (
          <div key={b.id} className="py-2.5" style={{ borderTop: '1px solid #F1F5F9' }}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium" style={{ color: T.text }}>{new Date(b.scheduled_at).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={b.status === 'solicitada' ? { color: '#D97706', background: 'rgba(217,119,6,0.12)' } : { color: '#0E9F6E', background: 'rgba(18,201,138,0.12)' }}>
                {b.status === 'solicitada' ? 'Aguardando você' : 'Confirmada'}
              </span>
            </div>
            {b.status === 'solicitada' && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => act(b.id, 'confirmada')} className="flex-1 py-1.5 rounded-lg text-[11px] font-bold text-white active:scale-95" style={{ background: T.teal }}>Confirmar</button>
                <button onClick={() => act(b.id, 'cancelada')} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold active:scale-95" style={{ background: '#FEF2F2', color: '#DC2626' }}>Recusar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
