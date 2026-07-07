import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchMonthActivity, markDay, unmarkDay, type MonthActivity, type DayActivity, type DayStatus } from '../../lib/monthActivity'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784' }
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)', borderRadius: 20 }

const STYLE: Record<DayStatus, { bg: string; color: string; label: string }> = {
  full: { bg: '#16C784', color: '#fff', label: 'Completo' },
  partial: { bg: '#F59E0B', color: '#fff', label: 'Parcial' },
  missed: { bg: '#FEE2E2', color: '#DC2626', label: 'Não treinou' },
  rest: { bg: '#F1F5F9', color: '#94A3B8', label: 'Descanso' },
  future: { bg: 'transparent', color: '#CBD5E1', label: '' },
  none: { bg: '#E0F2FE', color: '#0369A1', label: 'Hoje' },
  off: { bg: 'transparent', color: '#CBD5E1', label: 'Sem acompanhamento' },
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function MonthCalendar() {
  const { user } = useAuth()
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [data, setData] = useState<MonthActivity | null>(null)
  const [sel, setSel] = useState<DayActivity | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    if (!user || !supabaseReady) return
    fetchMonthActivity(user.id, ym.y, ym.m).then(setData).catch(() => {})
  }, [user, ym])

  useEffect(() => { setData(null); setSel(null); load() }, [load])

  const prev = () => setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))
  const isCurrentMonth = ym.y === now.getFullYear() && ym.m === now.getMonth()
  const next = () => { if (!isCurrentMonth) setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 })) }

  const firstDow = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7
  const todayStr = new Date().toISOString().slice(0, 10)

  const doMark = async (status: 'full' | 'partial') => {
    if (!user || !sel || busy) return
    setBusy(true)
    try { await markDay(user.id, sel.date, status); setSel(null); load() } finally { setBusy(false) }
  }
  const doUnmark = async () => {
    if (!user || !sel || busy) return
    setBusy(true)
    try { await unmarkDay(user.id, sel.date); setSel(null); load() } finally { setBusy(false) }
  }

  return (
    <div style={card} className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold" style={{ color: T.text }}>📅 Meu mês de treino</span>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition" style={{ background: '#F1F5F9', color: T.sub }}>‹</button>
          <span className="text-[12px] font-semibold w-24 text-center" style={{ color: T.text }}>{MESES[ym.m]} {ym.y}</span>
          <button onClick={next} disabled={isCurrentMonth} className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition disabled:opacity-30" style={{ background: '#F1F5F9', color: T.sub }}>›</button>
        </div>
      </div>

      {!data ? (
        <div className="text-[13px] py-8 text-center animate-pulse" style={{ color: T.sub }}>Carregando…</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { v: data.full, l: 'Completos', c: '#16C784' },
              { v: data.partial, l: 'Parciais', c: '#F59E0B' },
              { v: data.missed, l: 'Faltas', c: '#DC2626' },
              { v: data.streak, l: 'Sequência', c: '#0F172A' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl py-2 text-center" style={{ background: '#F8FAFC' }}>
                <div className="text-[17px] font-bold" style={{ color: s.c }}>{s.v}{s.l === 'Sequência' ? '🔥' : ''}</div>
                <div className="text-[9px]" style={{ color: T.sub }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 mt-3">
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold" style={{ color: '#94A3B8' }}>{d}</div>
            ))}
            {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
            {data.days.map((d) => {
              const st = STYLE[d.status]
              const dayN = parseInt(d.date.slice(8), 10)
              const selected = sel?.date === d.date
              return (
                <button key={d.date} onClick={() => setSel(selected ? null : d)}
                  className="aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition active:scale-90 relative"
                  style={{ background: st.bg, color: st.color, border: selected ? '2px solid #0F172A' : (d.status === 'future' || d.status === 'off') ? '1px dashed #E2E8F0' : 'none' }}>
                  {d.status === 'missed' ? '✕' : dayN}
                  {d.manual && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: '#0F172A' }} />}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
            {(['full', 'partial', 'missed', 'rest'] as DayStatus[]).map((k) => (
              <span key={k} className="flex items-center gap-1 text-[10px]" style={{ color: T.sub }}>
                <span className="w-2.5 h-2.5 rounded" style={{ background: STYLE[k].bg, border: k === 'rest' ? '1px solid #E2E8F0' : 'none' }} />
                {STYLE[k].label}
              </span>
            ))}
          </div>

          {sel && (
            <div className="mt-3 p-3 rounded-xl text-[12px]" style={{ background: '#F8FAFC' }}>
              <div className="font-bold" style={{ color: T.text }}>
                {new Date(sel.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </div>
              {(sel.status === 'full' || sel.status === 'partial') ? (
                <div style={{ color: T.sub }} className="mt-0.5">
                  {sel.sessionName}{sel.setsDone != null ? ` · ${sel.setsDone}${sel.setsPlanned ? `/${sel.setsPlanned}` : ''} séries` : ''}{sel.volume != null && sel.volume > 0 ? ` · ${sel.volume.toLocaleString('pt-BR')}kg` : ''}{sel.durationMin ? ` · ${sel.durationMin}min` : ''}
                  {sel.status === 'partial' && <span className="font-semibold" style={{ color: '#B45309' }}> · parcial</span>}
                </div>
              ) : (
                <div style={{ color: T.sub }} className="mt-0.5">{STYLE[sel.status].label || 'Sem registro'}</div>
              )}

              {/* marcação manual: qualquer dia passado ou hoje, que não tenha sessão real */}
              {sel.date <= todayStr && (sel.manual || (sel.status !== 'full' && sel.status !== 'partial')) && (
                <div className="flex gap-2 mt-2.5">
                  <button onClick={() => doMark('full')} disabled={busy} className="flex-1 py-2 rounded-lg text-[11px] font-bold text-white disabled:opacity-50" style={{ background: '#16C784' }}>✓ Marcar completo</button>
                  <button onClick={() => doMark('partial')} disabled={busy} className="flex-1 py-2 rounded-lg text-[11px] font-bold text-white disabled:opacity-50" style={{ background: '#F59E0B' }}>◐ Parcial</button>
                  {sel.manual && <button onClick={doUnmark} disabled={busy} className="px-3 py-2 rounded-lg text-[11px] font-bold disabled:opacity-50" style={{ background: '#FEE2E2', color: '#DC2626' }}>Limpar</button>}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
