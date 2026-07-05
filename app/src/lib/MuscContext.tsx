import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useAuth } from './auth'
import { supabaseReady } from './supabase'
import { fetchRoutines, seedProgramIfEmpty, fetchTrainingStats, type DBRoutine, type TrainingStats } from './training'

type Ctx = { routines: DBRoutine[]; stats: TrainingStats | null; loading: boolean; reload: () => void }
const C = createContext<Ctx>({ routines: [], stats: null, loading: true, reload: () => {} })

export function MuscProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [routines, setRoutines] = useState<DBRoutine[]>([])
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!supabaseReady || !user) { setRoutines([]); setStats(null); setLoading(false); return }
    setLoading(true)
    try {
      await seedProgramIfEmpty(user.id, user.email?.split('@')[0] || 'Atleta')
      const [r, s] = await Promise.all([fetchRoutines(user.id), fetchTrainingStats(user.id)])
      setRoutines(r); setStats(s)
    } catch (e) { console.error('musc load', e) } finally { setLoading(false) }
  }, [user])

  useEffect(() => { reload() }, [reload])
  return <C.Provider value={{ routines, stats, loading, reload }}>{children}</C.Provider>
}
export const useMusc = () => useContext(C)
