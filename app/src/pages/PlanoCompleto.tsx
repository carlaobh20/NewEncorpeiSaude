import { useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { PlanToday } from '../components/home/Sections'
import { initialPlan, type PlanItem } from '../lib/homeData'
import Confetti from '../components/Confetti'

export default function PlanoCompleto() {
  const [plan, setPlan] = useState<PlanItem[]>(initialPlan)
  const [fire, setFire] = useState(0)
  const toggle = (id: string) => setPlan((p) => p.map((it) => {
    if (it.id !== id) return it
    const nowDone = it.status !== 'done'
    if (nowDone) setFire((f) => f + 1)
    return { ...it, status: nowDone ? 'done' : (it.progress ? 'progress' : 'todo'), sub: nowDone ? 'Concluído agora' : it.sub }
  }))
  const done = plan.filter((p) => p.status === 'done').length
  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title="Plano de hoje" />
      <div className="py-2 px-1">
        <div className="text-slate-500 text-sm">{done} de {plan.length} concluídos</div>
        <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(done / plan.length) * 100}%` }} />
        </div>
      </div>
      <div className="mt-2"><PlanToday items={plan} onToggle={toggle} /></div>
      <Confetti fire={fire} />
    </div>
  )
}
