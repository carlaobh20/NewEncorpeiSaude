// Antes disso, este arquivo era o "modelo de dados mock da Home" -- número
// fixo pra qualquer usuário (score 92, "Carlos", timeline do dia inteira
// inventada). Foi todo removido em auditoria (2026-07-28): Home.tsx, Coach.tsx
// e as telas que liam daqui (/plano, /timeline, /insights) ou usavam dado
// real (Home.tsx já buscava do Supabase, mostrando "—" quando não tinha
// valor) ou foram trocadas por redirecionamento pra tela real equivalente.
// Só sobra aqui o que ainda é usado de verdade: os tipos e a paleta de cor.

export type DayMetric = { key: string; label: string; value: string; goal?: string; tone: string; icon: string; done?: boolean }

export type PlanItem = {
  id: string; title: string; sub: string; icon: string; tone: string
  status: 'done' | 'progress' | 'todo'; progress?: number; time?: string
}

export type TimelineEvent = { id: string; time: string; label: string; detail: string; icon: string; tone: string }

export const tones: Record<string, { bg: string; fg: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600', ring: 'stroke-emerald-500' },
  sky: { bg: 'bg-sky-50', fg: 'text-sky-500', ring: 'stroke-sky-500' },
  violet: { bg: 'bg-violet-50', fg: 'text-violet-500', ring: 'stroke-violet-500' },
  orange: { bg: 'bg-orange-50', fg: 'text-orange-500', ring: 'stroke-orange-500' },
  rose: { bg: 'bg-rose-50', fg: 'text-rose-500', ring: 'stroke-rose-500' },
  amber: { bg: 'bg-amber-50', fg: 'text-amber-500', ring: 'stroke-amber-500' },
  slate: { bg: 'bg-slate-100', fg: 'text-slate-400', ring: 'stroke-slate-400' },
}
