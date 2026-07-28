import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getMyRole, setMyRole, ROLE_LABEL, type Role } from '../lib/roles'
import { listMyPatients, claimInvite, type LinkedPatient } from '../lib/careLinks'
import { listProfessionalAlerts, subscribeProfessionalAlerts, type Alert } from '../lib/monitoring'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function Medico() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [role, setRole] = useState<Role | null>(null)
  const [patients, setPatients] = useState<LinkedPatient[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!user || !supabaseReady) return
    getMyRole(user.id).then(setRole).catch(() => setRole('paciente'))
    listMyPatients(user.id).then(setPatients).catch(() => setPatients([]))
    listProfessionalAlerts(user.id, true).then(setAlerts).catch(() => setAlerts([]))
  }, [user])
  useEffect(load, [load])

  useEffect(() => {
    if (!user || !supabaseReady) return
    return subscribeProfessionalAlerts(user.id, load)
  }, [user, load])

  async function activate(r: Role) {
    if (!user || busy) return
    setBusy(true); setMsg(null)
    try { await setMyRole(user.id, r); load() }
    catch { setMsg('Não foi possível ativar. Fale com o suporte.') }
    finally { setBusy(false) }
  }

  async function claim() {
    if (!user || !token.trim() || busy) return
    setBusy(true); setMsg(null)
    try {
      const ok = await claimInvite(token.trim())
      setMsg(ok ? 'Paciente vinculado com sucesso.' : 'Convite inválido ou já usado.')
      setToken(''); load()
    } catch { setMsg('Convite inválido ou já usado.') }
    finally { setBusy(false) }
  }

  const red = alerts.filter((a) => a.severity === 'vermelho').length
  const yellow = alerts.filter((a) => a.severity === 'amarelo').length
  const openByPatient = (id: string) => alerts.filter((a) => a.patient_id === id && a.status !== 'tratado').length

  /* Triagem: não é IA prevendo nada, é ordenação direta pelos alertas em
   * aberto que você já definiu (mesma faixa/regra de sempre). 3 níveis:
   * alto (tem vermelho aberto) > médio (tem amarelo/adesão aberto) > sem alerta.
   * Existe pra você não precisar rolar a lista toda procurando quem precisa
   * de atenção primeiro quando tiver muitos pacientes vinculados. */
  const tierOf = (id: string): 0 | 1 | 2 => {
    const mine = alerts.filter((a) => a.patient_id === id && a.status !== 'tratado')
    if (mine.some((a) => a.severity === 'vermelho')) return 0
    if (mine.length > 0) return 1
    return 2
  }
  const lastAlertAt = (id: string) => {
    const mine = alerts.filter((a) => a.patient_id === id)
    return mine.length ? Math.max(...mine.map((a) => new Date(a.created_at).getTime())) : 0
  }
  const sortedPatients = [...patients].sort((a, b) => {
    const t = tierOf(a.patient_id) - tierOf(b.patient_id)
    if (t !== 0) return t
    return lastAlertAt(b.patient_id) - lastAlertAt(a.patient_id)
  })
  const TIER_STYLE = {
    0: { color: '#DC2626', bg: 'rgba(220,38,38,0.10)', label: 'Urgente' },
    1: { color: '#D97706', bg: 'rgba(217,119,6,0.12)', label: 'Atenção' },
  } as const

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title="Área do profissional" />
      <div className="space-y-4 mt-2">

        {role !== null && role === 'paciente' && (
          <div style={card} className="p-4">
            <div className="text-[13px] font-semibold" style={{ color: T.text }}>Ativar modo profissional</div>
            <p className="text-[12px] mt-1" style={{ color: T.sub }}>
              Escolha como você atende. Ao ativar, você passa a entrar direto nesta área e a acompanhar os pacientes vinculados a você.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {(['medico', 'personal', 'nutricionista'] as Role[]).map((r) => (
                <button key={r} onClick={() => activate(r)} disabled={busy}
                  className="rounded-2xl py-2.5 text-[12px] font-semibold text-white active:scale-95 disabled:opacity-50"
                  style={{ background: T.teal }}>{ROLE_LABEL[r]}</button>
              ))}
            </div>
            {msg && <p className="text-[12px] mt-2" style={{ color: T.sub }}>{msg}</p>}
          </div>
        )}
        {role !== null && role !== 'paciente' && (
          <p className="text-[11px]" style={{ color: T.sub }}>Você está atendendo como <b>{ROLE_LABEL[role]}</b>.</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div style={card} className="p-3 text-center">
            <div className="text-[22px] font-bold" style={{ color: T.text }}>{patients.length}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.sub }}>Pacientes</div>
          </div>
          <button style={card} className="p-3 text-center active:scale-95" onClick={() => nav('/pro/alertas')}>
            <div className="text-[22px] font-bold" style={{ color: red ? '#DC2626' : T.text }}>{red}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.sub }}>Vermelhos</div>
          </button>
          <button style={card} className="p-3 text-center active:scale-95" onClick={() => nav('/pro/alertas')}>
            <div className="text-[22px] font-bold" style={{ color: yellow ? '#D97706' : T.text }}>{yellow}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.sub }}>Amarelos</div>
          </button>
        </div>

        <div style={card} className="p-4">
          <div className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Meus pacientes</div>
          {patients.length === 0 && (
            <p className="text-[12px] py-2" style={{ color: T.sub }}>
              Nenhum paciente vinculado. Peça ao paciente para gerar um convite no app dele (Perfil → Compartilhar com profissional) e cole o código abaixo.
            </p>
          )}
          {sortedPatients.map((p) => {
            const n = openByPatient(p.patient_id)
            const tier = tierOf(p.patient_id)
            const sv = tier !== 2 ? TIER_STYLE[tier] : null
            return (
              <button key={p.patient_id} onClick={() => nav(`/medico/paciente?p=${p.patient_id}`)}
                className="w-full flex items-center justify-between py-3 text-left active:scale-[0.99]"
                style={{ borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <div className="text-[14px] font-medium" style={{ color: T.text }}>{p.name}</div>
                  <div className="text-[11px]" style={{ color: T.sub }}>Vinculado em {new Date(p.since).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="flex items-center gap-2">
                  {sv && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: sv.color, background: sv.bg }}>
                      {sv.label} · {n}
                    </span>
                  )}
                  <span style={{ color: T.teal }}>›</span>
                </div>
              </button>
            )
          })}
          <div className="flex gap-2 mt-3">
            <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Código do convite"
              className="flex-1 rounded-xl px-3 py-2 text-[13px] outline-none"
              style={{ border: '1px solid #E4E9F1', color: T.text }} />
            <button onClick={claim} disabled={busy || !token.trim()}
              className="rounded-xl px-3 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-50"
              style={{ background: T.teal }}>Vincular</button>
          </div>
          {msg && <p className="text-[12px] mt-2" style={{ color: T.sub }}>{msg}</p>}
        </div>

        <p className="text-[11px] leading-snug" style={{ color: T.sub }}>
          Área única para médico, personal e nutricionista. Este painel organiza registros feitos pelo próprio paciente e alertas baseados nas faixas que você definiu.
          A lista acima ordena quem tem alerta em aberto primeiro — não é previsão, é ordenação direta pelos alertas que já existem.
          Ele não interpreta dados nem substitui avaliação clínica. Em emergência, oriente 192 (SAMU).
        </p>
      </div>
    </div>
  )
}
