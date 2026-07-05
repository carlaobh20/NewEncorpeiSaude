import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getProfileName } from '../lib/db'
import { Bell } from '../components/home/Icons'
import { HealthScoreCard, QuickActions, PlanToday, Timeline, CoachCard } from '../components/home/Sections'
import Confetti from '../components/Confetti'
import {
  profile, dayMetrics, quickActions, initialPlan, timeline, coach, sectionOrder, type PlanItem,
} from '../lib/homeData'

const metricRoute: Record<string, string> = { water: 'agua', workout: 'treino', sleep: 'sono', cal: 'calorias', protein: 'proteina' }
const actionRoute: Record<string, string> = { peso: '/m/peso', treino: '/musculacao', refeicao: '/m/alimentacao', agua: '/m/agua', sono: '/m/sono', mais: '/registrar' }

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
  const [name, setName] = useState(profile.name)
  useEffect(() => {
    if (supabaseReady && user) {
      getProfileName(user.id).then((n) => setName(n || user.email?.split('@')[0] || 'você'))
    }
  }, [user])
  const [plan, setPlan] = useState<PlanItem[]>(initialPlan)
  const [fire, setFire] = useState(0)

  const togglePlan = (id: string) =>
    setPlan((p) => p.map((it) => {
      if (it.id !== id) return it
      const nowDone = it.status !== 'done'
      if (nowDone) setFire((f) => f + 1)
      return { ...it, status: nowDone ? 'done' : (it.progress ? 'progress' : 'todo'), sub: nowDone ? 'Concluído agora' : it.sub }
    }))

  const render: Record<string, JSX.Element> = {
    score: <HealthScoreCard score={profile.score} delta={profile.scoreDelta} metrics={dayMetrics}
      onMetric={(k) => nav(k === 'workout' ? '/musculacao' : `/m/${metricRoute[k] ?? 'peso'}`)} onInsights={() => nav('/insights')} />,
    quick: <QuickActions actions={quickActions} onPick={(k) => nav(actionRoute[k] ?? '/registrar')} />,
    plan: <PlanToday items={plan} onToggle={togglePlan} onSeeAll={() => nav('/plano')} />,
    timeline: <Timeline events={timeline} onSeeAll={() => nav('/timeline')} />,
    coach: <CoachCard greeting={coach.greeting} message={coach.message} goal={coach.goal} onConversar={() => nav('/coach')} />,
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28">
      <header className="flex items-center justify-between">
        <button onClick={() => nav('/')} className="flex items-center gap-1.5">
          <span style={{ fontFamily: 'Georgia,serif' }} className="text-emerald-500 text-2xl lowercase leading-none">e</span>
          <span className="font-semibold text-slate-900 text-lg tracking-tight">encorpei</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/insights')} className="relative text-slate-500 active:scale-90 transition"><Bell className="w-6 h-6" /><span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-[#F6F8FC]" /></button>
          <button onClick={() => nav('/perfil')} className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 flex items-center justify-center text-white font-semibold text-sm active:scale-90 transition">C</button>
        </div>
      </header>

      <div className="mt-5">
        <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">{greet()}, {name}! <span className="align-middle">👋</span></h1>
        <p className="text-slate-400 mt-0.5">{weekday()}</p>
      </div>

      <div className="mt-5 space-y-5">
        {sectionOrder.map((k) => <div key={k}>{render[k]}</div>)}
      </div>

      <Confetti fire={fire} />
    </div>
  )
}
