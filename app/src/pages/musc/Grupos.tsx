import { useEffect, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchRoutines } from '../../lib/training'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784' }
const card = { background: '#fff', borderRadius: 18, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function Grupos() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Record<string, string[]> | null>(null)
  useEffect(() => {
    if (user && supabaseReady) fetchRoutines(user.id).then((rs) => {
      const g: Record<string, string[]> = {}
      rs.flatMap((r) => r.exercises).forEach((e) => { (g[e.muscle] ||= []).push(e.name) })
      Object.keys(g).forEach((k) => { g[k] = [...new Set(g[k])] })
      setGroups(g)
    }).catch(() => setGroups({})); else setGroups({})
  }, [user])
  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-[440px] md:max-w-2xl mx-auto px-4 pb-24">
        <ScreenHeader title="Grupos musculares" />
        {groups === null ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p> : (
          <div className="space-y-2.5">
            {Object.entries(groups).map(([m, list]) => (
              <div key={m} style={card} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] font-semibold" style={{ color: T.text }}>{m}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EAFBF1', color: T.green }}>{list.length} exercícios</span>
                </div>
                <div className="text-[12px]" style={{ color: T.sub }}>{list.join(' · ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
