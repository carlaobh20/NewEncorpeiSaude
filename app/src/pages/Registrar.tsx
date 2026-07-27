import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { iconMap } from '../components/home/ica'
import { T } from '../lib/theme'

// Cada atalho aqui precisa apontar para uma tela real que existe e persiste
// no banco — nada de rota "provisória" (isso era parte do problema: Foto e
// Medicamento apontavam para telas que não tinham nada a ver).
const grid = [
  { label: 'Peso', icon: 'scale', to: '/m/peso' },
  { label: 'Treino', icon: 'dumbbell', to: '/musculacao' },
  { label: 'Refeição', icon: 'fork', to: '/corpo/nutricao' },
  { label: 'Água', icon: 'water', to: '/corpo/agua' },
  { label: 'Sono', icon: 'moon', to: '/corpo/sono' },
  { label: 'Suplementos', icon: 'pill', to: '/corpo/suplementos' },
  { label: 'Como me sinto', icon: 'grid', to: '/sintomas' },
  { label: 'Meu plano', icon: 'grid', to: '/meu-plano' },
  { label: 'Jejum', icon: 'moon', to: '/corpo/jejum' },
  { label: 'Exame', icon: 'grid', to: '/exames' },
  { label: 'Agenda', icon: 'grid', to: '/agenda' },
]

export default function Registrar() {
  const nav = useNavigate()
  return (
    <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-28">
      <ScreenHeader title="Registrar agora" />
      <p className="text-[13px] mt-1 mb-4 px-1" style={{ color: T.sub }}>O que você quer registrar? Um toque e pronto.</p>
      <div className="grid grid-cols-3 gap-2.5">
        {grid.map((g) => {
          const Icon = iconMap[g.icon]
          return (
            <button key={g.label} onClick={() => nav(g.to)}
              className="rounded-2xl p-3.5 flex flex-col items-center gap-2 active:scale-[0.96] transition"
              style={{ background: '#fff', border: `1px solid ${T.line}` }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: T.chip, color: T.tealDark }}>
                {Icon && <Icon className="w-5 h-5" />}
              </span>
              <span className="text-[12px] font-medium text-center leading-tight" style={{ color: T.text }}>{g.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
