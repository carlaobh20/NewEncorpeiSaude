import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listMyPatients, type LinkedPatient } from '../lib/careLinks'
import { listProfessionalAlerts, setAlertStatus, METRICS, symptomLabel, type Alert } from '../lib/monitoring'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

const SEV = {
  vermelho: { label: 'VERMELHO', color: '#DC2626', bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.35)' },
  amarelo: { label: 'AMARELO', color: '#D97706', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.35)' },
} as const

function metricLine(a: Alert): string {
  if (a.metric === 'sintoma') return `Sintoma registrado com força ${a.observed_value ?? '?'}/10`
  const name = METRICS[a.metric] || a.metric
  return `${name}: ${a.observed_value ?? '?'}`
}

export default function ProAlertas() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [alerts, setAlerts] = useState<Alert[] | null>(null)
  const [patients, setPatients] = useState<LinkedPatient[]>([])
  const [onlyOpen, setOnlyOpen] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!user || !supabaseReady) return
    listProfessionalAlerts(user.id, onlyOpen).then(setAlerts).catch(() => setAlerts([]))
    listMyPatients(user.id).then(setPatients).catch(() => setPatients([]))
  }, [user, onlyOpen])
  useEffect(load, [load])

  const nameOf = (id: string) => patients.find((p) => p.patient_id === id)?.name || 'Paciente'

  async function act(a: Alert, status: 'visto' | 'tratado') {
    if (!user || busy) return
    setBusy(a.id)
    try { await setAlertStatus(user.id, a.id, status); load() } finally { setBusy(null) }
  }

  const sorted = (alerts || []).slice().sort((a, b) => {
    const w = (x: Alert) => (x.severity === 'vermelho' ? 0 : 1)
    return w(a) - w(b) || (a.created_at < b.created_at ? 1 : -1)
  })

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title="Alertas"
        action={
          <button onClick={() => setOnlyOpen((v) => !v)} className="text-[11px] font-semibold px-2 py-1 rounded-full"
            style={{ background: 'rgba(18,201,166,0.10)', color: '#0E9F6E' }}>
            {onlyOpen ? 'Ver todos' : 'Só abertos'}
          </button>
        } />
      <div className="space-y-3 mt-2">
        <p className="text-[11px]" style={{ color: T.sub }}>
          Alertas são disparados apenas pelas faixas que <b>você</b> definiu para cada paciente. Cada visualização e tratamento fica registrado com data e hora.
        </p>

        {alerts === null && <p className="text-[12px] py-6 text-center" style={{ color: T.sub }}>Carregando…</p>}
        {alerts !== null && sorted.length === 0 && (
          <div style={card} className="p-5 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-[13px] font-semibold" style={{ color: T.text }}>Nenhum alerta {onlyOpen ? 'aberto' : ''}</div>
            <p className="text-[12px] mt-1" style={{ color: T.sub }}>Quando um registro sair da faixa que você definiu, ele aparece aqui.</p>
          </div>
        )}

        {sorted.map((a) => {
          const sv = SEV[a.severity]
          return (
            <div key={a.id} style={{ ...card, border: `1.5px solid ${sv.border}` }} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: sv.color, background: sv.bg }}>{sv.label}</span>
                <span className="text-[11px]" style={{ color: T.sub }}>
                  {new Date(a.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button onClick={() => nav(`/painel?p=${a.patient_id}`)} className="mt-2 text-left w-full">
                <div className="text-[14px] font-semibold" style={{ color: T.text }}>{nameOf(a.patient_id)}</div>
                <div className="text-[13px]" style={{ color: T.text }}>{metricLine(a)}</div>
                <div className="text-[11px] mt-0.5" style={{ color: T.teal }}>Abrir painel do paciente ›</div>
              </button>
              <div className="flex gap-2 mt-3">
                {a.status === 'aberto' && (
                  <button onClick={() => act(a, 'visto')} disabled={busy === a.id}
                    className="flex-1 rounded-xl py-2 text-[12px] font-semibold active:scale-95 disabled:opacity-50"
                    style={{ background: '#F1F5F9', color: T.text }}>
                    Marcar como visto
                  </button>
                )}
                {a.status !== 'tratado' && (
                  <button onClick={() => act(a, 'tratado')} disabled={busy === a.id}
                    className="flex-1 rounded-xl py-2 text-[12px] font-semibold text-white active:scale-95 disabled:opacity-50"
                    style={{ background: T.teal }}>
                    Marcar como tratado
                  </button>
                )}
                {a.status === 'tratado' && (
                  <span className="flex-1 text-center text-[12px] py-2 font-semibold" style={{ color: '#0E9F6E' }}>Tratado ✓</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
