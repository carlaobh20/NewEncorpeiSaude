import { T, cardStyle } from './tokens'
import { useMusc } from '../../lib/MuscContext'

export default function PerformanceCard() {
  const { stats } = useMusc()
  const cards = [
    { label: 'Volume total', value: `${(stats?.volumeTotal ?? 0).toLocaleString('pt-BR')} kg` },
    { label: 'Carga média', value: `${stats?.avgLoad ?? 0} kg` },
    { label: 'Treinos concluídos', value: String(stats?.sessions ?? 0) },
    { label: 'Recorde (maior carga)', value: `${stats?.maxLoad ?? 0} kg` },
  ]
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <h3 className="font-semibold text-[14px] mb-3" style={{ color: T.text }}>Performance <span className="text-[13px] font-normal" style={{ color: T.sub }}>(30 dias)</span></h3>
      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((p) => (
          <div key={p.label} className="rounded-2xl p-3" style={{ background: '#F6F8FC' }}>
            <div className="text-[11px] leading-tight" style={{ color: T.sub }}>{p.label}</div>
            <div className="text-[15px] font-bold mt-1" style={{ color: T.text }}>{p.value}</div>
          </div>
        ))}
      </div>
      {(!stats || stats.sessions === 0) && <div className="text-[11px] mt-2" style={{ color: T.sub }}>Ainda sem treinos registrados. Finalize um treino pra começar a medir.</div>}
    </div>
  )
}
