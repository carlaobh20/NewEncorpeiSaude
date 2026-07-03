export type WeightEntry = { id: string; date: string; kg: number }
export type WaterLog = { date: string; ml: number }        // ml consumed that day
export type WorkoutSet = { exercise: string; reps: number; kg: number }
export type WorkoutSession = { id: string; date: string; name: string; sets: WorkoutSet[]; done: boolean }

export type ProfileGoals = {
  name: string
  heightCm: number
  targetKg: number
  waterGoalMl: number
  workoutGoalPerWeek: number
}

export type AppState = {
  profile: ProfileGoals
  weights: WeightEntry[]
  water: WaterLog[]
  workouts: WorkoutSession[]
}
