import { useNavigate, useLocation } from 'react-router-dom'
import { HomeI, Plus, Sparkle, Grid } from './Icons'

const Dumbbell = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" /></svg>
)

export default function BottomBar() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const items = [
    { key: 'home', label: 'Início', Icon: HomeI, to: '/' },
    { key: 'treino', label: 'Treino', Icon: Dumbbell, to: '/musculacao' },
    { key: 'coach', label: 'IA Coach', Icon: Sparkle, to: '/coach' },
    { key: 'perfil', label: 'Perfil', Icon: Grid, to: '/perfil' },
  ]
  const active = (to: string) => to === '/' ? pathname === '/' : pathname.startsWith(to)
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 pointer-events-none">
      <div className="max-w-md mx-auto px-4 pointer-events-auto" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', paddingTop: 0 }}>
        <div className="relative bg-white/90 backdrop-blur-xl border border-[#EDF2F7] rounded-[26px] shadow-[0_8px_30px_-8px_rgba(15,23,42,0.15)] h-16 mt-3 flex items-center justify-around px-2">
          {items.slice(0, 2).map(({ key, label, Icon, to }) => (
            <button key={key} onClick={() => nav(to)} className={`flex flex-col items-center gap-0.5 w-16 transition ${active(to) ? 'text-emerald-600' : 'text-slate-400'}`}>
              <Icon className="w-6 h-6" /><span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
          <div className="w-16" />
          {items.slice(2).map(({ key, label, Icon, to }) => (
            <button key={key} onClick={() => nav(to)} className={`flex flex-col items-center gap-0.5 w-16 transition ${active(to) ? 'text-emerald-600' : 'text-slate-400'}`}>
              <Icon className="w-6 h-6" /><span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
          <button onClick={() => nav('/registrar')} aria-label="Registrar" className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.6)] flex items-center justify-center text-white active:scale-90 transition">
            <Plus className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  )
}
