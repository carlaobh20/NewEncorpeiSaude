import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'
import { Plus, Flag, Pencil, Trash2, TrendingDown, TrendingUp, Target, Activity } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listWeights, saveWeight, getProfile, deleteWeightById, setGoalWeight, type WeightRow, type Profile } from '../lib/db'
import {
  computeStats, computeGoalProgress, filterByPeriod, sortDesc, estimateWeeklyLoss, estimateGoalDate,
  calculateBmi, getBmiCategory, getHealthyWeightRange, trendLine, type WeightEntry,
} from '../lib/weight-metrics'
import { PERIOD_OPTIONS, type PeriodKey } from '../components/weight/periodOptions'
import { CircularProgress } from '../components/weight/CircularProgress'

const CARD: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)', borderRadius: 20 }
const teal = '#12C9A6', ink = '#0F172A', sub = '#64748B'
const todayISO = () => new Date().toISOString().slice(0, 10)
const toEntry = (w: WeightRow): WeightEntry => ({ id: w.id || w.date, weight_kg: w.kg, recorded_at: w.date, notes: null })
const fmt = (iso: string) => format(new Date(iso), 'dd/MM', { locale: ptBR })

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(15,23,42,0.45)' }} onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] p-5" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold" style={{ color: ink }}>{title}</h3><button onClick={onClose} className="text-slate-400 text-xl">✕</button></div>
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
  const [err, setErr] = useState('')

  const load = () => { if (user && supabaseReady) { listWeights(user.id).then(setRows).catch(() => {}); getProfile(user.id).then(setProfile).catch(() => {}) } }
  useEffect(load, [user])

  const all = useMemo(() => rows.map(toEntry), [rows])
  const cfg = PERIOD_OPTIONS.find((o) => o.key === period)!
  const periodE = useMemo(() => filterByPeriod(all, cfg.days), [all, cfg.days])
  const stats = useMemo(() => computeStats(all), [all])
  const goalKg = profile.target_kg ?? null
  const progress = computeGoalProgress(stats.initial?.weight_kg ?? null, stats.current?.weight_kg ?? null, goalKg)
  const remaining = stats.current && goalKg != null ? stats.current.weight_kg - goalKg : null
  const weekly = estimateWeeklyLoss(all)
  const goalDate = estimateGoalDate(all, goalKg)
  const bmi = calculateBmi(stats.current?.weight_kg ?? null, profile.height_cm)
  const bmiCat = bmi ? getBmiCategory(bmi) : null
  const range = getHealthyWeightRange(profile.height_cm)
  const recentDiff = useMemo(() => { const d = sortDesc(periodE); return d.length >= 2 ? d[0].weight_kg - d[1].weight_kg : null }, [periodE])

  const chartData = useMemo(() => {
    const asc = trendLine(periodE)
    return asc.map((r) => ({ d: fmt(r.recorded_at), kg: r.weight_kg, trend: +r.trend.toFixed(1) }))
  }, [periodE])

  const openAdd = () => { setInput(''); setInputDate(todayISO()); setErr(''); setModal('add') }
  const submitAdd = async (date: string) => {
    const kg = parseFloat(input.replace(',', '.')); if (!kg || !user) { setErr('Digite um peso válido'); return }
    try { await saveWeight(user.id, date, +kg.toFixed(1)); setModal(null); setInput(''); load() } catch (e: any) { setErr(e?.message || 'Erro ao salvar') }
  }
  const submitGoal = async () => {
    const kg = parseFloat(input.replace(',', '.')); if (!kg || !user) { setErr('Digite uma meta válida'); return }
    try { await setGoalWeight(user.id, +kg.toFixed(1)); setModal(null); setInput(''); load() } catch (e: any) { setErr(e?.message || 'Erro ao salvar meta') }
  }

  const cur = stats.current
  const metrics = [
    { l: 'Inicial', v: stats.initial ? `${stats.initial.weight_kg}` : '—' },
    { l: 'Menor', v: stats.lowest ? `${stats.lowest.weight_kg}` : '—' },
    { l: 'Maior', v: stats.highest ? `${stats.highest.weight_kg}` : '—' },
    { l: 'Média', v: stats.average ? stats.average.toFixed(1) : '—' },
    { l: 'Variação', v: stats.variation != null ? `${stats.variation > 0 ? '+' : ''}${stats.variation.toFixed(1)}` : '—' },
  ]

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pt-4 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-[22px] font-bold" style={{ color: ink }}>Peso</h1><p className="text-[13px]" style={{ color: sub }}>Sua evolução, sua jornada.</p></div>
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 text-white font-semibold text-[13px] px-4 py-2.5 rounded-2xl" style={{ background: teal, boxShadow: '0 8px 20px -6px rgba(18,201,166,0.6)' }}><Plus className="w-4 h-4" /> Registrar</button>
        </div>

        {!cur ? (
          <div style={CARD} className="p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(18,201,166,0.12)' }}><Flag className="w-5 h-5" style={{ color: teal }} /></div>
            <h2 className="font-bold" style={{ color: ink }}>Registre seu primeiro peso</h2>
            <p className="text-[13px] mt-1" style={{ color: sub }}>Comece a acompanhar sua evolução.</p>
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-2 text-white font-semibold text-[13px] px-4 py-2.5 rounded-2xl" style={{ background: teal }}><Plus className="w-4 h-4" /> Registrar peso</button>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div style={CARD} className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[12px]" style={{ color: sub }}>Peso atual</div>
                  <div className="flex items-end gap-1"><span className="text-[42px] font-bold leading-none" style={{ color: ink }}>{cur.weight_kg}</span><span className="text-[16px] font-medium mb-1" style={{ color: sub }}>kg</span></div>
                  {recentDiff != null && (
                    <div className="inline-flex items-center gap-1 mt-1 text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: recentDiff <= 0 ? 'rgba(18,201,166,0.12)' : '#FEE2E2', color: recentDiff <= 0 ? '#0E9F86' : '#DC2626' }}>
                      {recentDiff <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}{Math.abs(recentDiff).toFixed(1)} kg
                    </div>
                  )}
                  <div className="text-[11px] mt-2" style={{ color: sub }}>Atualizado {format(new Date(cur.recorded_at), "dd/MM", { locale: ptBR })}</div>
                </div>
                <CircularProgress value={progress ?? 0} size={104} strokeWidth={10} topLabel="Meta" bottomLabel={goalKg ? `${goalKg}kg` : '—'} />
              </div>
              <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                <div className="text-[13px]" style={{ color: sub }}>{goalKg != null ? <>Meta <b style={{ color: ink }}>{goalKg} kg</b>{remaining != null && ` · faltam ${Math.abs(remaining).toFixed(1)} kg`}</> : 'Defina sua meta de peso'}</div>
                <button onClick={() => { setInput(goalKg ? String(goalKg) : ''); setErr(''); setModal('goal') }} className="inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: teal }}><Target className="w-4 h-4" />{goalKg != null ? 'Editar' : 'Definir'}</button>
              </div>
            </div>

            {/* Metric strip */}
            <div className="grid grid-cols-5 gap-1.5 mt-3">
              {metrics.map((m) => (<div key={m.l} style={CARD} className="py-2.5 text-center"><div className="text-[14px] font-bold" style={{ color: ink }}>{m.v}</div><div className="text-[9px]" style={{ color: sub }}>{m.l}</div></div>))}
            </div>

            {/* Period tabs */}
            <div className="flex gap-1.5 mt-3">
              {PERIOD_OPTIONS.map((o) => (<button key={o.key} onClick={() => setPeriod(o.key)} className="flex-1 py-1.5 rounded-xl text-[12px] font-semibold transition" style={period === o.key ? { background: teal, color: '#fff' } : { background: '#fff', color: sub, border: '1px solid #EDF2F7' }}>{o.shortLabel}</button>))}
            </div>

            {/* Chart */}
            <div style={CARD} className="p-4 mt-3">
              <div className="text-[13px] font-semibold mb-2" style={{ color: ink }}>Evolução · {cfg.label}</div>
              {chartData.length < 2 ? <div className="text-[12px] text-center py-8" style={{ color: sub }}>Registre ao menos 2 pesos no período.</div> : (
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                      <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={teal} stopOpacity={0.35} /><stop offset="95%" stopColor={teal} stopOpacity={0} /></linearGradient></defs>
                      <XAxis dataKey="d" tick={{ fontSize: 10, fill: sub }} axisLine={false} tickLine={false} minTickGap={20} />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: sub }} axisLine={false} tickLine={false} width={38} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EDF2F7', fontSize: 12 }} />
                      {goalKg != null && <ReferenceLine y={goalKg} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: `meta ${goalKg}`, fontSize: 10, fill: '#94A3B8', position: 'insideTopRight' }} />}
                      <Area type="monotone" dataKey="kg" stroke={teal} strokeWidth={3} fill="url(#pg)" dot={{ r: 2, fill: '#fff', stroke: teal, strokeWidth: 2 }} name="Peso" />
                      <Area type="monotone" dataKey="trend" stroke="#22D3EE" strokeWidth={1.5} strokeDasharray="4 3" fill="none" dot={false} name="Tendência" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Projeção + IMC */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div style={CARD} className="p-4">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold mb-1" style={{ color: sub }}><Activity className="w-4 h-4" style={{ color: teal }} /> Projeção</div>
                {weekly != null ? (<>
                  <div className="text-[15px] font-bold" style={{ color: weekly > 0 ? '#0E9F86' : '#DC2626' }}>{weekly > 0 ? '−' : '+'}{Math.abs(weekly).toFixed(2)} kg/sem</div>
                  <div className="text-[11px] mt-1" style={{ color: sub }}>{goalDate ? <>Meta em <b style={{ color: ink }}>{format(goalDate, "MMM 'de' yyyy", { locale: ptBR })}</b></> : 'Sem projeção ainda'}</div>
                </>) : <div className="text-[11px]" style={{ color: sub }}>Registre mais pesos.</div>}
              </div>
              <div style={CARD} className="p-4">
                <div className="text-[12px] font-semibold mb-1" style={{ color: sub }}>IMC</div>
                {bmi != null && bmiCat ? (<>
                  <div className="text-[18px] font-bold" style={{ color: ink }}>{bmi.toFixed(1)}</div>
                  <div className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: bmiCat.color + '22', color: bmiCat.color }}>{bmiCat.label}</div>
                  {range && <div className="text-[10px] mt-1.5" style={{ color: sub }}>Saudável: {range.min.toFixed(0)}–{range.max.toFixed(0)} kg</div>}
                </>) : <div className="text-[11px]" style={{ color: sub }}>Defina altura no perfil.</div>}
              </div>
            </div>

            {/* Histórico */}
            <h3 className="font-semibold mt-6 mb-2 px-1" style={{ color: ink }}>Histórico</h3>
            <div style={CARD} className="p-2">
              {sortDesc(all).map((e) => (
                <div key={e.id} className="flex items-center justify-between px-3 py-3" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                  <div><div className="font-semibold" style={{ color: ink }}>{e.weight_kg} kg</div><div className="text-[12px]" style={{ color: sub }}>{format(new Date(e.recorded_at), "dd/MM/yyyy", { locale: ptBR })}</div></div>
                  <div className="flex gap-1">
                    <button onClick={() => { setInput(String(e.weight_kg)); setInputDate(e.recorded_at.slice(0, 10)); setErr(''); setModal({ edit: e }) }} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F1F5F9' }}><Pencil className="w-4 h-4" style={{ color: sub }} /></button>
                    <button onClick={async () => { if (user) { await deleteWeightById(user.id, e.id); load() } }} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FEF2F2' }}><Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modal === 'add' && (
        <Modal title="Registrar peso" onClose={() => setModal(null)}>
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" placeholder="Peso (kg)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-2 outline-none focus:border-emerald-400" />
          <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3 outline-none" />
          {err && <div className="text-[12px] text-rose-600 mb-2">{err}</div>}
          <button onClick={() => submitAdd(inputDate)} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: teal }}>Salvar</button>
        </Modal>
      )}
      {modal === 'goal' && (
        <Modal title="Definir meta de peso" onClose={() => setModal(null)}>
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" placeholder="Meta (kg)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3 outline-none focus:border-emerald-400" />
          {err && <div className="text-[12px] text-rose-600 mb-2">{err}</div>}
          <button onClick={submitGoal} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: teal }}>Salvar meta</button>
        </Modal>
      )}
      {modal && typeof modal === 'object' && 'edit' in modal && (
        <Modal title="Editar registro" onClose={() => setModal(null)}>
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" placeholder="Peso (kg)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3 outline-none focus:border-emerald-400" />
          {err && <div className="text-[12px] text-rose-600 mb-2">{err}</div>}
          <button onClick={() => submitAdd((modal as any).edit.recorded_at.slice(0, 10))} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: teal }}>Atualizar</button>
        </Modal>
      )}
    </div>
  )
}
