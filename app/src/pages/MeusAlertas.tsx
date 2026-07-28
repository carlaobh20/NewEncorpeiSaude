import { useCallback, useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listMyAlerts, subscribePatientAlerts, alertLabel, type Alert } from '../lib/monitoring'

const T = { text: '#0F172A', sub: '#64748B' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

const SEV = {
  vermelho: { label: 'VERMELHO', color: '#DC2626', bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.35)' },
  amarelo: { label: 'AMARELO', color: '#D97706', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.35)' },
} as const

const STATUS_LABEL: Record<Alert['status'], string> = {
  aberto: 'Ainda não visto pelo profissional',
  visto: 'Seu profissional já viu',
  tratado: 'Já tratado pelo profissional',
}

export default function MeusAlertas() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<Alert[] | null>(null)

  const load = useCallback(() => {
    if (!user || !supabaseReady) return
    listMyAlerts(user.id).then(setAlerts).catch(() => setAlerts([]))
  }, [user])
  useEffect(load, [load])

  useEffect(() => {
    if (!user || !supabaseReady) return
    return subscribePatientAlerts(user.id, load)
  }, [user, load])

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title="Meus alertas" />
      <div className="space-y-3 mt-2">
        <p className="text-[11px]" style={{ color: T.sub }}>
          Aqui aparecem os avisos que seu profissional recebeu sobre seus registros — faixas que você combinou com ele, ou quando você para de registrar algo do seu plano.
        </p>

        {alerts === null && <p className="text-[12px] py-6 text-center" style={{ color: T.sub }}>Carregando…</p>}
        {alerts !== null && alerts.length === 0 && (
          <div style={card} className="p-5 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-[13px] font-semibold" style={{ color: T.text }}>Nenhum alerta por aqui</div>
            <p className="text-[12px] mt-1" style={{ color: T.sub }}>Quando algo sair da faixa combinada com seu profissional, aparece aqui.</p>
          </div>
        )}

        {(alerts || []).map((a) => {
          const sv = SEV[a.severity]
          return (
            <div key={a.id} style={{ ...card, border: `1.5px solid ${sv.border}` }} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: sv.color, background: sv.bg }}>{sv.label}</span>
                <span className="text-[11px]" style={{ color: T.sub }}>
                  {new Date(a.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="mt-2 text-[13px]" style={{ color: T.text }}>{alertLabel(a)}</div>
              <div className="mt-1 text-[11px]" style={{ color: T.sub }}>{STATUS_LABEL[a.status]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
