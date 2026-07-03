import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { iconMap } from '../components/home/ica'
import { tones } from '../lib/homeData'

const grid = [
  { label: 'Peso', icon: 'scale', tone: 'emerald', to: '/m/peso' },
  { label: 'Treino', icon: 'dumbbell', tone: 'emerald', to: '/m/treino' },
  { label: 'Refeição', icon: 'fork', tone: 'orange', to: '/m/alimentacao' },
  { label: 'Água', icon: 'water', tone: 'sky', to: '/m/agua' },
  { label: 'Sono', icon: 'moon', tone: 'violet', to: '/m/sono' },
  { label: 'Foto', icon: 'camera', tone: 'rose', to: '/m/peso' },
  { label: 'Medicamento', icon: 'pill', tone: 'amber', to: '/m/alimentacao' },
  { label: 'Exame', icon: 'grid', tone: 'slate', to: '/insights' },
]

export default function Registrar() {
  const nav = useNavigate()
  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title="Registrar agora" />
      <p className="text-slate-500 text-sm mt-1 mb-5 px-1">O que você quer registrar? Um toque e pronto.</p>
      <div className="grid grid-cols-2 gap-3">
        {grid.map((g) => {
          const Icon = iconMap[g.icon]; const t = tones[g.tone]
          return (
            <button key={g.label} onClick={() => nav(g.to)}
              className="bg-white border border-[#ECEEF3] rounded-[22px] p-5 flex flex-col items-center gap-3 hover:border-emerald-300 active:scale-[0.97] transition shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <span className={`w-14 h-14 rounded-2xl ${t.bg} flex items-center justify-center`}>
                {Icon && <Icon className={`w-7 h-7 ${t.fg}`} />}
              </span>
              <span className="font-semibold text-slate-700">{g.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
