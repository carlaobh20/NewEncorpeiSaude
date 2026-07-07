import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getProfileName } from '../lib/db'

type P = { className?: string }
const S = (p: P, d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className={p.className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const IcHome = (p: P) => S(p, <path d="M3 11l9-7 9 7M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />)
const IcBody = (p: P) => S(p, <><circle cx="12" cy="5" r="2.5" /><path d="M12 7.5v6M7 10.5c3 1.4 7 1.4 10 0M12 13.5l-2.5 7M12 13.5l2.5 7" /></>)
const IcFork = (p: P) => S(p, <><path d="M7 3v7a2 2 0 0 0 2 2v9M7 3v4M9 3v4M15 3c-1.5 1-2 3-2 5s1 3 3 3v9" /></>)
const IcDumbbell = (p: P) => S(p, <path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" />)
const IcCalendar = (p: P) => S(p, <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>)
const IcFlask = (p: P) => S(p, <><path d="M10 3v6l-5.2 8.7A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-3.3L14 9V3" /><path d="M8.5 3h7M8 15h8" /></>)
const IcChat = (p: P) => S(p, <path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.8A8 8 0 1 1 21 12Z" />)
const IcChart = (p: P) => S(p, <><path d="M4 20V6M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>)
const IcSteth = (p: P) => S(p, <><path d="M5 3v6a5 5 0 0 0 10 0V3" /><path d="M10 14v2a5 5 0 0 0 10 0v-1" /><circle cx="20" cy="12" r="2" /></>)
const IcPlus = (p: P) => S(p, <path d="M12 5v14M5 12h14" />)

type NavItem = { to: string; label: string; Icon: (p: P) => JSX.Element; exact?: boolean }

const MAIN: NavItem[] = [
  { to: '/', label: 'Início', Icon: IcHome, exact: true },
  { to: '/corpo', label: 'Corpo', Icon: IcBody },
  { to: '/corpo/nutricao', label: 'Nutrição', Icon: IcFork },
  { to: '/musculacao', label: 'Treino', Icon: IcDumbbell },
  { to: '/agenda', label: 'Agenda', Icon: IcCalendar },
  { to: '/exames', label: 'Exames', Icon: IcFlask },
]
const CARE: NavItem[] = [
  { to: '/consultas', label: 'Consultas & Chat', Icon: IcChat },
  { to: '/painel', label: 'Meu Painel', Icon: IcChart },
  { to: '/pro', label: 'Área do Profissional', Icon: IcSteth },
]

export default function Sidebar() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [name, setName] = useState('')

  useEffect(() => {
    if (user && supabaseReady) getProfileName(user.id).then((n) => setName(n || user.email?.split('@')[0] || '')).catch(() => {})
  }, [user])

  const isActive = (it: NavItem) => {
    if (it.exact) return pathname === it.to
    if (it.to === '/corpo') return pathname === '/corpo' || (pathname.startsWith('/corpo/') && pathname !== '/corpo/nutricao')
    return pathname.startsWith(it.to)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col"
      style={{
        width: 248,
        background: 'linear-gradient(178deg, #0B1220 0%, #0D1526 55%, #0B1730 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '8px 0 40px rgba(2,6,23,0.25)',
      }}>
      {/* brilho decorativo */}
      <div className="pointer-events-none absolute -top-20 -left-24 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(46,230,198,0.14), transparent 65%)' }} />

      {/* logo */}
      <button onClick={() => nav('/')} className="relative flex items-center gap-2 px-6 pt-7 pb-6">
        <span style={{ fontFamily: 'Georgia,serif' }} className="text-3xl lowercase leading-none" >
          <span style={{ color: '#2EE6C6' }}>e</span>
        </span>
        <span className="font-semibold text-[17px] tracking-tight text-white">encorpei</span>
        <span className="text-[8.5px] font-bold uppercase tracking-[0.14em] px-1.5 py-[3px] rounded ml-0.5" style={{ background: 'rgba(46,230,198,0.12)', color: '#2EE6C6', border: '1px solid rgba(46,230,198,0.25)' }}>saúde</span>
      </button>

      {/* registrar */}
      <div className="relative px-4 pb-3">
        <button onClick={() => nav('/registrar')}
          className="w-full flex items-center justify-center gap-2 py-[11px] rounded-xl font-semibold text-[13.5px] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#2EE6C6,#12C98A)', color: '#04211A', boxShadow: '0 8px 24px -8px rgba(46,230,198,0.5), inset 0 1px 0 rgba(255,255,255,0.35)' }}>
          <IcPlus className="w-4 h-4" /> Registrar agora
        </button>
      </div>

      {/* navegação */}
      <nav className="relative flex-1 overflow-y-auto px-3.5 py-2 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] px-3.5 pt-2 pb-1.5" style={{ color: 'rgba(148,163,184,0.55)' }}>Meu dia</p>
        {MAIN.map((it) => {
          const on = isActive(it)
          return (
            <button key={it.to} onClick={() => nav(it.to)}
              className="w-full flex items-center gap-3 px-3.5 py-[9px] rounded-xl text-left transition-all duration-200 hover:bg-white/[0.04]"
              style={on ? { background: 'linear-gradient(90deg, rgba(46,230,198,0.13), rgba(46,230,198,0.02))', boxShadow: 'inset 2px 0 0 #2EE6C6' } : {}}>
              <span style={{ color: on ? '#2EE6C6' : 'rgba(148,163,184,0.8)' }}><it.Icon className="w-[18px] h-[18px]" /></span>
              <span className="text-[13px]" style={{ color: on ? '#F0FDFA' : 'rgba(203,213,225,0.75)', fontWeight: on ? 600 : 450, letterSpacing: '0.01em' }}>{it.label}</span>
            </button>
          )
        })}
        <div className="mx-3.5 my-3" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] px-3.5 pb-1.5" style={{ color: 'rgba(148,163,184,0.55)' }}>Cuidado</p>
        {CARE.map((it) => {
          const on = isActive(it)
          return (
            <button key={it.to} onClick={() => nav(it.to)}
              className="w-full flex items-center gap-3 px-3.5 py-[9px] rounded-xl text-left transition-all duration-200 hover:bg-white/[0.04]"
              style={on ? { background: 'linear-gradient(90deg, rgba(46,230,198,0.13), rgba(46,230,198,0.02))', boxShadow: 'inset 2px 0 0 #2EE6C6' } : {}}>
              <span style={{ color: on ? '#2EE6C6' : 'rgba(148,163,184,0.8)' }}><it.Icon className="w-[18px] h-[18px]" /></span>
              <span className="text-[13px]" style={{ color: on ? '#F0FDFA' : 'rgba(203,213,225,0.75)', fontWeight: on ? 600 : 450, letterSpacing: '0.01em' }}>{it.label}</span>
            </button>
          )
        })}
      </nav>

      {/* usuário */}
      <button onClick={() => nav('/perfil')}
        className="relative flex items-center gap-3 mx-4 mb-5 px-3 py-3 rounded-2xl transition-all duration-200 hover:bg-white/[0.06]"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0"
          style={{ background: 'linear-gradient(135deg,#2EE6C6,#12C98A)', color: '#04211A', boxShadow: '0 0 0 2px rgba(46,230,198,0.2)' }}>
          {(name || 'E').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[13px] font-semibold text-white truncate">{name || 'Meu perfil'}</div>
          <div className="text-[10px]" style={{ color: 'rgba(148,163,184,0.7)' }}>Plano de cuidado ativo</div>
        </div>
        <span style={{ color: 'rgba(148,163,184,0.5)' }}>›</span>
      </button>
    </aside>
  )
}
