import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { claimInvite, listMyPatients, type LinkedPatient } from '../lib/careLinks'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function Pro() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [patients, setPatients] = useState<LinkedPatient[] | null>(null)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => { if (user && supabaseReady) listMyPatients(user.id).then(setPatients).catch(() => setPatients([])); else setPatients([]) }
  useEffect(load, [user])

  const claim = async () => {
    const t = token.trim()
    if (!t || !user || busy) return
    setBusy(true); setMsg('')
    try {
      const ok = await claimInvite(t)
      if (ok) { setMsg('✅ Paciente vinculado!'); setToken(''); load() }
      else setMsg('Código inválido, já usado ou revogado.')
    } catch { setMsg('Código inválido — confira e tente de novo.') } finally { setBusy(false) }
  }

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 md:px-8 pb-28 pt-6">
        <div className="flex items-center gap-2">
          <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full flex items-center justify-center bg-white active:scale-95 transition" style={{ border: '1px solid #E4E9F1' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={T.text} strokeWidth={2} strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <h1 className="text-[24px] font-bold" style={{ color: T.text }}>🩺 Área do Profissional</h1>
        </div>
        <p className="text-[13px] mt-1" style={{ color: T.sub }}>Seus pacientes vinculados e acesso aos painéis em tempo real.</p>

        {/* resgatar convite */}
        <div style={card} className="p-4 mt-5">
          <div className="text-[14px] font-bold mb-1" style={{ color: T.text }}>Vincular novo paciente</div>
          <p className="text-[12px] mb-3" style={{ color: T.sub }}>Peça ao paciente para gerar o código de convite no app dele (Consultas → Compartilhar com meu profissional) e cole aqui.</p>
          <div className="flex gap-2">
            <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Cole o código do convite"
              className="flex-1 bg-white border rounded-2xl px-4 py-3 text-[13px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
            <button onClick={claim} disabled={busy || !token.trim()} className="px-5 rounded-2xl font-bold text-white active:scale-95 transition disabled:opacity-40" style={{ background: T.teal }}>
              {busy ? '…' : 'Vincular'}
            </button>
          </div>
          {msg && <p className="text-[12px] mt-2 font-semibold" style={{ color: msg.startsWith('✅') ? '#0E9F6E' : '#DC2626' }}>{msg}</p>}
        </div>

        {/* pacientes */}
        <h3 className="font-semibold mt-6 mb-2 px-1" style={{ color: T.text }}>Meus pacientes {patients ? `(${patients.length})` : ''}</h3>
        {patients === null ? <p className="text-center py-6 text-sm" style={{ color: T.sub }}>Carregando…</p>
          : patients.length === 0 ? (
            <div style={card} className="p-6 text-center">
              <div className="text-[32px]">👥</div>
              <p className="text-[13px] mt-1" style={{ color: T.sub }}>Nenhum paciente vinculado ainda. Resgate um convite acima.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {patients.map((p) => (
                <button key={p.patient_id} onClick={() => nav(`/painel?p=${p.patient_id}`)} style={card} className="p-4 flex items-center gap-3 text-left active:scale-[0.99] transition">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-[16px]" style={{ background: 'linear-gradient(135deg,#2EE6C6,#12C98A)' }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold truncate" style={{ color: T.text }}>{p.name}</div>
                    <div className="text-[11px]" style={{ color: T.sub }}>vinculado desde {new Date(p.since).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: T.teal }}>abrir painel ›</span>
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
