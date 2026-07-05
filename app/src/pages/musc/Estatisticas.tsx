import { useEffect, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchTrainingStats, type TrainingStats } from '../../lib/training'
import { fetchSessions, type SessionRow } from '../../lib/muscExtra'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784' }
const card = { background: '#fff', borderRadius: 20, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function Estatisticas() {
  const { user } = useAuth()
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  useEffect(() => { if (user && supabaseReady) { fetchTrainingStats(user.id).then(setStats).catch(() => {}); fetchSessions(user.id).then(setSessions).catch(() => {}) } }, [user])
  const last10 = [...sessions].reverse().slice(-10)
  const max = Math.max(...last10.map((s) => s.volume), 1)
  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-[440px] mx-auto px-4 pb-24">
        <ScreenHeader title="Estatísticas" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[['Volume 30d', `${(stats?.volumeTotal ?? 0).toLocaleString('pt-BR')} kg`], ['Treinos 30d', String(stats?.sessions ?? 0)], ['Carga média', `${stats?.avgLoad ?? 0} kg`], ['Recorde', `${stats?.maxLoad ?? 0} kg`]].map(([l, v]) => (
            <div key={l} style={card} className="p-4"><div className="text-[11px]" style={{ color: T.sub }}>{l}</div><div className="text-[18px] font-bold" style={{ color: T.text }}>{v}</div></div>
          ))}
        </div>
        <div style={card} className="p-5">
          <div className="font-semibold mb-3 text-[14px]" style={{ color: T.text }}>Volume por treino</div>
          {last10.length === 0 ? <div className="text-[12px] text-center py-6" style={{ color: T.sub }}>Registre treinos pra ver a evolução.</div> : (
            <div className="flex items-end gap-1.5 h-32">
              {last10.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-md" style={{ height: `${(s.volume / max) * 100}%`, minHeight: 6, background: 'linear-gradient(180deg,#34d399,#16C784)' }} />
                  <span className="text-[9px]" style={{ color: T.sub }}>{s.date.slice(0, 5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
