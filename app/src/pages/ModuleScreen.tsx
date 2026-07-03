import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { Card } from '../components/home/Sections'
import { iconMap } from '../components/home/ica'
import { tones } from '../lib/homeData'
import { modules, type Slug } from '../lib/modules'
import { Chevron } from '../components/home/Icons'

export default function ModuleScreen() {
  const { slug } = useParams<{ slug: string }>()
  const cfg = slug ? modules[slug as Slug] : undefined
  const [flash, setFlash] = useState<string | null>(null)
  const [val, setVal] = useState('')
  if (!cfg) return <Navigate to="/" replace />
  const Icon = iconMap[cfg.icon]
  const t = tones[cfg.tone]

  const toast = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 1600) }

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title={cfg.title} />
      <Card className="p-6 mt-1">
        <div className="flex items-center gap-4">
          <span className={`w-14 h-14 rounded-2xl ${t.bg} flex items-center justify-center`}>
            {Icon && <Icon className={`w-7 h-7 ${t.fg}`} />}
          </span>
          <div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-slate-900 tracking-tight">{cfg.hero}</span>
              <span className="text-slate-400 font-medium mb-1">{cfg.unit}</span>
            </div>
            <div className="text-slate-500 text-sm">{cfg.heroSub}</div>
          </div>
        </div>
        <div className={`mt-4 text-sm font-medium ${t.fg}`}>{cfg.goalLabel}</div>
      </Card>

      <h3 className="text-slate-900 font-semibold mt-6 mb-3 px-1">Registrar</h3>
      {cfg.quickAdd.length === 1 && cfg.quickAdd[0].value === 'input' ? (
        <div className="flex gap-2">
          <input value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal"
            placeholder={`Novo valor (${cfg.unit})`}
            className="flex-1 bg-white border border-[#ECEEF3] rounded-2xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-400" />
          <button onClick={() => { if (val) { toast(`Registrado: ${val} ${cfg.unit}`); setVal('') } }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 rounded-2xl transition">Salvar</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {cfg.quickAdd.map((q) => (
            <button key={q.label} onClick={() => toast(`${cfg.title}: ${q.label}`)}
              className="bg-white border border-[#ECEEF3] rounded-2xl py-4 font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-600 active:scale-[0.98] transition shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              {q.label}
            </button>
          ))}
        </div>
      )}

      <h3 className="text-slate-900 font-semibold mt-6 mb-3 px-1">Histórico</h3>
      <Card className="p-2">
        <div className="divide-y divide-[#F2F4F8]">
          {cfg.history.map((h, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-3">
              <span className="text-slate-500 text-sm">{h.label}</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900">{h.value}</span>
                {h.sub && <span className="text-xs text-slate-400 w-14 text-right">{h.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 rounded-[22px] p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></svg>
          Insight da IA
        </div>
        <p className="text-sm text-slate-200 mt-1.5 leading-relaxed">{cfg.insight}</p>
      </div>

      {flash && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">{flash}</div>}
    </div>
  )
}
