// Modelo de dados da Home (mock hoje; espelha o que virá do Supabase).
// Estrutura pensada para o "cockpit adaptativo": as seções são dirigidas por
// um array (sectionOrder) que no futuro a IA reordena conforme o contexto.

export type DayMetric = { key: string; label: string; value: string; goal?: string; tone: string; icon: string; done?: boolean }

export type PlanItem = {
  id: string; title: string; sub: string; icon: string; tone: string
  status: 'done' | 'progress' | 'todo'; progress?: number; time?: string
}

export type TimelineEvent = { id: string; time: string; label: string; detail: string; icon: string; tone: string }

export const profile = {
  name: 'Carlos',
  score: 92,
  scoreDelta: 6,
  evolution30d: 12,
}

export const dayMetrics: DayMetric[] = [
  { key: 'water', label: 'Água', value: '2.1', goal: '3L', tone: 'sky', icon: 'water' },
  { key: 'workout', label: 'Treino', value: 'Concluído', tone: 'emerald', icon: 'dumbbell', done: true },
  { key: 'sleep', label: 'Sono', value: '6h45m', tone: 'violet', icon: 'moon' },
  { key: 'cal', label: 'Calorias', value: '1.842', goal: '2.200', tone: 'orange', icon: 'flame' },
  { key: 'protein', label: 'Proteína', value: '128', goal: '150g', tone: 'rose', icon: 'protein' },
]

export const quickActions = [
  { key: 'peso', label: 'Peso', icon: 'scale', tone: 'emerald' },
  { key: 'treino', label: 'Treino', icon: 'dumbbell', tone: 'emerald' },
  { key: 'refeicao', label: 'Alimentação', icon: 'fork', tone: 'orange' },
  { key: 'agua', label: 'Água', icon: 'water', tone: 'sky' },
  { key: 'sono', label: 'Sono', icon: 'moon', tone: 'violet' },
  { key: 'mais', label: 'Mais', icon: 'grid', tone: 'slate' },
]

export const initialPlan: PlanItem[] = [
  { id: 'p1', title: 'Treino de Força', sub: 'Concluído às 07:15', icon: 'dumbbell', tone: 'emerald', status: 'done', time: '07:15' },
  { id: 'p2', title: 'Creatina', sub: 'Concluído às 07:20', icon: 'pill', tone: 'emerald', status: 'done', time: '07:20' },
  { id: 'p3', title: 'Beber 3L de água', sub: '2.1L / 3L', icon: 'water', tone: 'sky', status: 'progress', progress: 70 },
  { id: 'p4', title: 'Caminhada 30 min', sub: '0 / 30 min', icon: 'shoe', tone: 'amber', status: 'progress', progress: 0 },
  { id: 'p5', title: 'Dormir antes das 23:00', sub: 'Meta diária', icon: 'bed', tone: 'violet', status: 'todo' },
]

export const timeline: TimelineEvent[] = [
  { id: 't1', time: '07:05', label: 'Peso', detail: '123.4 kg', icon: 'scale', tone: 'emerald' },
  { id: 't2', time: '07:20', label: 'Creatina', detail: '5 g', icon: 'pill', tone: 'amber' },
  { id: 't3', time: '07:40', label: 'Água', detail: '500 ml', icon: 'water', tone: 'sky' },
  { id: 't4', time: '08:15', label: 'Treino', detail: 'Força', icon: 'dumbbell', tone: 'emerald' },
  { id: 't5', time: '12:30', label: 'Almoço', detail: '640 kcal', icon: 'fork', tone: 'orange' },
  { id: 't6', time: '16:00', label: 'Água', detail: '600 ml', icon: 'water', tone: 'sky' },
]

export const coach = {
  greeting: 'Bom dia, Carlos!',
  message: 'Sua recuperação ainda está abaixo do ideal. Hoje foque em dormir mais cedo e manter a hidratação.',
  goal: 94,
}

// Ordem das seções — no cockpit adaptativo, a IA reordena/filtra este array.
export const sectionOrder = ['score', 'quick', 'plan', 'timeline', 'coach'] as const
export type SectionKey = typeof sectionOrder[number]

export const tones: Record<string, { bg: string; fg: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600', ring: 'stroke-emerald-500' },
  sky: { bg: 'bg-sky-50', fg: 'text-sky-500', ring: 'stroke-sky-500' },
  violet: { bg: 'bg-violet-50', fg: 'text-violet-500', ring: 'stroke-violet-500' },
  orange: { bg: 'bg-orange-50', fg: 'text-orange-500', ring: 'stroke-orange-500' },
  rose: { bg: 'bg-rose-50', fg: 'text-rose-500', ring: 'stroke-rose-500' },
  amber: { bg: 'bg-amber-50', fg: 'text-amber-500', ring: 'stroke-amber-500' },
  slate: { bg: 'bg-slate-100', fg: 'text-slate-400', ring: 'stroke-slate-400' },
}
