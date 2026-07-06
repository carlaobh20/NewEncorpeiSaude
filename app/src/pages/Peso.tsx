import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listWeights, saveWeight, getProfile, type WeightRow, type Profile } from '../lib/db'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784', sky: '#0EA5E9', border: '#EDF2F7' }
const card = { background: '#fff', borderRadius: 24, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }
const todayISO = () => new Date().toISOString().slice(0, 10)

function Chart({ data, goal }: { data: WeightRow[]; goal?: number }) {
  if (data.length < 2) return <div className="text-[12px] text-center py-10" style={{ color: T.sub }}>Registre ao menos 2 pesos pra ver o gráfico.</div>
  const kgs = data.map((d) => d.kg)
  const vals = goal ? [...kgs, goal] : kgs
  const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1, range = max - min || 1
  const W = 320, H = 150, pad = 8
  const x = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2)
  const y = (v: number) => pad + (1 - (v - min) / range) * (H - pad * 2)
  const line = data.map((d, i) => `${x(i)},${y(d.kg)}`).join(' ')
  const area = `${pad},${H - pad} ${line} ${W - pad},${H - pad}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#0EA5E9" /></linearGradient>
        <linearGradient id="wa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(52,211,153,0.18)" /><stop offset="100%" stopColor="rgba(52,211,153,0)" /></linearGradient>
      </defs>
      {goal != null && <line x1={pad} x2={W - pad} y1={y(goal)} y2={y(goal)} stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4" />}
      {goal != null && <text x={W - pad} y={y(goal) - 4} textAnchor="end" fontSize="10" fill="#94A3B8">meta {goal}kg</text>}
      <polygon points={area} fill="url(#wa)" />
      <polyline points={line} fill="none" stroke="url(#wg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.kg)} r="3" fill="#fff" stroke="#10B981" strokeWidth="2" />)}
    </svg>
  )
}

export default function Peso() {
  const { user } = useAuth()
  const [weights, setWeights] = useState<WeightRow[] | null>(null)
  const [profile, setProfile] = useState<Profile>({})
  const [val, setVal] = useState('')
  const [flash, setFlash] = useState('')
  const load = () => { if (user && supabaseReady) { listWeights(user.id).then(setWeights).catch(() => setWeights([])); getProfile(user.id).then(setProfile).catch(() => {}) } else setWeights([]) }
  useEffect(load, [user])

  const current = weights && weights.length ? weights[weights.length - 1].kg : null
  const first = weights && weights.length ? weights[0].kg : null
  const prev = weights && weights.length > 1 ? weights[weights.length - 2].kg : null
  const deltaPrev = current != null && prev != null ? +(current - prev).toFixed(1) : 0
  const totalDelta = current != null && first != null ? +(current - first).toFixed(1) : 0
  const goal = profile.target_kg
  const toGoal = current != null && goal != null ? +(current - goal).toFixed(1) : null
  const imc = current != null && profile.height_cm ? +(current / Math.pow(profile.height_cm / 100, 2)).toFixed(1) : null

  const save = async () => {
    const kg = parseFloat(val.replace(',', '.')); if (!kg || !user) return
    try { await saveWeight(user.id, todayISO(), +kg.toFixed(1)); setVal(''); setFlash('Peso salvo!'); setTimeout(() => setFlash(''), 1400); load() }
    catch (e: any) { setFlash('Erro: ' + (e?.message || 'falha')) }
  }

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pb-28">
        <ScreenHeader title="Peso" />
        <div style={card} className="p-6 mt-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[12px]" style={{ color: T.sub }}>Peso atual</div>
              <div className="flex items-end gap-1"><span className="text-5xl font-bold tracking-tight" style={{ color: T.text }}>{current ?? '—'}</span><span className="text-lg font-medium mb-1" style={{ color: T.sub }}>kg</span></div>
              {goal != null && <div className="text-[13px] mt-1" style={{ color: T.sub }}>Meta {goal} kg{toGoal != null && ` · faltam ${Math.abs(toGoal)} kg`}</div>}
            </div>
            {current != null && prev != null && (
              <span className="text-[13px] font-bold px-2.5 py-1 rounded-full" style={{ background: deltaPrev <= 0 ? '#EAFBF1' : '#FEE2E2', color: deltaPrev <= 0 ? T.green : '#DC2626' }}>{deltaPrev <= 0 ? '▼' : '▲'} {Math.abs(deltaPrev)} kg</span>
            )}
          </div>
          <div className="mt-4"><Chart data={weights || []} goal={goal} /></div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t" style={{ borderColor: T.border }}>
            <div className="text-center"><div className="text-[15px] font-bold" style={{ color: totalDelta <= 0 ? T.green : '#DC2626' }}>{totalDelta > 0 ? '+' : ''}{totalDelta} kg</div><div className="text-[10px]" style={{ color: T.sub }}>Total</div></div>
            <div className="text-center"><div className="text-[15px] font-bold" style={{ color: T.text }}>{imc ?? '—'}</div><div className="text-[10px]" style={{ color: T.sub }}>IMC</div></div>
            <div className="text-center"><div className="text-[15px] font-bold" style={{ color: T.text }}>{weights?.length ?? 0}</div><div className="text-[10px]" style={{ color: T.sub }}>Registros</div></div>
          </div>
        </div>

        <div style={card} className="p-4 mt-3 flex gap-2">
          <input value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal" onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="Registrar peso de hoje (kg)"
            className="flex-1 bg-white border rounded-xl px-4 py-3 outline-none focus:border-emerald-400" style={{ borderColor: T.border }} />
          <button onClick={save} className="text-white font-semibold px-5 rounded-xl" style={{ background: T.green }}>Salvar</button>
        </div>
        {flash && <div className="text-center text-[12px] mt-2" style={{ color: T.green }}>{flash}</div>}

        <h3 className="font-semibold mt-6 mb-2 px-1" style={{ color: T.text }}>Histórico</h3>
        {weights === null ? <p className="text-center py-6 text-sm" style={{ color: T.sub }}>Carregando…</p>
          : weights.length === 0 ? <p className="text-center py-6 text-sm" style={{ color: T.sub }}>Nenhum registro ainda.</p>
          : <div style={card} className="p-2"><div className="divide-y" style={{ borderColor: T.border }}>
              {[...weights].reverse().map((w, i, arr) => {
                const nxt = arr[i + 1]
                const d = nxt ? +(w.kg - nxt.kg).toFixed(1) : 0
                return (
                  <div key={w.id || i} className="flex items-center justify-between px-3 py-3">
                    <span className="text-sm" style={{ color: T.sub }}>{new Date(w.date).toLocaleDateString('pt-BR')}</span>
                    <div className="flex items-center gap-3"><span className="font-semibold" style={{ color: T.text }}>{w.kg} kg</span>{nxt && <span className="text-xs w-12 text-right" style={{ color: d <= 0 ? T.green : '#DC2626' }}>{d <= 0 ? '▼' : '▲'} {Math.abs(d)}</span>}</div>
                  </div>
                )
              })}
            </div></div>}
      </div>
    </div>
  )
}
