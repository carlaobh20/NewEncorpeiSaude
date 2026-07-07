import { useEffect, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchSessions, type SessionRow } from '../../lib/muscExtra'
import { deleteSession } from '../../lib/monthActivity'
import { resetTrainingHistory } from '../../lib/trainingSmart'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function Historico() {
  const { user } = useAuth()
  const [rows, setRows] = useState<SessionRow[] | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = () => { if (user && supabaseReady) fetchSessions(user.id).then(setRows).catch(() => setRows([])); else setRows([]) }
  useEffect(load, [user])

  const del = async (id: string) => {
    if (!user || busy) return
    setBusy(true)
    try { await deleteSession(user.id, id); setConfirmId(null); load() } finally { setBusy(false) }
  }
  const delAll = async () => {
    if (!user || busy) return
    setBusy(true)
    try { await resetTrainingHistory(user.id); setConfirmAll(false); load() } finally { setBusy(false) }
  }

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div className="max-w-[440px] md:max-w-2xl mx-auto px-4 pb-24">
        <ScreenHeader title="Histórico" />
        {rows === null ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p>
          : rows.length === 0 ? <p className="text-center py-10 text-sm" style={{ color: T.sub }}>Nenhum treino registrado ainda.</p>
          : (
            <>
              <div className="space-y-2.5">
                {rows.map((s) => (
                  <div key={s.id} style={card} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold truncate" style={{ color: T.text }}>{s.name}</div>
                        <div className="text-[12px]" style={{ color: T.sub }}>{s.date} · {s.durationMin} min · {s.series} séries</div>
                      </div>
                      <div className="text-right mr-2">
                        <div className="text-[15px] font-bold" style={{ color: T.green }}>{s.volume.toLocaleString('pt-BR')}</div>
                        <div className="text-[10px]" style={{ color: T.sub }}>kg volume</div>
                      </div>
                      <button onClick={() => setConfirmId(confirmId === s.id ? null : s.id)} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition shrink-0" style={{ background: '#FEF2F2', color: '#DC2626' }} aria-label="Excluir">
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
                      </button>
                    </div>
                    {confirmId === s.id && (
                      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #FEE2E2' }}>
                        <span className="text-[12px] font-semibold" style={{ color: '#B91C1C' }}>Excluir este treino?</span>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ background: '#F1F5F9', color: T.sub }}>Cancelar</button>
                          <button onClick={() => del(s.id)} disabled={busy} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-50" style={{ background: '#DC2626' }}>Excluir</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5">
                {!confirmAll ? (
                  <button onClick={() => setConfirmAll(true)} className="w-full py-3 rounded-2xl text-[13px] font-semibold" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                    🗑️ Apagar todo o histórico
                  </button>
                ) : (
                  <div style={{ ...card, border: '1px solid #FECACA' }} className="p-4">
                    <p className="text-[13px] font-bold" style={{ color: '#B91C1C' }}>⚠️ Apagar TODOS os {rows.length} treinos?</p>
                    <p className="text-[12px] mt-1" style={{ color: T.sub }}>Ação permanente. Seus treinos A–E e a academia continuam.</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setConfirmAll(false)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F9', color: T.sub }}>Cancelar</button>
                      <button onClick={delAll} disabled={busy} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-50" style={{ background: '#DC2626' }}>{busy ? 'Apagando…' : 'Sim, apagar tudo'}</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
      </div>
    </div>
  )
}
