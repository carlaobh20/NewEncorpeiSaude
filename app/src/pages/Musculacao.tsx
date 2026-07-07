import { MuscProvider } from '../lib/MuscContext'
import WorkoutHeader from '../components/musc/WorkoutHeader'
import WorkoutCard from '../components/musc/WorkoutCard'
import { VolumeCard, FrequencyCard } from '../components/musc/FrequencyCard'
import ChipsNav from '../components/musc/ChipsNav'
import { useNavigate } from 'react-router-dom'
import WorkoutList from '../components/musc/WorkoutList'
import MusclesWorked from '../components/musc/MusclesWorked'
import PerformanceCard from '../components/musc/PerformanceCard'
import WorkoutStats from '../components/musc/WorkoutStats'
import ExercisesCard from '../components/musc/ExercisesCard'
import SmartTools from '../components/musc/SmartTools'

function GymButton() {
  const nav = useNavigate()
  return (
    <button onClick={() => nav('/musculacao/academia')} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl active:scale-[0.99] transition"
      style={{ background: '#fff', border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }}>
      <span className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: '#0F172A' }}>🏋️ Minha Academia</span>
      <span className="text-[12px]" style={{ color: '#64748B' }}>configurar aparelhos ›</span>
    </button>
  )
}

export default function Musculacao() {
  return (
    <MuscProvider>
      <div style={{ background: '#F6F8FC' }} className="min-h-screen">
        <div className="max-w-[400px] mx-auto px-4 pb-28">
          <WorkoutHeader />
          <div className="space-y-3">
            <WorkoutCard />
            <div className="grid grid-cols-2 gap-3">
              <VolumeCard />
              <FrequencyCard />
            </div>
            <ChipsNav />
            <GymButton />
            <SmartTools />
            <WorkoutList />
            <MusclesWorked />
            <PerformanceCard />
            <WorkoutStats />
            <ExercisesCard />
          </div>
        </div>
        </div>
    </MuscProvider>
  )
}
