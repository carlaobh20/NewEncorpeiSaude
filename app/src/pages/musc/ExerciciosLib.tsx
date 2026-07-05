import { useEffect, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchRoutines, type DBExercise } from '../../lib/training'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784' }
const card = { background: '#fff', borderRadius: 16, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function ExerciciosLib() {
  const { user } = useAuth()
  const [exs, setExs] = useState<DBExercise[] | null>(null)
  useEffect(() => {
    if (user && supabaseReady) fetchRoutines(user.id).then((rs) => {
      const all = rs.flatMap((r) => r.exercises); const seen = new Set<string>()
      setExs(all.filter((e) => (seen.has(e.name) ? false : (seen.add(e.name), true))))
    }).catch(() => setExs([])); else setExs([])
  }, [user])
  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-[440px] mx-auto px-4 pb-24">
        <ScreenHeader title="Exercícios" />
        {exs === null ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p> : (
          <div className="grid grid-cols-2 gap-2.5">
            {exs.map((e) => (
              <div key={e.id} style={card} className="p-3">
                <div className="w-full aspect-[4/3] rounded-xl mb-2 flex items-center justify-center" style={{ background: '#0F172A' }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={T.green} strokeWidth={1.7}><path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" /></svg>
                </div>
                <div className="text-[13px] font-semibold leading-tight" style={{ color: T.text }}>{e.name}</div>
                <div className="text-[11px] mt-0.5" style={{ color: T.sub }}>{e.muscle} · {e.target_sets}x{e.target_reps}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
