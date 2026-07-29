import { supabase } from './supabase'

/* ────────────────────────────────────────────────────────────
   Telemedicina — Fase 1 (agendamento real, sem vídeo ainda).
   Tabelas isoladas (telemedicine_*), não usa consultations/care_links.
   ──────────────────────────────────────────────────────────── */

export type TelemedProfile = {
  user_id: string
  specialty: string
  crm: string | null
  bio: string | null
  listed: boolean
}

export async function getMyTelemedProfile(userId: string): Promise<TelemedProfile | null> {
  const { data } = await supabase.from('telemedicine_profiles').select('*').eq('user_id', userId).maybeSingle()
  return (data as TelemedProfile) || null
}

export async function saveTelemedProfile(userId: string, p: { specialty: string; crm?: string; bio?: string; listed: boolean }) {
  const { error } = await supabase.from('telemedicine_profiles')
    .upsert({ user_id: userId, ...p, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

export type ListedProfessional = { user_id: string; name: string; specialty: string; crm: string | null; bio: string | null }

/** Profissionais listados publicamente (listed=true), opcionalmente filtrados por especialidade. */
export async function listListedProfessionals(specialty?: string): Promise<ListedProfessional[]> {
  let q = supabase.from('telemedicine_profiles').select('user_id,specialty,crm,bio').eq('listed', true)
  if (specialty) q = q.eq('specialty', specialty)
  const { data } = await q
  const rows = (data as { user_id: string; specialty: string; crm: string | null; bio: string | null }[]) || []
  if (!rows.length) return []
  const { data: profs } = await supabase.from('profiles').select('id,name,full_name').in('id', rows.map((r) => r.user_id))
  const nameOf = new Map(((profs as { id: string; name?: string; full_name?: string }[]) || []).map((p) => [p.id, p.name || p.full_name || 'Profissional']))
  return rows.map((r) => ({ user_id: r.user_id, specialty: r.specialty, crm: r.crm, bio: r.bio, name: nameOf.get(r.user_id) || 'Profissional' }))
}

/** Lista de especialidades distintas hoje disponíveis (pra montar o filtro sem depender de lista fixa). */
export async function listAvailableSpecialties(): Promise<string[]> {
  const { data } = await supabase.from('telemedicine_profiles').select('specialty').eq('listed', true)
  const set = new Set(((data as { specialty: string }[]) || []).map((r) => r.specialty).filter(Boolean))
  return Array.from(set).sort()
}

export type AvailabilitySlot = { id: string; professional_id: string; weekday: number; start_time: string; end_time: string; slot_minutes: number; active: boolean }

export async function listAvailability(professionalId: string): Promise<AvailabilitySlot[]> {
  const { data } = await supabase.from('telemedicine_availability').select('*').eq('professional_id', professionalId).order('weekday').order('start_time')
  return (data as AvailabilitySlot[]) || []
}
export async function addAvailability(professionalId: string, s: { weekday: number; start_time: string; end_time: string; slot_minutes: number }) {
  const { error } = await supabase.from('telemedicine_availability').insert({ professional_id: professionalId, ...s })
  if (error) throw error
}
export async function removeAvailability(id: string) {
  const { error } = await supabase.from('telemedicine_availability').delete().eq('id', id)
  if (error) throw error
}

export type Booking = { id: string; patient_id: string; professional_id: string; scheduled_at: string; status: 'solicitada' | 'confirmada' | 'cancelada' | 'realizada'; notes: string | null }

/** Gera os próximos horários livres (não reservados) pros próximos `days` dias, a partir da disponibilidade semanal recorrente. */
export function computeOpenSlots(avail: AvailabilitySlot[], booked: Booking[], days = 14): Date[] {
  const bookedSet = new Set(booked.filter((b) => b.status !== 'cancelada').map((b) => new Date(b.scheduled_at).getTime()))
  const now = new Date()
  const out: Date[] = []
  for (let d = 0; d < days; d++) {
    const day = new Date(now); day.setDate(now.getDate() + d); day.setHours(0, 0, 0, 0)
    const weekday = day.getDay()
    for (const a of avail.filter((x) => x.active && x.weekday === weekday)) {
      const [sh, sm] = a.start_time.slice(0, 5).split(':').map(Number)
      const [eh, em] = a.end_time.slice(0, 5).split(':').map(Number)
      let cursor = new Date(day); cursor.setHours(sh, sm, 0, 0)
      const end = new Date(day); end.setHours(eh, em, 0, 0)
      while (cursor.getTime() + a.slot_minutes * 60000 <= end.getTime()) {
        if (cursor.getTime() > now.getTime() && !bookedSet.has(cursor.getTime())) out.push(new Date(cursor))
        cursor = new Date(cursor.getTime() + a.slot_minutes * 60000)
      }
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime())
}

export async function listBookingsForProfessional(professionalId: string, days = 30): Promise<Booking[]> {
  const from = new Date(); from.setDate(from.getDate() - 1)
  const to = new Date(); to.setDate(to.getDate() + days)
  const { data } = await supabase.from('telemedicine_bookings').select('*')
    .eq('professional_id', professionalId).gte('scheduled_at', from.toISOString()).lte('scheduled_at', to.toISOString())
    .order('scheduled_at')
  return (data as Booking[]) || []
}

export async function listMyBookings(patientId: string): Promise<Booking[]> {
  const { data } = await supabase.from('telemedicine_bookings').select('*').eq('patient_id', patientId).order('scheduled_at', { ascending: false })
  return (data as Booking[]) || []
}

export async function createBooking(patientId: string, professionalId: string, scheduledAt: Date, notes?: string) {
  const { error } = await supabase.from('telemedicine_bookings')
    .insert({ patient_id: patientId, professional_id: professionalId, scheduled_at: scheduledAt.toISOString(), notes: notes || null })
  if (error) throw error
}

export async function setBookingStatus(id: string, status: Booking['status']) {
  const { error } = await supabase.from('telemedicine_bookings').update({ status }).eq('id', id)
  if (error) throw error
}
