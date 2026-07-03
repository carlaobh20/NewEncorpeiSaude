import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { Card } from '../components/home/Sections'
import { profile } from '../lib/homeData'

const rows = [
  { label: 'Meu nutricionista', value: 'Dr. Marcelo · hoje', to: '/coach' },
  { label: 'Metas e objetivos', value: 'Perder 5 kg', to: '/m/peso' },
  { label: 'Exames', value: '3 registrados', to: '/insights' },
  { label: 'Notificações', value: 'Ativadas', to: '/' },
  { label: 'Privacidade e dados', value: 'LGPD', to: '/' },
]

export default function Perfil() {
  const nav = useNavigate()
  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title="Perfil" />
      <div className="flex items-center gap-4 py-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 flex items-center justify-center text-white text-2xl font-bold">C</div>
        <div>
          <div className="text-xl font-bold text-slate-900">{profile.name}</div>
          <div className="text-slate-500 text-sm">Evoluiu {profile.evolution30d}% nos últimos 30 dias</div>
        </div>
      </div>
      <Card className="p-2">
        <div className="divide-y divide-[#F2F4F8]">
          {rows.map((r) => (
            <button key={r.label} onClick={() => nav(r.to)} className="w-full flex items-center justify-between px-3 py-3.5 text-left">
              <span className="text-slate-700 font-medium">{r.label}</span>
              <span className="flex items-center gap-2 text-slate-400 text-sm">{r.value}
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
