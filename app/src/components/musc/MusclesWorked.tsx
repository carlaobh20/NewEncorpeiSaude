import { T, cardStyle } from './tokens'
import { useMusc } from '../../lib/MuscContext'

const LABELS: Record<string, string> = {
  peito: 'Peito', ombro: 'Ombro', triceps: 'Tríceps', costas: 'Costas', biceps: 'Bíceps',
  perna: 'Pernas', panturrilha: 'Panturrilha', gluteo: 'Glúteos', core: 'Core',
}

export default function MusclesWorked() {
  const { routines } = useMusc()
  const muscles = routines[0]?.muscles ?? []
  if (!muscles.length) return null
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <h3 className="font-semibold text-[14px] mb-1" style={{ color: T.text }}>Músculos trabalhados</h3>
      <div className="text-[12px] mb-3" style={{ color: T.sub }}>No treino de hoje</div>
      <div className="flex flex-wrap gap-2">
        {muscles.map((m) => (
          <span key={m} className="text-[13px] font-semibold px-3 py-1.5 rounded-full" style={{ background: '#EAFBF1', color: T.green }}>
            {LABELS[m] ?? m}
          </span>
        ))}
      </div>
    </div>
  )
}
