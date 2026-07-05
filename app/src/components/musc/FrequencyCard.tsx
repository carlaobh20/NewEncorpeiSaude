import { T, cardStyle } from './tokens'
import VolumeChart from './VolumeChart'
import { useMusc } from '../../lib/MuscContext'

export function VolumeCard() {
  const { stats } = useMusc()
  const data = stats?.weekVolume ?? [{ d: 'Seg', kg: 0 }, { d: 'Ter', kg: 0 }, { d: 'Qua', kg: 0 }, { d: 'Qui', kg: 0 }, { d: 'Sex', kg: 0 }, { d: 'Sáb', kg: 0 }, { d: 'Dom', kg: 0 }]
  const total = data.reduce((a, x) => a + x.kg, 0)
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <div className="text-[12px]" style={{ color: T.sub }}>Volume da semana</div>
      <div className="text-[22px] font-bold mt-0.5" style={{ color: T.text }}>{total.toLocaleString('pt-BR')}<span className="text-[13px] font-medium" style={{ color: T.sub }}> kg</span></div>
      {total === 0 && <div className="text-[11px]" style={{ color: T.sub }}>Registre um treino pra ver seu volume</div>}
      <div className="mt-3"><VolumeChart data={data} /></div>
    </div>
  )
}

export function FrequencyCard() {
  const { stats, routines } = useMusc()
  const goal = 5
  const done = stats?.freqDays ?? 0
  const keys = routines.slice(0, 5).map((r) => r.key)
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <div className="text-[12px]" style={{ color: T.sub }}>Frequência</div>
      <div className="text-[22px] font-bold mt-0.5" style={{ color: T.text }}>{done} / {goal} dias</div>
      <div className="text-[11px]" style={{ color: T.sub }}>Meta semanal</div>
      <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: T.lightGray }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (done / goal) * 100)}%`, background: T.green }} />
      </div>
      <div className="mt-3 flex gap-1.5">
        {(keys.length ? keys : ['A', 'B', 'C', 'D', 'E']).map((k, i) => (
          <div key={i} className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold" style={{ background: T.lightGray, color: '#94A3B8' }}>{k}</div>
        ))}
      </div>
    </div>
  )
}
