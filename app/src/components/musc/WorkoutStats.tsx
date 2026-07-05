import { T, cardStyle } from './tokens'
import { useMusc } from '../../lib/MuscContext'

export default function WorkoutStats() {
  const { stats } = useMusc()
  const l = stats?.last
  if (!l) return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <h3 className="font-semibold text-[14px]" style={{ color: T.text }}>Último treino</h3>
      <div className="text-[13px] mt-2" style={{ color: T.sub }}>Nenhum treino registrado ainda. Quando você finalizar um treino, ele aparece aqui.</div>
    </div>
  )
  const cells = [['Volume', `${l.volume.toLocaleString('pt-BR')} kg`], ['Duração', `${l.durationMin} min`], ['Exercícios', String(l.exercises)], ['Séries', String(l.series)], ['Calorias', `${l.calories} kcal`]]
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-[14px]" style={{ color: T.text }}>Último treino <span className="font-normal text-[13px]" style={{ color: T.sub }}>· {l.name}</span></h3>
        <span className="text-[11px]" style={{ color: T.sub }}>{l.date}</span>
      </div>
      <div className="grid grid-cols-5 gap-1 text-center">
        {cells.map(([lab, v]) => (
          <div key={lab}><div className="text-[14px] font-bold" style={{ color: T.text }}>{v}</div><div className="text-[10px]" style={{ color: T.sub }}>{lab}</div></div>
        ))}
      </div>
    </div>
  )
}
