import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMusc } from '../../lib/MuscContext'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { listEquipment } from '../../lib/health'
import { planGymAdjustments, applyGymAdjustments, resetTrainingHistory } from '../../lib/trainingSmart'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784' }
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)', borderRadius: 20 }

/** Ajustar treinos à academia + zona de perigo (reset do histórico). */
export default function SmartTools() {
  const nav = useNavigate()
  const { user } = useAuth()
  const { routines, reload } = useMusc()
  const [busy, setBusy] = useState(false)
  const [plan, setPlan] = useState<{ exerciseId: string; routineName: string; from: string; to: string }[] | null>(null)
  const [msg, setMsg] = useState('')
  const [confirmReset, setConfirmReset] = useState(0) // 0 fechado, 1 confirmar, 2 apagando

  const analyze = async () => {
    if (!user || !supabaseReady || busy) return
    setBusy(true); setMsg('')
    try {
      const equip = await listEquipment(user.id)
      if (!equip.length) { setMsg('Cadastre os aparelhos em "Minha Academia" primeiro.'); setPlan(null); return }
      const changes = planGymAdjustments(routines, equip.map((e) => e.name))
      if (!changes.length) { setMsg('✅ Seus treinos já batem com os aparelhos da sua academia.'); setPlan(null); return }
      setPlan(changes)
    } catch { setMsg('Erro ao analisar. Tente de novo.') } finally { setBusy(false) }
  }

  const apply = async () => {
    if (!user || !plan || busy) return
    setBusy(true)
    try {
      const n = await applyGymAdjustments(user.id, plan)
      setMsg(`✅ ${n} exercício${n > 1 ? 's ajustados' : ' ajustado'} à sua academia.`)
      setPlan(null); reload()
    } catch { setMsg('Erro ao aplicar as trocas.') } finally { setBusy(false) }
  }

  const doReset = async () => {
    if (!user || busy) return
    setBusy(true); setConfirmReset(2)
    try {
      await resetTrainingHistory(user.id)
      setMsg('🗑️ Histórico zerado. Recomeço limpo!')
      reload()
    } catch { setMsg('Erro ao apagar o histórico.') } finally { setBusy(false); setConfirmReset(0) }
  }

  return (
    <>
      {/* ── Ajustar à academia ── */}
      <div style={card} className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold" style={{ color: T.text }}>🤖 Ajustar treinos à minha academia</span>
          <button onClick={analyze} disabled={busy} className="text-[12px] font-bold px-3 py-1.5 rounded-full text-white active:scale-95 transition disabled:opacity-50" style={{ background: T.green }}>
            {busy && !plan ? 'Analisando…' : 'Analisar'}
          </button>
        </div>
        <p className="text-[12px] mt-1" style={{ color: T.sub }}>
          Troca exercícios cujo aparelho você não tem por alternativas compatíveis com os aparelhos da{' '}
          <button onClick={() => nav('/musculacao/academia')} className="font-semibold underline" style={{ color: T.green }}>Minha Academia</button>.
        </p>

        {plan && (
          <div className="mt-3">
            <p className="text-[12px] font-semibold mb-2" style={{ color: T.text }}>{plan.length} troca{plan.length > 1 ? 's' : ''} sugerida{plan.length > 1 ? 's' : ''}:</p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {plan.map((c, i) => (
                <div key={i} className="text-[12px] px-3 py-2 rounded-xl" style={{ background: '#F8FAFC' }}>
                  <span style={{ color: '#94A3B8', textDecoration: 'line-through' }}>{c.from}</span>
                  <span style={{ color: T.sub }}> → </span>
                  <span className="font-semibold" style={{ color: T.text }}>{c.to}</span>
                  <div className="text-[10px]" style={{ color: '#94A3B8' }}>{c.routineName}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setPlan(null)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F9', color: T.sub }}>Cancelar</button>
              <button onClick={apply} disabled={busy} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-50" style={{ background: T.green }}>Aplicar trocas</button>
            </div>
          </div>
        )}
        {msg && <p className="text-[12px] mt-2 font-semibold" style={{ color: msg.startsWith('✅') || msg.startsWith('🗑️') ? '#0E9F6E' : '#B45309' }}>{msg}</p>}
      </div>

      {/* ── Zona de perigo: reset ── */}
      <div style={{ ...card, border: '1px solid #FECACA' }} className="p-4">
        {confirmReset === 0 ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[14px] font-semibold" style={{ color: '#B91C1C' }}>Recomeçar do zero</span>
              <p className="text-[12px] mt-0.5" style={{ color: T.sub }}>Apaga todo o histórico de treinos, séries e recordes.</p>
            </div>
            <button onClick={() => setConfirmReset(1)} className="text-[12px] font-bold px-3 py-1.5 rounded-full shrink-0" style={{ background: '#FEF2F2', color: '#B91C1C' }}>Apagar…</button>
          </div>
        ) : (
          <div>
            <p className="text-[13px] font-bold" style={{ color: '#B91C1C' }}>⚠️ Apagar TODO o histórico de treino?</p>
            <p className="text-[12px] mt-1" style={{ color: T.sub }}>Sessões, séries, cargas e recordes serão excluídos de forma permanente. Seus treinos (A–E) e a academia continuam.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setConfirmReset(0)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F9', color: T.sub }}>Cancelar</button>
              <button onClick={doReset} disabled={busy} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-50" style={{ background: '#DC2626' }}>
                {confirmReset === 2 ? 'Apagando…' : 'Sim, apagar tudo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
