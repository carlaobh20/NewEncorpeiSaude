import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getProfileName } from '../lib/db'
import { listMyLinks } from '../lib/careLinks'
import { listExams } from '../lib/care'
import { T, card } from '../lib/theme'

export default function Perfil() {
  const nav = useNavigate()
  const { user, signOut } = useAuth()
  const [name, setName] = useState('')
  const [linked, setLinked] = useState<number | null>(null)
  const [exams, setExams] = useState<number | null>(null)

  useEffect(() => {
    if (!user || !supabaseReady) return
    getProfileName(user.id).then((n) => setName(n || user.email?.split('@')[0] || '')).catch(() => {})
    listMyLinks(user.id).then((l) => setLinked(l.filter((x) => x.status === 'active').length)).catch(() => setLinked(0))
    listExams(user.id).then((e) => setExams(e.length)).catch(() => setExams(0))
  }, [user])

  // Só rotas reais aqui. As duas últimas ainda não têm tela própria — melhor
  // dizer isso do que apontar para "/" e fingir que existe algo lá.
  const rows = [
    { label: 'Profissionais vinculados', value: linked === null ? '…' : `${linked}`, to: '/consultas' },
    { label: 'Peso e metas', value: 'Ver evolução', to: '/m/peso' },
    { label: 'Exames', value: exams === null ? '…' : `${exams} registrado${exams === 1 ? '' : 's'}`, to: '/exames' },
  ]
  const soon = [
    { label: 'Notificações' },
    { label: 'Privacidade e dados (LGPD)' },
  ]

  return (
    <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-28">
      <ScreenHeader title="Perfil" />
      <div className="flex items-center gap-3.5 py-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
          style={{ background: T.tealDark }}>{(name || 'E').charAt(0).toUpperCase()}</div>
        <div>
          <div className="text-[16px] font-bold" style={{ color: T.text }}>{name || 'Meu perfil'}</div>
          <div className="text-[13px]" style={{ color: T.sub }}>{user?.email}</div>
        </div>
      </div>

      <div style={card}>
        <div className="divide-y" style={{ borderColor: T.line }}>
          {rows.map((r) => (
            <button key={r.label} onClick={() => nav(r.to)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
              <span className="text-[13px] font-medium" style={{ color: T.text }}>{r.label}</span>
              <span className="flex items-center gap-2 text-[13px]" style={{ color: T.sub }}>
                {r.value}
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <div className="divide-y" style={{ borderColor: T.line }}>
          {soon.map((r) => (
            <div key={r.label} className="w-full flex items-center justify-between px-4 py-3.5">
              <span className="text-[13px] font-medium" style={{ color: T.mute }}>{r.label}</span>
              <span className="text-[11px] font-semibold" style={{ color: T.mute }}>Em breve</span>
            </div>
          ))}
        </div>
      </div>

      {supabaseReady && user && (
        <button onClick={() => signOut()} className="w-full mt-4 py-3 rounded-2xl font-semibold active:scale-[0.98] transition"
          style={{ background: '#fff', border: `1px solid ${T.line}`, color: T.rose }}>Sair da conta</button>
      )}
    </div>
  )
}
