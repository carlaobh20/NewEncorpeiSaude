import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getProfileName, getWater } from '../lib/db'
import { getSleep, todayNutrition, todayISO } from '../lib/health'
import { TodayCard, QuickActionsSlim, PlanTeaser, CoachTeaser, type TodayMetric } from '../components/home/Sections'

const actionRoute: Record<string, string> = { peso: '/m/peso', treino: '/musculacao', refeicao: '/corpo/nutricao', agua: '/corpo/agua', sono: '/corpo/sono', mais: '/registrar' }
const quickActions = [
  { key: 'peso', label: 'Peso', icon: 'scale' },
  { key: 'treino', label: 'Treino', icon: 'dumbbell' },
  { key: 'refeicao', label: 'Refeição', icon: 'fork' },
  { key: 'agua', label: 'Água', icon: 'water' },
  { key: 'sono', label: 'Sono', icon: 'moon' },
  { key: 'mais', label: 'Mais', icon: 'grid' },
]

const weekday = () => {
  const d = new Date()
  const dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `${dias[d.getDay()].charAt(0).toUpperCase() + dias[d.getDay()].slice(1)}, ${String(d.getDate()).padStart(2, '0')} de ${meses[d.getMonth()]}`
}
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite' }

export default function Home() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('você')
  useEffect(() => {
    if (supabaseReady && user) getProfileName(user.id).then((n) => setName(n || user.email?.split('@')[0] || 'você'))
  }, [user])

  // Só estado real vindo do banco. Sem valor ainda -> mostra "—", nunca um
  // número inventado (era esse o problema do "Health Score" e da timeline
  // fixa: pareciam dados de verdade e não eram).
  const [waterMl, setWaterMl] = useState<number | null>(null)
  const [sleepH, setSleepH] = useState<number | null>(null)
  const [nutri, setNutri] = useState<{ calories: number; protein: number } | null>(null)
  useEffect(() => {
    if (!supabaseReady || !user) return
    const d = todayISO()
    getWater(user.id, d).then(setWaterMl).catch(() => {})
    getSleep(user.id, d).then(setSleepH).catch(() => {})
    todayNutrition(user.id, d).then(setNutri).catch(() => {})
  }, [user])

  const metrics: TodayMetric[] = [
    { key: 'agua', label: 'Água', icon: 'water', value: waterMl != null ? `${(waterMl / 1000).toFixed(1)}L` : '—' },
    { key: 'sono', label: 'Sono', icon: 'moon', value: sleepH ? `${sleepH}h` : '—' },
    { key: 'refeicao', label: 'Calorias', icon: 'flame', value: nutri ? String(nutri.calories) : '—' },
    { key: 'refeicao', label: 'Proteína', icon: 'protein', value: nutri ? `${nutri.protein}g` : '—' },
  ]

  return (
    <div className="max-w-md md:max-w-3xl mx-auto px-4 pt-6 pb-28 md:pb-12">
      <header className="flex items-center justify-between">
        <button onClick={() => nav('/')} className="flex items-center gap-1.5">
          <span style={{ fontFamily: 'Georgia,serif' }} className="text-emerald-600 text-xl lowercase leading-none">e</span>
          <span className="font-semibold text-slate-900 text-[15px] tracking-tight">encorpei</span>
        </button>
        <button onClick={() => nav('/perfil')} className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-[13px] active:scale-90 transition" style={{ background: '#0E9F6E' }}>
          {(name || 'E').charAt(0).toUpperCase()}
        </button>
      </header>

      <div className="mt-4">
        <h1 className="text-[21px] font-bold text-slate-900 tracking-tight">{greet()}, {name}</h1>
        <p className="text-slate-400 text-[13px] mt-0.5">{weekday()}</p>
      </div>

      <div className="mt-4 space-y-3">
        <TodayCard metrics={metrics} onMetric={(k) => nav(actionRoute[k] ?? '/registrar')} />
        <QuickActionsSlim actions={quickActions} onPick={(k) => nav(actionRoute[k] ?? '/registrar')} />
        <PlanTeaser onOpen={() => nav('/meu-plano')} />
        <CoachTeaser onOpen={() => nav('/coach')} />
      </div>
    </div>
  )
}
