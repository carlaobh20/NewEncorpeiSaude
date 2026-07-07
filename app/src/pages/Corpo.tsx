import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getWater } from '../lib/db'
import { getSleep, todayNutrition, todayISO, listSupplements, takenToday } from '../lib/health'
import { getActiveFast, type Fast } from '../lib/fasting'
import { Chevron } from '../components/home/Icons'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }

type ModuleCard = {
  key: string
  emoji: string
  title: string
  desc: string
  to: string
  value: string
  sub: string
  accent: string
}

export default function Corpo() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [waterMl, setWaterMl] = useState<number | null>(null)
  const [sleepH, setSleepH] = useState<number | null>(null)
  const [nutri, setNutri] = useState<{ calories: number; protein: number } | null>(null)
  const [fast, setFast] = useState<Fast | null>(null)
  const [supps, setSupps] = useState<{ total: number; taken: number } | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!supabaseReady || !user) return
    const d = todayISO()
    getWater(user.id, d).then(setWaterMl).catch(() => {})
    getSleep(user.id, d).then(setSleepH).catch(() => {})
    todayNutrition(user.id, d).then(setNutri).catch(() => {})
    getActiveFast(user.id).then(setFast).catch(() => {})
    Promise.all([listSupplements(user.id), takenToday(user.id, d)])
      .then(([list, taken]) => setSupps({ total: list.length, taken: taken.size }))
      .catch(() => {})
  }, [user])

  useEffect(() => {
    if (!fast) return
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [fast])

  const fastHours = fast ? (now - new Date(fast.start_at).getTime()) / 3600000 : 0

  const modules: ModuleCard[] = [
    {
      key: 'jejum', emoji: '⏱️', title: 'Jejum', to: '/corpo/jejum', accent: '#A855F7',
      desc: 'Timer, fases metabólicas e protocolos',
      value: fast ? `${fastHours.toFixed(1)}h` : '—',
      sub: fast ? `em jejum · meta ${fast.target_hours}h` : 'nenhum jejum ativo',
    },
    {
      key: 'nutricao', emoji: '🍽️', title: 'Nutrição', to: '/corpo/nutricao', accent: '#F97316',
      desc: 'Refeições, calorias e macros',
      value: nutri ? `${nutri.calories}` : '—',
      sub: nutri ? `kcal hoje · ${nutri.protein}g proteína` : 'sem registros hoje',
    },
    {
      key: 'agua', emoji: '💧', title: 'Água', to: '/corpo/agua', accent: '#3B82F6',
      desc: 'Hidratação diária',
      value: waterMl != null ? `${(waterMl / 1000).toFixed(1)}L` : '—',
      sub: waterMl != null ? 'de 3L hoje' : 'sem registros hoje',
    },
    {
      key: 'sono', emoji: '🌙', title: 'Sono', to: '/corpo/sono', accent: '#6366F1',
      desc: 'Horas e qualidade do sono',
      value: sleepH != null && sleepH > 0 ? `${sleepH}h` : '—',
      sub: sleepH != null && sleepH > 0 ? 'na última noite' : 'sem registro hoje',
    },
    {
      key: 'suplementos', emoji: '💊', title: 'Suplementos', to: '/corpo/suplementos', accent: '#0E9F6E',
      desc: 'Protocolo e adesão diária',
      value: supps && supps.total > 0 ? `${supps.taken}/${supps.total}` : '—',
      sub: supps && supps.total > 0 ? 'tomados hoje' : 'nenhum cadastrado',
    },
  ]

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pt-6 pb-28">
        <header className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: T.text }}>Corpo</h1>
          <button onClick={() => nav('/m/peso')} className="text-[12px] font-semibold px-3 py-1.5 rounded-full active:scale-95 transition" style={{ color: T.teal, background: 'rgba(18,201,166,0.12)' }}>⚖️ Peso</button>
        </header>
        <p className="mt-0.5 text-[13px]" style={{ color: T.sub }}>Sua saúde física em um só lugar</p>

        {fast && (
          <button onClick={() => nav('/corpo/jejum')} className="w-full mt-4 p-4 rounded-2xl text-left text-white active:scale-[0.99] transition" style={{ background: '#0F172A', boxShadow: '0 10px 26px rgba(15,23,42,0.25)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-[22px]">🔥</span>
                <div>
                  <div className="text-[14px] font-bold">Jejum em andamento</div>
                  <div className="text-[11px]" style={{ color: '#94A3B8' }}>{fastHours.toFixed(1)}h de {fast.target_hours}h</div>
                </div>
              </div>
              <span className="text-[12px] font-semibold" style={{ color: '#5EEAD4' }}>{Math.min(100, Math.round((fastHours / fast.target_hours) * 100))}%</span>
            </div>
            <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: '#1E293B' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (fastHours / fast.target_hours) * 100)}%`, background: 'linear-gradient(90deg,#2EE6C6,#12C98A)' }} />
            </div>
          </button>
        )}

        <div className="mt-4 space-y-3">
          {modules.map((mod) => (
            <button key={mod.key} onClick={() => nav(mod.to)} style={card} className="w-full p-4 flex items-center gap-3.5 text-left active:scale-[0.99] transition">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px] flex-shrink-0" style={{ background: `${mod.accent}14` }}>{mod.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold" style={{ color: T.text }}>{mod.title}</div>
                <div className="text-[11px] truncate" style={{ color: T.sub }}>{mod.desc}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[16px] font-bold tabular-nums" style={{ color: mod.accent }}>{mod.value}</div>
                <div className="text-[10px]" style={{ color: T.sub }}>{mod.sub}</div>
              </div>
              <span className="flex-shrink-0" style={{ color: '#CBD5E1' }}><Chevron className="w-4 h-4" /></span>
            </button>
          ))}
        </div>

        <button onClick={() => nav('/exames')} className="w-full mt-3 p-4 rounded-2xl flex items-center gap-3.5 text-left active:scale-[0.99] transition" style={{ background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', borderRadius: 20, border: '1px solid rgba(6,182,212,0.18)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}><div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px]" style={{ background: '#EF444414' }}>🧪</div><div className="flex-1"><div className="text-[15px] font-bold" style={{ color: '#0F172A' }}>Exames</div><div className="text-[11px]" style={{ color: '#64748B' }}>Biomarcadores, referências e evolução</div></div><span style={{ color: '#CBD5E1' }}>›</span></button>
      </div>
    </div>
  )
}
