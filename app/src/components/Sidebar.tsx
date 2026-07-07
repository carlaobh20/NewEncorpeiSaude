import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getProfileName } from '../lib/db'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }

type NavItem = { to: string; label: string; emoji: string; exact?: boolean }

const MAIN: NavItem[] = [
  { to: '/', label: 'Início', emoji: '🏠', exact: true },
  { to: '/corpo', label: 'Corpo', emoji: '🧍' },
  { to: '/corpo/nutricao', label: 'Nutrição', emoji: '🍽️' },
  { to: '/musculacao', label: 'Treino', emoji: '🏋️' },
  { to: '/agenda', label: 'Agenda', emoji: '📅' },
  { to: '/exames', label: 'Exames', emoji: '🧪' },
]
const CARE: NavItem[] = [
  { to: '/consultas', label: 'Consultas & Chat', emoji: '💬' },
  { to: '/painel', label: 'Meu Painel', emoji: '📊' },
  { to: '/pro', label: 'Área do Profissional', emoji: '🩺' },
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

  const Item = ({ it }: { it: NavItem }) => {
    const on = isActive(it)
    return (
      <button onClick={() => nav(it.to)}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition active:scale-[0.98]"
        style={on
          ? { background: 'linear-gradient(135deg, rgba(46,230,198,0.16), rgba(18,201,138,0.12))', boxShadow: 'inset 0 0 0 1px rgba(18,201,138,0.25)' }
          : {}}>
        <span className="text-[18px] w-6 text-center">{it.emoji}</span>
        <span className="text-[13.5px] font-semibold" style={{ color: on ? '#0E9F6E' : T.text }}>{it.label}</span>
        {on && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#12C98A' }} />}
      </button>
    )
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col" style={{ width: 248, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(24px) saturate(160%)', borderRight: '1px solid rgba(15,23,42,0.06)' }}>
      {/* logo */}
      <button onClick={() => nav('/')} className="flex items-center gap-2 px-6 pt-6 pb-4">
        <span style={{ fontFamily: 'Georgia,serif' }} className="text-emerald-500 text-3xl lowercase leading-none">e</span>
        <span className="font-semibold text-[18px] tracking-tight" style={{ color: T.text }}>encorpei</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md ml-1" style={{ background: 'rgba(18,201,138,0.12)', color: '#0E9F6E' }}>saúde</span>
      </button>

      {/* registrar */}
      <div className="px-4 pb-2">
        <button onClick={() => nav('/registrar')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white text-[14px] active:scale-[0.98] transition"
          style={{ background: 'linear-gradient(160deg,#2EE6C6,#12C98A)', boxShadow: '0 10px 24px -8px rgba(18,201,138,0.6)' }}>
          <span className="text-[16px]">＋</span> Registrar
        </button>
      </div>

      {/* navegação */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 pt-2 pb-1" style={{ color: '#94A3B8' }}>Meu dia</p>
        {MAIN.map((it) => <Item key={it.to} it={it} />)}
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 pt-4 pb-1" style={{ color: '#94A3B8' }}>Cuidado</p>
        {CARE.map((it) => <Item key={it.to} it={it} />)}
      </div>

      {/* usuário */}
      <button onClick={() => nav('/perfil')} className="flex items-center gap-3 mx-4 mb-5 px-3.5 py-3 rounded-2xl transition active:scale-[0.98]" style={{ background: '#0F172A' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0" style={{ background: 'linear-gradient(135deg,#2EE6C6,#12C98A)' }}>
          {(name || 'E').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[13px] font-bold text-white truncate">{name || 'Meu perfil'}</div>
          <div className="text-[10px]" style={{ color: '#94A3B8' }}>ver perfil ›</div>
        </div>
      </button>
    </aside>
  )
}
