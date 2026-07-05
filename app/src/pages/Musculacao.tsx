import { MuscProvider } from '../lib/MuscContext'
import WorkoutHeader from '../components/musc/WorkoutHeader'
import WorkoutCard from '../components/musc/WorkoutCard'
import { VolumeCard, FrequencyCard } from '../components/musc/FrequencyCard'
import ChipsNav from '../components/musc/ChipsNav'
import WorkoutList from '../components/musc/WorkoutList'
import MusclesWorked from '../components/musc/MusclesWorked'
import PerformanceCard from '../components/musc/PerformanceCard'
import WorkoutStats from '../components/musc/WorkoutStats'
import ExercisesCard from '../components/musc/ExercisesCard'
import BottomNavigation from '../components/musc/BottomNavigation'

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
            <WorkoutList />
            <MusclesWorked />
            <PerformanceCard />
            <WorkoutStats />
            <ExercisesCard />
          </div>
        </div>
        <BottomNavigation />
      </div>
    </MuscProvider>
  )
}
