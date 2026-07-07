import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import {
  listCompromissos, addCompromisso, toggleCompromisso, deleteCompromisso,
  listRecorrentes, addRecorrente, deleteRecorrente,
  listConfirmacoes, confirmRecorrente, unconfirmRecorrente,
  buildItems, CATEGORIES, catOf, type AgendaItem, type Recorrente,
} from '../lib/agenda'
import { listConsultations, type Consultation } from '../lib/care'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

const iso = (d: Date) => d.toISOString().slice(0, 10)
const todayStr = () => iso(new Date())
const addDays = (s: string, n: number) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d) }
const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const DOW_FULL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

type View = 'hoje' | 'semana' | 'mes'

export default function Agenda() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [view, setView] = useState<View>('hoje')
  const [items, setItems] = useState<AgendaItem[]>([])
  const [recorrentes, setRecorrentes] = useState<Recorrente[]>([])
  const [consultas, setConsultas] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [selDay, setSelDay] = useState(todayStr())
  const [ym, setYm] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() } })

  /* formulário */
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'unico' | 'recorrente'>('unico')
  const [form, setForm] = useState({ title: '', date: todayStr(), time: '', category: 'pessoal', notes: '' })
  const [recDays, setRecDays] = useState<number[]>([1, 3, 5])
  const [flash, setFlash] = useState('')

  /* intervalo carregado conforme a visão */
  const range = useMemo(() => {
    if (view === 'hoje') return { from: todayStr(), to: todayStr() }
    if (view === 'semana') {
      const n = new Date()
      const mon = new Date(n); mon.setDate(n.getDate() - ((n.getDay() + 6) % 7))
      return { from: iso(mon), to: addDays(iso(mon), 6) }
    }
    const first = new Date(ym.y, ym.m, 1)
    const last = new Date(ym.y, ym.m + 1, 0)
    return { from: iso(first), to: iso(last) }
  }, [view, ym])

  const load = useCallback(async () => {
    if (!user || !supabaseReady) { setLoading(false); return }
    setLoading(true)
    try {
      const [unicos, recs, confs, cons] = await Promise.all([
        listCompromissos(user.id, range.from, range.to),
        listRecorrentes(user.id),
        listConfirmacoes(user.id, range.from, range.to),
        listConsultations(user.id),
      ])
      setRecorrentes(recs)
      setItems(buildItems(unicos, recs, confs, range.from, range.to))
      setConsultas(cons.filter((c) => c.status === 'agendada'))
    } finally { setLoading(false) }
  }, [user, range])

  useEffect(() => { load() }, [load])

  const toggle = async (it: AgendaItem) => {
    if (!user) return
    setItems((prev) => prev.map((x) => (x.key === it.key ? { ...x, done: !x.done } : x)))
    try {
      if (it.kind === 'unico') await toggleCompromisso(user.id, it.id, !it.done)
      else it.done ? await unconfirmRecorrente(user.id, it.id, it.date) : await confirmRecorrente(user.id, it.id, it.date)
    } catch { load() }
  }

  const remove = async (it: AgendaItem) => {
    if (!user) return
    if (it.kind === 'unico') await deleteCompromisso(user.id, it.id).catch(() => {})
    else await deleteRecorrente(user.id, it.id).catch(() => {}) // encerra a série
    load()
  }

  const save = async () => {
    if (!user || !form.title.trim()) return
    try {
      if (mode === 'unico') {
        await addCompromisso(user.id, { title: form.title.trim(), date: form.date, time: form.time || undefined, category: form.category, notes: form.notes.trim() || undefined })
      } else {
        if (!recDays.length) { setFlash('Escolha os dias da semana'); setTimeout(() => setFlash(''), 1500); return }
        await addRecorrente(user.id, { title: form.title.trim(), time: form.time || undefined, days: recDays, category: form.category })
      }
      setForm({ title: '', date: todayStr(), time: '', category: 'pessoal', notes: '' }); setOpen(false)
      setFlash('Adicionado à agenda!'); setTimeout(() => setFlash(''), 1400); load()
    } catch { setFlash('Erro ao salvar'); setTimeout(() => setFlash(''), 2000) }
  }

  /* consultas de hoje entram como itens automáticos na visão Hoje */
  const autoToday = useMemo(() => consultas
    .filter((c) => c.scheduled_at.slice(0, 10) === todayStr())
    .map((c) => ({ id: c.id, time: new Date(c.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), type: c.professional_type })), [consultas])

  const dayItems = (d: string) => items.filter((i) => i.date === d)
  const todayItems = dayItems(todayStr())
  const doneToday = todayItems.filter((i) => i.done).length + 0

  const Item = ({ it }: { it: AgendaItem }) => {
    const cat = catOf(it.category)
    return (
      <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
        <button onClick={() => toggle(it)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition active:scale-90"
          style={{ background: it.done ? cat.color : 'transparent', border: it.done ? 'none' : `1.5px solid ${cat.color}55` }}>
          {it.done && <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><path d="M5 12l5 5L20 6" /></svg>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold truncate" style={{ color: it.done ? '#94A3B8' : T.text, textDecoration: it.done ? 'line-through' : 'none' }}>
            {cat.emoji} {it.title} {it.kind === 'recorrente' && <span className="text-[10px]" title="recorrente">🔁</span>}
          </div>
          <div className="text-[11px]" style={{ color: T.sub }}>
            {it.time ?? 'sem hora'} · {cat.label}{it.notes ? ` · ${it.notes}` : ''}
          </div>
        </div>
        <button onClick={() => remove(it)} className="text-[12px] px-1.5" style={{ color: '#CBD5E1' }} title={it.kind === 'recorrente' ? 'Encerrar série' : 'Excluir'}>✕</button>
      </div>
    )
  }

  /* mês: grade */
  const monthGrid = useMemo(() => {
    if (view !== 'mes') return null
    const firstDow = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7
    const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
    const byDate = new Map<string, AgendaItem[]>()
    items.forEach((i) => { if (!byDate.has(i.date)) byDate.set(i.date, []); byDate.get(i.date)!.push(i) })
    return { firstDow, daysInMonth, byDate }
  }, [view, ym, items])

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pt-6 pb-32">
        <header className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: T.text }}>Agenda</h1>
          <button onClick={() => setOpen(true)} className="text-[13px] font-bold px-3.5 py-1.5 rounded-full text-white active:scale-95 transition" style={{ background: T.teal }}>+ Novo</button>
        </header>

        {/* visões */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {([['hoje', 'Hoje'], ['semana', 'Semana'], ['mes', 'Mês']] as [View, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} className="py-2.5 rounded-2xl text-[13px] font-semibold transition active:scale-95"
              style={view === k ? { background: '#0F172A', color: '#fff' } : { background: '#fff', border: '1px solid #EDF2F7', color: T.sub }}>{l}</button>
          ))}
        </div>

        {/* formulário */}
        {open && (
          <div style={card} className="p-4 mt-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              {([['unico', '📌 Único'], ['recorrente', '🔁 Recorrente']] as ['unico' | 'recorrente', string][]).map(([k, l]) => (
                <button key={k} onClick={() => setMode(k)} className="py-2 rounded-xl text-[12px] font-semibold transition"
                  style={mode === k ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{l}</button>
              ))}
            </div>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="O que você precisa fazer?"
              className="w-full bg-white border rounded-2xl px-4 py-2.5 mb-2 text-[14px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
            <div className="flex gap-2 mb-2">
              {mode === 'unico' && (
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="flex-1 bg-white border rounded-2xl px-3 py-2.5 text-[13px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
              )}
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="flex-1 bg-white border rounded-2xl px-3 py-2.5 text-[13px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
            </div>
            {mode === 'recorrente' && (
              <div className="flex gap-1.5 mb-2">
                {DOW.map((d, i) => (
                  <button key={i} onClick={() => setRecDays((ds) => (ds.includes(i) ? ds.filter((x) => x !== i) : [...ds, i]))}
                    className="flex-1 py-2 rounded-xl text-[12px] font-bold transition"
                    style={recDays.includes(i) ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{d}</button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CATEGORIES.map((c) => (
                <button key={c.k} onClick={() => setForm({ ...form, category: c.k })} className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition"
                  style={form.category === c.k ? { background: c.color, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{c.emoji} {c.label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold" style={{ background: '#EEF1F5', color: T.sub }}>Cancelar</button>
              <button onClick={save} className="flex-1 py-3 rounded-2xl font-bold text-white text-[14px]" style={{ background: T.teal }}>Salvar</button>
            </div>
          </div>
        )}

        {loading ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p> : (
          <>
            {/* ── HOJE ── */}
            {view === 'hoje' && (
              <>
                <div style={card} className="p-4 mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-bold" style={{ color: T.text }}>
                      {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </div>
                    <div className="text-[12px]" style={{ color: T.sub }}>
                      {todayItems.length === 0 ? 'Nada agendado pra hoje' : `${doneToday} de ${todayItems.length} concluído${todayItems.length > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  {todayItems.length > 0 && (
                    <div className="text-[22px] font-bold" style={{ color: doneToday === todayItems.length ? '#0E9F6E' : T.text }}>
                      {Math.round((doneToday / todayItems.length) * 100)}%
                    </div>
                  )}
                </div>

                {/* consultas de hoje (automático) */}
                {autoToday.length > 0 && (
                  <div style={{ ...card, background: '#0F172A', border: 'none' }} className="p-4 mt-3 text-white">
                    {autoToday.map((c) => (
                      <button key={c.id} onClick={() => nav('/consultas')} className="w-full flex items-center justify-between py-1 text-left">
                        <span className="text-[13px] font-semibold">🩺 Consulta com {c.type === 'medico' ? 'médico' : c.type === 'personal' ? 'personal' : 'nutricionista'} hoje</span>
                        <span className="text-[13px] font-bold" style={{ color: '#5EEAD4' }}>{c.time}</span>
                      </button>
                    ))}
                  </div>
                )}

                {todayItems.length > 0 ? (
                  <div style={card} className="p-1.5 mt-3">{todayItems.map((it) => <Item key={it.key} it={it} />)}</div>
                ) : (
                  <div style={card} className="p-6 mt-3 text-center">
                    <div className="text-[32px]">🗓️</div>
                    <p className="text-[13px] mt-1" style={{ color: T.sub }}>Toque em "+ Novo" pra agendar algo — único ou recorrente.</p>
                  </div>
                )}
              </>
            )}

            {/* ── SEMANA ── */}
            {view === 'semana' && (
              <div className="mt-3 space-y-3">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = addDays(range.from, i)
                  const its = dayItems(d)
                  const isToday = d === todayStr()
                  return (
                    <div key={d}>
                      <p className="text-[11px] font-bold uppercase tracking-wider px-1 mb-1" style={{ color: isToday ? T.teal : T.sub }}>
                        {DOW_FULL[new Date(d + 'T12:00:00').getDay()]} · {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{isToday ? ' · hoje' : ''}
                      </p>
                      {its.length === 0
                        ? <p className="text-[12px] px-1" style={{ color: '#C3CBD8' }}>— livre</p>
                        : <div style={card} className="p-1.5">{its.map((it) => <Item key={it.key} it={it} />)}</div>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── MÊS ── */}
            {view === 'mes' && monthGrid && (
              <>
                <div style={card} className="p-4 mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#F1F5F9', color: T.sub }}>‹</button>
                    <span className="text-[13px] font-bold" style={{ color: T.text }}>{MESES[ym.m]} {ym.y}</span>
                    <button onClick={() => setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#F1F5F9', color: T.sub }}>›</button>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => <div key={i} className="text-center text-[10px] font-semibold" style={{ color: '#94A3B8' }}>{d}</div>)}
                    {Array.from({ length: monthGrid.firstDow }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: monthGrid.daysInMonth }).map((_, i) => {
                      const d = iso(new Date(Date.UTC(ym.y, ym.m, i + 1)))
                      const its = monthGrid.byDate.get(d) || []
                      const isToday = d === todayStr()
                      const selected = selDay === d
                      return (
                        <button key={d} onClick={() => setSelDay(d)} className="aspect-square rounded-lg flex flex-col items-center justify-center transition active:scale-90"
                          style={{ background: selected ? '#0F172A' : isToday ? 'rgba(18,201,166,0.15)' : '#F8FAFC', border: selected ? 'none' : '1px solid #F1F5F9' }}>
                          <span className="text-[11px] font-bold" style={{ color: selected ? '#fff' : isToday ? T.teal : T.text }}>{i + 1}</span>
                          {its.length > 0 && (
                            <span className="flex gap-0.5 mt-0.5">
                              {its.slice(0, 3).map((it, j) => <span key={j} className="w-1 h-1 rounded-full" style={{ background: selected ? '#5EEAD4' : catOf(it.category).color }} />)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <p className="text-[11px] font-bold uppercase tracking-wider px-1 mt-4 mb-1" style={{ color: T.sub }}>
                  {new Date(selDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </p>
                {dayItems(selDay).length === 0
                  ? <p className="text-[12px] px-1" style={{ color: '#C3CBD8' }}>— nada agendado</p>
                  : <div style={card} className="p-1.5">{dayItems(selDay).map((it) => <Item key={it.key} it={it} />)}</div>}
              </>
            )}

            {/* recorrentes ativos */}
            {recorrentes.length > 0 && view !== 'mes' && (
              <>
                <h3 className="font-semibold mt-6 mb-2 px-1" style={{ color: T.text }}>🔁 Rotinas ativas</h3>
                <div style={card} className="p-1.5">
                  {recorrentes.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                      <div>
                        <div className="text-[13px] font-semibold" style={{ color: T.text }}>{catOf(r.category).emoji} {r.title}</div>
                        <div className="text-[11px]" style={{ color: T.sub }}>{r.days.sort().map((d) => DOW_FULL[d]).join(', ')}{r.time ? ` · ${r.time.slice(0, 5)}` : ''}</div>
                      </div>
                      <button onClick={async () => { if (user) { await deleteRecorrente(user.id, r.id).catch(() => {}); load() } }} className="text-[11px] font-semibold" style={{ color: '#DC2626' }}>encerrar</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {flash && <div className="fixed bottom-24 inset-x-0 flex justify-center z-40"><span className="px-4 py-2 rounded-full text-[13px] font-semibold text-white" style={{ background: '#0F172A' }}>{flash}</span></div>}
      </div>
    </div>
  )
}
