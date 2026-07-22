import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import {
  myPlanItems, listDevices, confirmDevice,
  PLAN_ITEMS, FREQ_LABEL, DEVICES, type PlanItem,
} from '../lib/monitoring'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function MeuPlano() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [items, setItems] = useState<PlanItem[] | null>(null)
  const [devices, setDevices] = useState<string[]>([])
  const [confirming, setConfirming] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!user || !supabaseReady) return
    myPlanItems(user.id).then(setItems).catch(() => setItems([]))
    listDevices(user.id).then(setDevices).catch(() => setDevices([]))
  }, [user])
  useEffect(load, [load])

  async function confirm(device: string) {
    if (!user || confirming) return
    setConfirming(device)
    try { await confirmDevice(user.id, device); load() } finally { setConfirming(null) }
  }

  const visible = (items || []).filter((i) => !i.requires_device || devices.includes(i.requires_device))
  const gated = (items || []).filter((i) => i.requires_device && !devices.includes(i.requires_device))

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title="Meu plano de cuidado" />
      <div className="space-y-4 mt-2">
        <div className="rounded-2xl p-3 text-[12px] leading-snug" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#991B1B' }}>
          Este aplicativo <b>não detecta emergências</b>. Passando mal? Ligue <b>192 (SAMU)</b>.
        </div>

        {items === null && <p className="text-[12px] py-6 text-center" style={{ color: T.sub }}>Carregando…</p>}

        {items !== null && items.length === 0 && (
          <div style={card} className="p-5 text-center">
            <div className="text-3xl mb-2">🩺</div>
            <div className="text-[14px] font-semibold" style={{ color: T.text }}>Nenhum plano ainda</div>
            <p className="text-[12px] mt-1" style={{ color: T.sub }}>
              Quando seu profissional montar o seu plano de acompanhamento, os itens aparecem aqui — só coisas que você sabe registrar, no seu ritmo.
            </p>
          </div>
        )}

        {visible.length > 0 && (
          <div style={card} className="p-4">
            <div className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>O que seu profissional pediu</div>
            <p className="text-[11px] mb-3" style={{ color: T.sub }}>Toque em um item para registrar agora.</p>
            {visible.map((i) => {
              const meta = PLAN_ITEMS[i.item]
              if (!meta) return null
              return (
                <button key={i.id} onClick={() => nav(meta.route)}
                  className="w-full flex items-center justify-between py-3 text-left transition active:scale-[0.99]"
                  style={{ borderTop: '1px solid #F1F5F9' }}>
                  <div>
                    <div className="text-[14px] font-medium" style={{ color: T.text }}>{meta.label}</div>
                    <div className="text-[11px]" style={{ color: T.sub }}>{FREQ_LABEL[i.frequency] || i.frequency}</div>
                  </div>
                  <span className="text-[18px]" style={{ color: T.teal }}>›</span>
                </button>
              )
            })}
          </div>
        )}

        {gated.map((i) => {
          const dev = i.requires_device as string
          return (
            <div key={i.id} style={card} className="p-4">
              <div className="text-[13px] font-semibold" style={{ color: T.text }}>
                Seu profissional pediu: {PLAN_ITEMS[i.item]?.label.toLowerCase()}
              </div>
              <p className="text-[12px] mt-1" style={{ color: T.sub }}>
                Para isso você precisa ter um {DEVICES[dev]} em casa e saber usar. Se ainda não tem, converse com seu profissional — esse item fica escondido até você confirmar.
              </p>
              <button onClick={() => confirm(dev)} disabled={confirming === dev}
                className="mt-3 w-full rounded-2xl py-2.5 text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-50"
                style={{ background: T.teal }}>
                {confirming === dev ? 'Confirmando…' : `Tenho o ${DEVICES[dev]} e sei usar`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
