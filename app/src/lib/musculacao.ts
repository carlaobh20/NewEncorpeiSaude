export type Muscle = 'peito' | 'costas' | 'ombro' | 'biceps' | 'triceps' | 'perna' | 'gluteo' | 'core' | 'panturrilha'

export type SetRow = { reps: number; load: number; done?: boolean }
export type Exercise = {
  id: string; name: string; group: string; muscles: Muscle[]
  sets: SetRow[]; rest: string
}
export type SplitKey = 'A' | 'B' | 'C' | 'D' | 'FB'
export type Workout = {
  key: SplitKey; name: string; focus: string; muscles: Muscle[]
  durationMin: number; exercises: Exercise[]
}

const set = (n: number, reps: number, load: number): SetRow[] =>
  Array.from({ length: n }, () => ({ reps, load }))

export const workouts: Record<SplitKey, Workout> = {
  A: {
    key: 'A', name: 'Superior A', focus: 'Peito, Ombro e Tríceps', muscles: ['peito', 'ombro', 'triceps'], durationMin: 75,
    exercises: [
      { id: 'a1', name: 'Supino Reto com Barra', group: 'Peito', muscles: ['peito'], sets: set(4, 8, 80), rest: '90s' },
      { id: 'a2', name: 'Supino Inclinado Halteres', group: 'Peito', muscles: ['peito'], sets: set(4, 10, 30), rest: '75s' },
      { id: 'a3', name: 'Desenvolvimento com Halteres', group: 'Ombro', muscles: ['ombro'], sets: set(3, 12, 22), rest: '60s' },
      { id: 'a4', name: 'Elevação Lateral', group: 'Ombro', muscles: ['ombro'], sets: set(3, 15, 12), rest: '45s' },
      { id: 'a5', name: 'Tríceps na Polia', group: 'Tríceps', muscles: ['triceps'], sets: set(4, 12, 25), rest: '60s' },
      { id: 'a6', name: 'Tríceps Francês', group: 'Tríceps', muscles: ['triceps'], sets: set(3, 12, 18), rest: '60s' },
    ],
  },
  B: {
    key: 'B', name: 'Inferior A', focus: 'Quadríceps e Panturrilha', muscles: ['perna', 'panturrilha'], durationMin: 75,
    exercises: [
      { id: 'b1', name: 'Agachamento Livre', group: 'Perna', muscles: ['perna', 'gluteo'], sets: set(4, 8, 100), rest: '120s' },
      { id: 'b2', name: 'Leg Press 45°', group: 'Perna', muscles: ['perna'], sets: set(4, 12, 200), rest: '90s' },
      { id: 'b3', name: 'Cadeira Extensora', group: 'Perna', muscles: ['perna'], sets: set(3, 15, 60), rest: '60s' },
      { id: 'b4', name: 'Panturrilha em Pé', group: 'Panturrilha', muscles: ['panturrilha'], sets: set(4, 20, 80), rest: '45s' },
    ],
  },
  C: {
    key: 'C', name: 'Superior B', focus: 'Costas e Bíceps', muscles: ['costas', 'biceps'], durationMin: 60,
    exercises: [
      { id: 'c1', name: 'Puxada na Frente (Polia)', group: 'Costas', muscles: ['costas'], sets: set(4, 10, 70), rest: '75s' },
      { id: 'c2', name: 'Remada Curvada com Barra', group: 'Costas', muscles: ['costas'], sets: set(4, 8, 80), rest: '90s' },
      { id: 'c3', name: 'Remada Unilateral', group: 'Costas', muscles: ['costas'], sets: set(3, 12, 30), rest: '60s' },
      { id: 'c4', name: 'Rosca Direta', group: 'Bíceps', muscles: ['biceps'], sets: set(3, 12, 30), rest: '60s' },
      { id: 'c5', name: 'Rosca Martelo', group: 'Bíceps', muscles: ['biceps'], sets: set(3, 12, 16), rest: '45s' },
    ],
  },
  D: {
    key: 'D', name: 'Inferior B', focus: 'Posterior e Glúteo', muscles: ['perna', 'gluteo'], durationMin: 80,
    exercises: [
      { id: 'd1', name: 'Levantamento Terra', group: 'Posterior', muscles: ['perna', 'costas', 'gluteo'], sets: set(4, 6, 120), rest: '120s' },
      { id: 'd2', name: 'Mesa Flexora', group: 'Posterior', muscles: ['perna'], sets: set(4, 12, 50), rest: '60s' },
      { id: 'd3', name: 'Elevação Pélvica', group: 'Glúteo', muscles: ['gluteo'], sets: set(4, 12, 90), rest: '75s' },
      { id: 'd4', name: 'Cadeira Abdutora', group: 'Glúteo', muscles: ['gluteo'], sets: set(3, 15, 55), rest: '45s' },
    ],
  },
  FB: {
    key: 'FB', name: 'Full Body', focus: 'Corpo inteiro', muscles: ['peito', 'costas', 'perna', 'ombro'], durationMin: 70,
    exercises: [
      { id: 'f1', name: 'Agachamento', group: 'Perna', muscles: ['perna'], sets: set(3, 10, 80), rest: '90s' },
      { id: 'f2', name: 'Supino Reto', group: 'Peito', muscles: ['peito'], sets: set(3, 10, 70), rest: '75s' },
      { id: 'f3', name: 'Remada', group: 'Costas', muscles: ['costas'], sets: set(3, 10, 60), rest: '75s' },
    ],
  },
}

export type PlanDay = { day: string; date: string; key: SplitKey; status: 'hoje' | 'pendente' | 'concluido' }
export const weekPlan: PlanDay[] = [
  { day: 'Ter', date: 'Hoje', key: 'A', status: 'hoje' },
  { day: 'Qua', date: '05/07', key: 'B', status: 'pendente' },
  { day: 'Sex', date: '07/07', key: 'C', status: 'pendente' },
  { day: 'Sáb', date: '08/07', key: 'D', status: 'pendente' },
  { day: 'Dom', date: '09/07', key: 'FB', status: 'pendente' },
]

export const volumeWeek = [
  { d: 'S', kg: 0 }, { d: 'T', kg: 4200 }, { d: 'Q', kg: 5100 }, { d: 'Q', kg: 0 },
  { d: 'S', kg: 4950 }, { d: 'S', kg: 0 }, { d: 'D', kg: 0 },
]
export const volumeTotalWeek = 14250
export const volumeDeltaPct = 12
export const frequencia = { done: 4, goal: 5 }

export const performance30 = [
  { label: 'Volume total', value: '62.450 kg', delta: '18%', up: true },
  { label: 'Carga média', value: '1.248 kg', delta: '9%', up: true },
  { label: 'Treinos concluídos', value: '20', delta: '11%', up: true },
  { label: 'Recordes pessoais', value: '7', delta: 'Novos', up: true },
]

export const lastWorkout = {
  name: 'Superior B', date: '03/07 · 18:40',
  volume: '12.680 kg', duration: '68 min', exercises: 6, series: 24, calories: '620 kcal',
}
