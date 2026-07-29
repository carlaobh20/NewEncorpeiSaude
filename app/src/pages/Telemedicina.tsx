import { useCallback, useEffect, useMemo, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import {
  listAvailableSpecialties, listListedProfessionals, listAvailability, listBookingsForProfessional,
  computeOpenSlots, createBooking, listMyBookings,
  type ListedProfessional, type Booking,
} from '../lib/telemedicine'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function Telemedicina() {
  const { user } = useAuth()
  const [specialties, setSpecialties] = useState<string[]>([])
  const [specialty, setSpecialty] = useState<string>('')
  const [pros, setPros] = useState<ListedProfessional[]>([])
  const [chosen, setChosen] = useState<ListedProfessional | null>(null)
  const [slots, setSlots] = useState<Date[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState('')

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const specs = await listAvailableSpecialties()
      setSpecialties(specs)
      const list = await listListedProfessionals(specialty || undefined)
      setPros(list)
    } finally { setLoading(false) }
  }, [specialty])

  useEffect(() => { if (supabaseReady) loadList() }, [loadList])
  useEffect(() => { if (user && supabaseReady) listMyBookings(user.id).then(setMyBookings).catch(() => setMyBookings([])) }, [user])

  const openSlots = useCallback(async (p: ListedProfessional) => {
    setChosen(p); setSlots([])
    const [avail, booked] = await Promise.all([listAvailability(p.user_id), listBookingsForProfessional(p.user_id)])
    setSlots(computeOpenSlots(avail, booked))
  }, [])

  async function book(dt: Date) {
    if (!user || !chosen || busy) return
    setBusy(true)
    try {
      await createBooking(user.id, chosen.user_id, dt)
      setFlash('Consulta solicitada! Você verá aqui quando o profissional confirmar.')
      setTimeout(() => setFlash(''), 2500)
      setChosen(null); setSlots([])
      listMyBookings(user.id).then(setMyBookings).catch(() => {})
    } catch { setFlash('Não deu pra reservar esse horário — pode já ter sido tomado. Tente outro.'); setTimeout(() => setFlash(''), 2500) }
    finally { setBusy(false) }
  }

  const upcoming = useMemo(() => myBookings.filter((b) => b.status !== 'cancelada' && new Date(b.scheduled_at) >= new Date()), [myBookings])

  const STATUS_LABEL: Record<Booking['status'], { l: string; color: string; bg: string }> = {
    solicitada: { l: 'Aguardando confirmação', color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
    confirmada: { l: 'Confirmada', color: '#0E9F6E', bg: 'rgba(18,201,138,0.12)' },
    cancelada: { l: 'Cancelada', color: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
    realizada: { l: 'Realizada', color: T.sub, bg: '#F1F5F9' },
  }

  return (
    <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-28">
      <ScreenHeader title="Telemedicina" />
      <p className="text-[12px] mt-1 mb-3 px-1" style={{ color: T.sub }}>
        Escolha a especialidade, veja quem está disponível e marque um horário real. Ainda sem videochamada nesta primeira versão — a consulta é confirmada aqui e combinada por chat/telefone.
      </p>

      {upcoming.length > 0 && (
        <div style={card} className="p-4 mb-3">
          <div className="text-[13px] font-semibold mb-2" style={{ color: T.text }}>Suas consultas</div>
          {upcoming.map((b) => {
            const s = STATUS_LABEL[b.status]
            return (
              <div key={b.id} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                <span className="text-[13px]" style={{ color: T.text }}>{new Date(b.scheduled_at).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: s.color, background: s.bg }}>{s.l}</span>
              </div>
            )
          })}
        </div>
      )}

      {!chosen ? (
        <>
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button onClick={() => setSpecialty('')} className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition"
                style={!specialty ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>Todas</button>
              {specialties.map((s) => (
                <button key={s} onClick={() => setSpecialty(s)} className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition"
                  style={specialty === s ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{s}</button>
              ))}
            </div>
          )}

          {loading ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p> : pros.length === 0 ? (
            <div style={card} className="p-6 text-center">
              <div className="text-[32px]">🩺</div>
              <p className="text-[13px] mt-2" style={{ color: T.sub }}>
                Ainda não temos profissionais disponíveis pra marcar direto por aqui. Estamos buscando parceiros — se você já tem médico, personal ou nutricionista no Encorpei, continue combinando com ele pelo chat em "Consultas".
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pros.map((p) => (
                <button key={p.user_id} onClick={() => openSlots(p)} style={card} className="w-full p-4 text-left active:scale-[0.99] transition">
                  <div className="text-[14px] font-bold" style={{ color: T.text }}>{p.name}</div>
                  <div className="text-[12px]" style={{ color: T.teal }}>{p.specialty}{p.crm ? ` · ${p.crm}` : ''}</div>
                  {p.bio && <p className="text-[12px] mt-1" style={{ color: T.sub }}>{p.bio}</p>}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={card} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[14px] font-bold" style={{ color: T.text }}>{chosen.name}</div>
              <div className="text-[12px]" style={{ color: T.teal }}>{chosen.specialty}</div>
            </div>
            <button onClick={() => { setChosen(null); setSlots([]) }} className="text-[12px] font-semibold" style={{ color: T.sub }}>← voltar</button>
          </div>
          {slots.length === 0 ? (
            <p className="text-[13px] py-4 text-center" style={{ color: T.sub }}>Sem horário livre nos próximos 14 dias.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {slots.slice(0, 20).map((s) => (
                <button key={s.getTime()} onClick={() => book(s)} disabled={busy}
                  className="py-2.5 rounded-xl text-[12px] font-semibold active:scale-95 disabled:opacity-50"
                  style={{ background: '#EEF1F5', color: T.text }}>
                  {s.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}<br />{s.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {flash && <div className="fixed bottom-24 inset-x-0 flex justify-center z-40"><span className="px-4 py-2 rounded-full text-[13px] font-semibold text-white text-center max-w-xs" style={{ background: '#0F172A' }}>{flash}</span></div>}
    </div>
  )
}
