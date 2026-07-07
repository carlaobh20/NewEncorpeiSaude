import { useNavigate, useLocation } from 'react-router-dom'
import { HomeI, Plus, Sparkle, Grid } from './Icons'

const Dumbbell = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" /></svg>
)

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(22px) saturate(180%)',
  WebkitBackdropFilter: 'blur(22px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.65)',
  boxShadow: '0 10px 34px rgba(15,23,42,0.14), inset 0 1px 0 rgba(255,255,255,0.8)',
}

export default function BottomBar() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const items = [
    { key: 'home', label: 'Início', Icon: HomeI, to: '/' },
    { key: 'treino', label: 'Treino', Icon: Dumbbell, to: '/musculacao' },
    { key: 'coach', label: 'IA Coach', Icon: Sparkle, to: '/coach' },
    { key: 'perfil', label: 'Perfil', Icon: Grid, to: '/perfil' },
  ]
  const active = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  const Tab = ({ it }: { it: typeof items[number] }) => {
    const on = active(it.to)
    return (
      <button onClick={() => nav(it.to)} className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-14 transition active:scale-90" style={{ color: on ? '#0E9F6E' : '#8A94A3' }}>
        {on && <span className="absolute inset-x-2 inset-y-1 rounded-2xl" style={{ background: 'rgba(18,201,138,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }} />}
        <it.Icon className="w-6 h-6 relative" />
        <span className="text-[10px] font-medium relative">{it.label}</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="max-w-md mx-auto px-4 pointer-events-auto" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="relative flex items-center justify-around px-2 mt-3 rounded-[28px] h-16" style={glass}>
          <Tab it={items[0]} /><Tab it={items[1]} />
          <div className="w-16" />
          <Tab it={items[2]} /><Tab it={items[3]} />
          <button onClick={() => nav('/registrar')} aria-label="Registrar"
            className="absolute left-1/2 -translate-x-1/2 -top-6 w-15 h-15 rounded-full flex items-center justify-center text-white active:scale-90 transition"
            style={{ width: 58, height: 58, background: 'linear-gradient(160deg,#2EE6C6,#12C98A)', boxShadow: '0 10px 26px -6px rgba(18,201,138,0.7), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
            <span className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.12)' }} />
            <Plus className="w-7 h-7 relative" />
          </button>
        </div>
      </div>
    </div>
  )
}
