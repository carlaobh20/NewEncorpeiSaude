import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listMyLinks, createInvite, revokeLink, type CareLink } from '../lib/careLinks'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

/** Card do paciente: gerar/copiar código de convite e revogar acesso do profissional. */
export default function ShareCare() {
  const { user } = useAuth()
  const [links, setLinks] = useState<CareLink[]>([])
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = () => { if (user && supabaseReady) listMyLinks(user.id).then(setLinks).catch(() => {}) }
  useEffect(load, [user])

  const gen = async () => {
    if (!user || busy) return
    setBusy(true)
    try { await createInvite(user.id); load() } finally { setBusy(false) }
  }
  const revoke = async (id: string) => {
    if (!user || busy) return
    setBusy(true)
    try { await revokeLink(user.id, id); load() } finally { setBusy(false) }
  }
  const copy = async (token: string) => {
    try { await navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* noop */ }
  }

  const active = links.filter((l) => l.status === 'active')
  const pending = links.filter((l) => l.status === 'pending')

  return (
    <div style={card} className="p-4 mt-5">
      <div className="text-[14px] font-bold" style={{ color: T.text }}>🔗 Compartilhar com meu profissional</div>
      <p className="text-[11px] mt-1" style={{ color: T.sub }}>
        Gere um código e envie ao seu médico ou personal. Ele cola o código na Área do Profissional e passa a ver seus dados em tempo real. Você pode revogar quando quiser (LGPD).
      </p>

      {active.map((l) => (
        <div key={l.id} className="flex items-center justify-between mt-3 p-3 rounded-xl" style={{ background: 'rgba(18,201,138,0.08)' }}>
          <span className="text-[12px] font-semibold" style={{ color: '#0E9F6E' }}>✅ Profissional com acesso ativo</span>
          <button onClick={() => revoke(l.id)} disabled={busy} className="text-[11px] font-bold px-3 py-1.5 rounded-lg" style={{ background: '#FEF2F2', color: '#DC2626' }}>Revogar</button>
        </div>
      ))}

      {pending.map((l) => (
        <div key={l.id} className="mt-3 p-3 rounded-xl" style={{ background: '#F8FAFC' }}>
          <div className="text-[10px] font-semibold mb-1" style={{ color: T.sub }}>Código aguardando resgate — envie ao profissional:</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] px-2 py-1.5 rounded-lg overflow-x-auto whitespace-nowrap" style={{ background: '#fff', border: '1px solid #EDF2F7', color: T.text }}>{l.invite_token}</code>
            <button onClick={() => copy(l.invite_token)} className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white shrink-0" style={{ background: T.teal }}>{copied ? '✓' : 'Copiar'}</button>
            <button onClick={() => revoke(l.id)} className="text-[11px] px-2 py-1.5 rounded-lg shrink-0" style={{ background: '#FEF2F2', color: '#DC2626' }}>✕</button>
          </div>
        </div>
      ))}

      {pending.length === 0 && (
        <button onClick={gen} disabled={busy} className="w-full mt-3 py-2.5 rounded-xl text-[13px] font-bold text-white active:scale-[0.99] transition disabled:opacity-50" style={{ background: T.teal }}>
          {busy ? 'Gerando…' : '+ Gerar código de convite'}
        </button>
      )}
    </div>
  )
}
