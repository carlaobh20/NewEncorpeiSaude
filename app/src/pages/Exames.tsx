import { useEffect, useMemo, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listExams, addExam, deleteExam, examFileUrl, markerHistory, resultStatus, EXAM_CATEGORIES, type Exam, type ExamResult } from '../lib/care'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

const ST = {
  in: { label: 'Dentro da referência', color: '#0E9F6E', bg: 'rgba(18,201,138,0.12)' },
  low: { label: 'Abaixo da referência', color: '#B45309', bg: 'rgba(217,119,6,0.12)' },
  high: { label: 'Acima da referência', color: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
  na: { label: 'Sem referência', color: '#64748B', bg: '#F1F5F9' },
}

function MarkerChart({ data }: { data: { date: string; value: number }[] }) {
  if (data.length < 2) return <p className="text-[12px] text-center py-4" style={{ color: T.sub }}>Registre o mesmo marcador em 2+ exames pra ver a evolução.</p>
  const vals = data.map((d) => d.value)
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1
  const w = 300, h = 80
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d.value - min) / range) * (h - 10) - 5}`).join(' ')
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
        <polyline fill="none" stroke={T.teal} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" points={pts} />
        {data.map((d, i) => <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - ((d.value - min) / range) * (h - 10) - 5} r={3.5} fill={T.teal} />)}
      </svg>
      <div className="flex justify-between text-[10px]" style={{ color: T.sub }}>
        <span>{new Date(data[0].date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
        <span>{new Date(data[data.length - 1].date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  )
}

export default function Exames() {
  const { user } = useAuth()
  const [exams, setExams] = useState<Exam[] | null>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [expandId, setExpandId] = useState<string | null>(null)
  const [evoMarker, setEvoMarker] = useState<string | null>(null)
  const [evoData, setEvoData] = useState<{ date: string; value: number }[]>([])
  const [flash, setFlash] = useState('')

  /* form */
  const [form, setForm] = useState({ title: '', category: 'Sangue', date: new Date().toISOString().slice(0, 10), notes: '' })
  const [rows, setRows] = useState<ExamResult[]>([{ marker: '', value: 0, unit: '', ref_min: undefined, ref_max: undefined } as unknown as ExamResult])
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => { if (user && supabaseReady) listExams(user.id).then(setExams).catch(() => setExams([])); else setExams([]) }
  useEffect(load, [user])

  useEffect(() => {
    if (!user || !evoMarker) return
    markerHistory(user.id, evoMarker).then(setEvoData).catch(() => setEvoData([]))
  }, [user, evoMarker])

  const allMarkers = useMemo(() => {
    const set = new Set<string>()
    ;(exams || []).forEach((e) => e.results.forEach((r) => set.add(r.marker)))
    return Array.from(set).sort()
  }, [exams])

  const filtered = useMemo(() => {
    if (!exams) return []
    const nq = q.trim().toLowerCase()
    if (!nq) return exams
    return exams.filter((e) => e.title.toLowerCase().includes(nq) || e.category.toLowerCase().includes(nq) || e.results.some((r) => r.marker.toLowerCase().includes(nq)))
  }, [exams, q])

  const setRow = (i: number, patch: Partial<ExamResult>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const save = async () => {
    if (!user || saving || !form.title.trim()) return
    setSaving(true)
    try {
      const validRows = rows.filter((r) => r.marker.trim() && !Number.isNaN(Number(r.value)))
      await addExam(user.id, { title: form.title.trim(), category: form.category, date: form.date, notes: form.notes.trim() || undefined }, validRows, file ?? undefined)
      setForm({ title: '', category: 'Sangue', date: new Date().toISOString().slice(0, 10), notes: '' })
      setRows([{ marker: '', value: 0 } as ExamResult]); setFile(null); setOpen(false)
      setFlash('Exame registrado!'); setTimeout(() => setFlash(''), 1500); load()
    } catch { setFlash('Erro ao salvar exame'); setTimeout(() => setFlash(''), 2000) } finally { setSaving(false) }
  }

  const openFile = async (path: string) => {
    const url = await examFileUrl(path)
    if (url) window.open(url, '_blank')
  }

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-32">
        <ScreenHeader title="Exames" />

        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar exame ou biomarcador…"
          className="w-full bg-white border rounded-2xl px-4 py-2.5 text-[14px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />

        {/* Evolução */}
        {allMarkers.length > 0 && (
          <div style={card} className="p-4 mt-3">
            <div className="text-[13px] font-bold mb-2" style={{ color: T.text }}>📈 Evolução laboratorial</div>
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {allMarkers.map((m) => (
                <button key={m} onClick={() => setEvoMarker(evoMarker === m ? null : m)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition"
                  style={evoMarker === m ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{m}</button>
              ))}
            </div>
            {evoMarker && <div className="mt-2"><MarkerChart data={evoData} /></div>}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 mb-2 px-1">
          <h3 className="font-semibold" style={{ color: T.text }}>Meus exames</h3>
          {!open && <button onClick={() => setOpen(true)} className="text-[13px] font-bold px-3.5 py-1.5 rounded-full text-white active:scale-95 transition" style={{ background: T.teal }}>+ Exame</button>}
        </div>

        {/* Novo exame */}
        {open && (
          <div style={card} className="p-4 mb-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nome do exame (ex: Hemograma completo)"
              className="w-full bg-white border rounded-2xl px-4 py-2.5 mb-2 text-[14px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
            <div className="flex gap-2 mb-2">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="flex-1 bg-white border rounded-2xl px-3 py-2.5 text-[13px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }}>
                {EXAM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-white border rounded-2xl px-3 py-2.5 text-[13px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
            </div>

            <p className="text-[11px] font-semibold mt-3 mb-1.5" style={{ color: T.sub }}>Biomarcadores (valor + faixa de referência)</p>
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-1.5 mb-1.5">
                <input value={r.marker} onChange={(e) => setRow(i, { marker: e.target.value })} placeholder="Marcador (ex: Glicose)"
                  className="col-span-4 bg-white border rounded-xl px-2 py-2 text-[12px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
                <input type="number" value={r.value || ''} onChange={(e) => setRow(i, { value: parseFloat(e.target.value) || 0 })} placeholder="Valor"
                  className="col-span-2 bg-white border rounded-xl px-2 py-2 text-[12px] text-center outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
                <input value={r.unit || ''} onChange={(e) => setRow(i, { unit: e.target.value })} placeholder="un."
                  className="col-span-2 bg-white border rounded-xl px-2 py-2 text-[12px] text-center outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
                <input type="number" value={r.ref_min ?? ''} onChange={(e) => setRow(i, { ref_min: e.target.value === '' ? null : parseFloat(e.target.value) })} placeholder="mín"
                  className="col-span-2 bg-white border rounded-xl px-2 py-2 text-[12px] text-center outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
                <input type="number" value={r.ref_max ?? ''} onChange={(e) => setRow(i, { ref_max: e.target.value === '' ? null : parseFloat(e.target.value) })} placeholder="máx"
                  className="col-span-2 bg-white border rounded-xl px-2 py-2 text-[12px] text-center outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />
              </div>
            ))}
            <div className="flex gap-2 mb-2">
              <button onClick={() => setRows((rs) => [...rs, { marker: '', value: 0 } as ExamResult])} className="text-[12px] font-semibold" style={{ color: T.teal }}>+ marcador</button>
              {rows.length > 1 && <button onClick={() => setRows((rs) => rs.slice(0, -1))} className="text-[12px]" style={{ color: '#DC2626' }}>− remover último</button>}
            </div>

            <label className="block mb-2">
              <span className="text-[11px] font-semibold" style={{ color: T.sub }}>📎 PDF do exame (opcional)</span>
              <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-[12px] mt-1" style={{ color: T.sub }} />
            </label>

            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações (opcional)"
              className="w-full bg-white border rounded-2xl px-4 py-2.5 mb-3 text-[13px] outline-none" style={{ borderColor: '#EDF2F7', color: T.text }} />

            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold" style={{ background: '#EEF1F5', color: T.sub }}>Cancelar</button>
              <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-2xl font-bold text-white text-[14px] disabled:opacity-50" style={{ background: T.teal }}>{saving ? 'Salvando…' : 'Salvar exame'}</button>
            </div>
          </div>
        )}

        {exams === null ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p>
          : filtered.length === 0 ? (
            <div style={card} className="p-6 text-center">
              <div className="text-[32px]">🧪</div>
              <p className="text-[13px] mt-1" style={{ color: T.sub }}>{q ? `Nenhum exame encontrado para "${q}"` : 'Nenhum exame registrado ainda.'}</p>
            </div>
          ) : filtered.map((e) => {
            const expanded = expandId === e.id
            const flags = e.results.filter((r) => resultStatus(r) === 'low' || resultStatus(r) === 'high').length
            return (
              <div key={e.id} style={card} className="p-4 mb-2.5">
                <button onClick={() => setExpandId(expanded ? null : e.id)} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold truncate" style={{ color: T.text }}>{e.title}</div>
                      <div className="text-[11px]" style={{ color: T.sub }}>{e.category} · {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')} · {e.results.length} marcador{e.results.length !== 1 ? 'es' : ''}</div>
                    </div>
                    {flags > 0
                      ? <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: 'rgba(220,38,38,0.10)', color: '#DC2626' }}>{flags} fora</span>
                      : e.results.length > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: 'rgba(18,201,138,0.12)', color: '#0E9F6E' }}>✓ ok</span>}
                    <span className="ml-2" style={{ color: '#CBD5E1' }}>{expanded ? '▴' : '▾'}</span>
                  </div>
                </button>

                {expanded && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                    {e.results.map((r, i) => {
                      const st = ST[resultStatus(r)]
                      return (
                        <div key={i} className="flex items-center justify-between py-1.5">
                          <span className="text-[13px]" style={{ color: T.text }}>{r.marker}</span>
                          <span className="text-[12px] text-right">
                            <b style={{ color: T.text }}>{r.value}</b> <span style={{ color: T.sub }}>{r.unit || ''}</span>
                            <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                          </span>
                        </div>
                      )
                    })}
                    {e.notes && <p className="text-[11px] mt-2" style={{ color: '#94A3B8' }}>📝 {e.notes}</p>}
                    <div className="flex gap-2 mt-3">
                      {e.file_path && <button onClick={() => openFile(e.file_path!)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold" style={{ background: '#EEF1F5', color: T.text }}>📎 Abrir PDF</button>}
                      <button onClick={async () => { if (user) { await deleteExam(user.id, e.id).catch(() => {}); load() } }} className="px-4 py-2 rounded-xl text-[12px] font-semibold" style={{ background: '#FEF2F2', color: '#DC2626' }}>Excluir</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

        {flash && <div className="fixed bottom-24 inset-x-0 flex justify-center z-40"><span className="px-4 py-2 rounded-full text-[13px] font-semibold text-white" style={{ background: '#0F172A' }}>{flash}</span></div>}
      </div>
    </div>
  )
}
