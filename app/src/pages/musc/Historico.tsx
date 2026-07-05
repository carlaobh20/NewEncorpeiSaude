import { useEffect, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchSessions, type SessionRow } from '../../lib/muscExtra'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784' }
const card = { background: '#fff', borderRadius: 20, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function Historico() {
  const { user } = useAuth()
  const [rows, setRows] = useState<SessionRow[] | null>(null)
  useEffect(() => { if (user && supabaseReady) fetchSessions(user.id).then(setRows).catch(() => setRows([])); else setRows([]) }, [user])
  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-[440px] mx-auto px-4 pb-24">
        <ScreenHeader title="Histórico" />
        {rows === null ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p>
          : rows.length === 0 ? <p className="text-center py-10 text-sm" style={{ color: T.sub }}>Nenhum treino registrado ainda.</p>
          : <div className="space-y-2.5">
              {rows.map((s) => (
                <div key={s.id} style={card} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: T.text }}>{s.name}</div>
                    <div className="text-[12px]" style={{ color: T.sub }}>{s.date} · {s.durationMin} min · {s.series} séries</div>
                  </div>
                  <div className="text-right"><div className="text-[15px] font-bold" style={{ color: T.green }}>{s.volume.toLocaleString('pt-BR')}</div><div className="text-[10px]" style={{ color: T.sub }}>kg volume</div></div>
                </div>
              ))}
            </div>}
      </div>
    </div>
  )
}
