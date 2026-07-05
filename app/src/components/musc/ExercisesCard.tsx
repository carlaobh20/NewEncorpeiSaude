import { T, cardStyle } from './tokens'
import { useMusc } from '../../lib/MuscContext'

export default function ExercisesCard() {
  const { routines } = useMusc()
  const r = routines[0]
  if (!r) return null
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold text-[14px]" style={{ color: T.text }}>Exercícios · {r.name.replace(/^Treino \w+ · /, '')}</h3>
        <span className="text-[12px]" style={{ color: T.sub }}>{r.exercises.length}</span>
      </div>
      <div className="divide-y" style={{ borderColor: T.border }}>
        {r.exercises.map((e) => (
          <div key={e.id} className="flex items-center gap-3 py-2.5 border-t first:border-t-0" style={{ borderColor: T.border }}>
            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: '#0F172A' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={T.green} strokeWidth={1.7}><path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{e.name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: '#EAFBF1', color: T.green }}>{e.muscle}</span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: T.sub }}>{e.target_sets} séries · {e.target_reps} reps · {e.rest_sec}s</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
