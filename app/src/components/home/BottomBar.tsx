import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HomeI, Plus } from './Icons'

const Dumbbell = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" /></svg>
)
const Body = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.5" /><path d="M12 7.5v6M7 10.5c3 1.4 7 1.4 10 0M12 13.5l-2.5 7M12 13.5l2.5 7" /></svg>
)
const Calendar = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
)

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(22px) saturate(180%)',
  WebkitBackdropFilter: 'blur(22px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.65)',
  boxShadow: '0 10px 34px rgba(15,23,42,0.14), inset 0 1px 0 rgba(255,255,255,0.8)',
}

const MENU = [
  { emoji: '⚡', label: 'Registrar rápido', sub: 'Peso, refeição, água, sono…', to: '/registrar' },
  { emoji: '🧪', label: 'Exames', sub: 'Biomarcadores e evolução laboratorial', to: '/exames' },
  { emoji: '🩺', label: 'Painel Médico', sub: 'Visão completa para o profissional', to: '/painel' },
  { emoji: '📅', label: 'Consultas & Chat', sub: 'Agende e fale com médico ou personal', to: '/consultas' },
]

export default function BottomBar() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)

  const items = [
    { key: 'home', label: 'Início', Icon: HomeI, to: '/' },
    { key: 'corpo', label: 'Corpo', Icon: Body, to: '/corpo' },
    { key: 'agenda', label: 'Agenda', Icon: Calendar, to: '/agenda' },
    { key: 'treino', label: 'Treino', Icon: Dumbbell, to: '/musculacao' },
  ]
  const active = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  const Tab = ({ it }: { it: typeof items[number] }) => {
    const on = active(it.to)
    return (
      <button onClick={() => { setMenu(false); nav(it.to) }} className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-14 transition active:scale-90" style={{ color: on ? '#0E9F6E' : '#8A94A3' }}>
        {on && <span className="absolute inset-x-2 inset-y-1 rounded-2xl" style={{ background: 'rgba(18,201,138,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }} />}
        <it.Icon className="w-6 h-6 relative" />
        <span className="text-[10px] font-medium relative">{it.label}</span>
      </button>
    )
  }

  return (
    <>
      {/* ── Menu do + ── */}
      {menu && (
        <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="absolute inset-x-0 bottom-0" onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
            <div className="max-w-md mx-auto px-4">
              <div className="rounded-[28px] p-2.5 space-y-1.5" style={{ background: '#fff', boxShadow: '0 -10px 40px rgba(15,23,42,0.25)' }}>
                {MENU.map((m) => (
                  <button key={m.to} onClick={() => { setMenu(false); nav(m.to) }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl text-left active:scale-[0.98] transition hover:bg-slate-50">
                    <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: '#F1F5F9' }}>{m.emoji}</span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-bold" style={{ color: '#0F172A' }}>{m.label}</span>
                      <span className="block text-[11px]" style={{ color: '#64748B' }}>{m.sub}</span>
                    </span>
                    <span style={{ color: '#CBD5E1' }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
        <div className="max-w-md mx-auto px-4 pointer-events-auto" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="relative flex items-center justify-around px-2 mt-3 rounded-[28px] h-16" style={glass}>
            <Tab it={items[0]} /><Tab it={items[1]} />
            <div className="w-16" />
            <Tab it={items[2]} /><Tab it={items[3]} />
            <button onClick={() => setMenu((m) => !m)} aria-label="Menu"
              className="absolute left-1/2 -translate-x-1/2 -top-6 rounded-full flex items-center justify-center text-white active:scale-90 transition"
              style={{ width: 58, height: 58, background: 'linear-gradient(160deg,#2EE6C6,#12C98A)', boxShadow: '0 10px 26px -6px rgba(18,201,138,0.7), inset 0 1px 0 rgba(255,255,255,0.5)', transform: menu ? 'translateX(-50%) rotate(45deg)' : 'translateX(-50%)' }}>
              <span className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.12)' }} />
              <Plus className="w-7 h-7 relative" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
