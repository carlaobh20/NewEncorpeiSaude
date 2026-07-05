import { T } from './tokens'
import type { Exercise } from '../../lib/musculacao'

export default function WorkoutExercise({ ex }: { ex: Exercise }) {
  const loads = ex.sets.map((s) => s.load)
  const carga = loads.every((l) => l === loads[0]) ? `${loads[0]} kg` : `${Math.max(...loads)} kg`
  const reps = ex.sets.map((s) => s.reps).join('-')
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center" style={{ background: '#0F172A' }}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#94A3B8" strokeWidth={1.7} strokeLinecap="round"><path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold truncate" style={{ color: T.text }}>{ex.name}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: '#EAFBF1', color: T.green }}>{ex.group}</span>
        </div>
        <div className="text-[12px] mt-0.5" style={{ color: T.sub }}>
          {ex.sets.length} séries · {carga} · {reps} reps · {ex.rest}
        </div>
      </div>
      <button className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[18px]" style={{ color: '#94A3B8' }}>⋯</button>
    </div>
  )
}
