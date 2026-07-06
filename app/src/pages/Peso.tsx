import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listWeights, saveWeight, getProfile, deleteWeightById, setGoalWeight, type WeightRow, type Profile } from '../lib/db'
import { computeStats, filterByPeriod, estimateGoalDate, sortDesc, type WeightEntry } from '../lib/weight-metrics'
import { PERIOD_OPTIONS, type PeriodKey } from '../components/weight/periodOptions'
import { MobileWeightDashboard } from '../components/weight/MobileWeightDashboard'

const todayISO = () => new Date().toISOString().slice(0, 10)
const toEntry = (w: WeightRow): WeightEntry => ({ id: w.id || w.date, weight_kg: w.kg, recorded_at: w.date, notes: null })

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(15,23,42,0.45)' }} onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-900">{title}</h3><button onClick={onClose} className="text-slate-400 text-xl">✕</button></div>
        {children}
      </div>
    </div>
  )
}

export default function Peso() {
  const { user } = useAuth()
  const [rows, setRows] = useState<WeightRow[]>([])
  const [profile, setProfile] = useState<Profile>({})
  const [period, setPeriod] = useState<PeriodKey>('30')
  const [modal, setModal] = useState<null | 'add' | 'goal' | { edit: WeightEntry }>(null)
  const [input, setInput] = useState('')
  const [inputDate, setInputDate] = useState(todayISO())

  const load = () => { if (user && supabaseReady) { listWeights(user.id).then(setRows).catch(() => {}); getProfile(user.id).then(setProfile).catch(() => {}) } }
  useEffect(load, [user])

  const allEntries = useMemo(() => rows.map(toEntry), [rows])
  const cfg = PERIOD_OPTIONS.find((o) => o.key === period)!
  const periodEntries = useMemo(() => filterByPeriod(allEntries, cfg.days), [allEntries, cfg.days])
  const allStats = useMemo(() => computeStats(allEntries), [allEntries])
  const periodStats = useMemo(() => computeStats(periodEntries), [periodEntries])
  const recentDiff = useMemo(() => { const d = sortDesc(periodEntries); return d.length >= 2 ? d[0].weight_kg - d[1].weight_kg : null }, [periodEntries])
  const goalKg = profile.target_kg ?? null
  const goalDate = useMemo(() => estimateGoalDate(allEntries, goalKg), [allEntries, goalKg])
  const goalDateStr = goalDate ? format(goalDate, "dd 'de' MMM 'de' yyyy", { locale: ptBR }) : null

  const submitAdd = async () => {
    const kg = parseFloat(input.replace(',', '.')); if (!kg || !user) return
    await saveWeight(user.id, inputDate, +kg.toFixed(1)); setModal(null); setInput(''); load()
  }
  const submitGoal = async () => {
    const kg = parseFloat(input.replace(',', '.')); if (!kg || !user) return
    await setGoalWeight(user.id, +kg.toFixed(1)); setModal(null); setInput(''); load()
  }

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 py-4">
        <MobileWeightDashboard
          allEntries={allEntries}
          periodEntries={periodEntries}
          allStats={allStats}
          periodStats={periodStats}
          recentDiff={recentDiff}
          goalKg={goalKg}
          goalDateStr={goalDateStr}
          heightCm={profile.height_cm ?? null}
          period={period}
          periodLabel={cfg.label}
          isDemo={false}
          onPeriodChange={setPeriod}
          onRegister={() => { setInput(''); setInputDate(todayISO()); setModal('add') }}
          onEditGoal={() => { setInput(goalKg ? String(goalKg) : ''); setModal('goal') }}
          onEditEntry={(e) => { setInput(String(e.weight_kg)); setInputDate(e.recorded_at.slice(0, 10)); setModal({ edit: e }) }}
          onDeleteEntry={async (id) => { if (user) { await deleteWeightById(user.id, id); load() } }}
        />
      </div>

      {modal === 'add' && (
        <Modal title="Registrar peso" onClose={() => setModal(null)}>
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" placeholder="Peso (kg)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-2 outline-none focus:border-emerald-400" />
          <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3 outline-none" />
          <button onClick={submitAdd} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: '#16C784' }}>Salvar</button>
        </Modal>
      )}
      {modal === 'goal' && (
        <Modal title="Definir meta de peso" onClose={() => setModal(null)}>
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" placeholder="Meta (kg)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3 outline-none focus:border-emerald-400" />
          <button onClick={submitGoal} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: '#16C784' }}>Salvar meta</button>
        </Modal>
      )}
      {modal && typeof modal === 'object' && 'edit' in modal && (
        <Modal title="Editar registro" onClose={() => setModal(null)}>
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" placeholder="Peso (kg)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3 outline-none focus:border-emerald-400" />
          <button onClick={submitAdd} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: '#16C784' }}>Atualizar</button>
        </Modal>
      )}
    </div>
  )
}
