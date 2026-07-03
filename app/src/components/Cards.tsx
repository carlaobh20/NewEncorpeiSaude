import { useState } from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts'
import type { AppState } from '../lib/types'
import { latestWeight, weightDelta, waterToday, workoutsThisWeek } from '../lib/metrics'

function Stat({ label, value, sub, tone = 'text-white' }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div>
      <div className="text-white/45 text-xs font-semibold uppercase tracking-wider">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold ${tone}`}>{value}</div>
      {sub && <div className="text-white/40 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

export function WeightCard({ s, onAdd }: { s: AppState; onAdd: (kg: number) => void }) {
  const [val, setVal] = useState('')
  const cur = latestWeight(s)
  const delta = weightDelta(s)
  const data = s.weights.map((w) => ({ date: w.date.slice(5), kg: w.kg }))
  return (
    <div className="card p-5 fade-up">
      <div className="flex items-start justify-between">
        <Stat label="Peso atual" value={cur ? `${cur} kg` : '—'}
          sub={`Meta ${s.profile.targetKg} kg`} />
        <div className={`text-sm font-bold px-2.5 py-1 rounded-full ${delta <= 0 ? 'bg-mint-500/15 text-mint-300' : 'bg-rose-500/15 text-rose-300'}`}>
          {delta <= 0 ? '▼' : '▲'} {Math.abs(delta)} kg
        </div>
      </div>
      <div className="h-28 mt-3 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="wl" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34e0a1" /><stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
            <Tooltip contentStyle={{ background: '#0b131c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)' }} formatter={(v) => [`${v} kg`, 'Peso']} />
            <Line type="monotone" dataKey="kg" stroke="url(#wl)" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-2 mt-3">
        <input value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal" placeholder="Registrar peso (kg)"
          className="flex-1 bg-ink-800/70 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-mint-500/50" />
        <button onClick={() => { const n = parseFloat(val.replace(',', '.')); if (n > 0) { onAdd(+n.toFixed(1)); setVal('') } }}
          className="bg-mint-500 hover:bg-mint-400 text-ink-900 font-bold text-sm px-4 rounded-xl transition">Salvar</button>
      </div>
    </div>
  )
}

export function WaterCard({ s, onAdd }: { s: AppState; onAdd: (ml: number) => void }) {
  const cur = waterToday(s)
  const goal = s.profile.waterGoalMl
  const pct = Math.min(100, Math.round((cur / goal) * 100))
  return (
    <div className="card p-5 fade-up">
      <Stat label="Água hoje" value={`${(cur / 1000).toFixed(1)} L`} sub={`Meta ${(goal / 1000).toFixed(1)} L · ${pct}%`} tone="text-aqua-400" />
      <div className="mt-3 h-3 rounded-full bg-ink-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-aqua-500 to-aqua-400 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2 mt-4">
        {[250, 500, 750].map((ml) => (
          <button key={ml} onClick={() => onAdd(ml)}
            className="flex-1 bg-aqua-500/10 hover:bg-aqua-500/20 border border-aqua-500/25 text-aqua-400 font-semibold text-sm py-2 rounded-xl transition">
            +{ml}ml
          </button>
        ))}
        <button onClick={() => onAdd(-250)} className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-xl transition">−</button>
      </div>
    </div>
  )
}

export function WorkoutCard({ s, onToggle, onAdd }: { s: AppState; onToggle: (id: string) => void; onAdd: (n: string) => void }) {
  const [name, setName] = useState('')
  const week = workoutsThisWeek(s)
  const recent = [...s.workouts].slice(0, 4)
  return (
    <div className="card p-5 fade-up md:col-span-2">
      <div className="flex items-start justify-between">
        <Stat label="Treinos na semana" value={`${week}/${s.profile.workoutGoalPerWeek}`} sub="Meta semanal" tone="text-mint-400" />
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo treino…"
            className="bg-ink-800/70 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-mint-500/50 w-40" />
          <button onClick={() => { if (name.trim()) { onAdd(name.trim()); setName('') } }}
            className="bg-mint-500 hover:bg-mint-400 text-ink-900 font-bold text-sm px-4 rounded-xl transition">+ Registrar</button>
        </div>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-2">
        {recent.map((w) => (
          <button key={w.id} onClick={() => onToggle(w.id)}
            className={`flex items-center justify-between text-left px-4 py-3 rounded-xl border transition ${w.done ? 'bg-mint-500/10 border-mint-500/30' : 'bg-ink-800/50 border-white/10'}`}>
            <div>
              <div className="font-semibold text-sm">{w.name}</div>
              <div className="text-white/40 text-xs">{w.date.slice(5)} · {w.sets.length} exercícios</div>
            </div>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${w.done ? 'bg-mint-500 text-ink-900' : 'bg-white/10 text-white/40'}`}>
              {w.done ? '✓' : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function DailyMission({ s }: { s: AppState }) {
  const water = waterToday(s) >= s.profile.waterGoalMl
  const workout = workoutsThisWeek(s) >= 1
  const weighed = s.weights.some((w) => w.date === new Date().toISOString().slice(0, 10))
  const items = [
    { t: 'Bater a meta de água', done: water },
    { t: 'Registrar o peso de hoje', done: weighed },
    { t: 'Treinar hoje', done: workout },
  ]
  const done = items.filter((i) => i.done).length
  return (
    <div className="card p-5 fade-up">
      <div className="flex items-center justify-between">
        <div className="text-white/45 text-xs font-semibold uppercase tracking-wider">Missão do dia</div>
        <div className="text-mint-400 text-sm font-bold">{done}/{items.length}</div>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((i) => (
          <div key={i.t} className="flex items-center gap-3">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${i.done ? 'bg-mint-500 text-ink-900' : 'border border-white/20 text-transparent'}`}>✓</span>
            <span className={`text-sm ${i.done ? 'text-white/40 line-through' : 'text-white/85'}`}>{i.t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
