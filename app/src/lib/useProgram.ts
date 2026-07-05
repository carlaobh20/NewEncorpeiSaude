import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './auth'
import { supabaseReady } from './supabase'
import { fetchRoutines, seedProgramIfEmpty, type DBRoutine } from './training'

export function useProgram() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState<DBRoutine[] | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!supabaseReady || !user) { setRoutines([]); setLoading(false); return }
    setLoading(true)
    try {
      await seedProgramIfEmpty(user.id, user.email?.split('@')[0] || 'Atleta')
      setRoutines(await fetchRoutines(user.id))
    } catch (e) { console.error('program load', e); setRoutines([]) }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { reload() }, [reload])
  return { routines, loading, reload, user }
}
