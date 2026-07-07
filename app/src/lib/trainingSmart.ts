import { supabase } from './supabase'
import type { DBRoutine } from './training'

/* ────────────────────────────────────────────
   1. Sugestão de treino pelo dia da semana
   Seg=A, Ter=B, Qua=C, Qui=D, Sex=E (posição na lista)
──────────────────────────────────────────── */

export const routineLetter = (idx: number) => 'ABCDEFG'[idx] ?? '?'

export type WeekSession = { routine_id: string | null; finished_at: string }

export async function fetchWeekSessions(userId: string): Promise<WeekSession[]> {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const { data } = await supabase.from('training_sessions')
    .select('routine_id,finished_at')
    .eq('user_id', userId).not('finished_at', 'is', null)
    .gte('finished_at', monday.toISOString())
  return (data as WeekSession[]) || []
}

export type Suggestion = {
  /** treino recomendado agora (ideal do dia, ou recuperação) */
  primary: { routine: DBRoutine; letter: string } | null
  /** treino atrasado — quando existir, a UI oferece a escolha */
  catchUp: { routine: DBRoutine; letter: string } | null
  doneToday: boolean
  weekend: boolean
  reason: string
}

export function suggestWorkout(routines: DBRoutine[], week: WeekSession[], now = new Date()): Suggestion {
  const empty: Suggestion = { primary: null, catchUp: null, doneToday: false, weekend: false, reason: '' }
  if (!routines.length) return empty

  const withIdx = routines.map((r, i) => ({ routine: r, letter: routineLetter(i), day: (r.day_of_week ?? i + 1) }))
  const dow = now.getDay() // 0=dom .. 6=sáb
  const todayISO = now.toISOString().slice(0, 10)
  const doneIds = new Set(week.map((s) => s.routine_id).filter(Boolean) as string[])
  const doneToday = week.some((s) => (s.finished_at || '').slice(0, 10) === todayISO)

  if (dow === 0 || dow === 6) {
    const missed = withIdx.filter((x) => !doneIds.has(x.routine.id))
    if (missed.length === 0) return { ...empty, weekend: true, reason: 'Semana completa! Descanso merecido 🎉' }
    return { primary: missed[0], catchUp: null, doneToday, weekend: true, reason: `Fim de semana · dá pra recuperar o Treino ${missed[0].letter}` }
  }

  const ideal = withIdx.find((x) => x.day === dow) ?? withIdx[withIdx.length - 1]
  const missedBefore = withIdx.filter((x) => x.day < dow && !doneIds.has(x.routine.id))
  const lastMissed = missedBefore.length ? missedBefore[missedBefore.length - 1] : null
  const idealDone = doneIds.has(ideal.routine.id)

  if (doneToday) return { primary: ideal, catchUp: null, doneToday: true, weekend: false, reason: 'Treino de hoje concluído ✅' }

  if (lastMissed && !idealDone) {
    return {
      primary: ideal, catchUp: lastMissed, doneToday: false, weekend: false,
      reason: `Você pulou o Treino ${lastMissed.letter}. O ideal de hoje é o ${ideal.letter}.`,
    }
  }

  if (idealDone) {
    const nextPending = withIdx.find((x) => !doneIds.has(x.routine.id))
    if (nextPending) return { primary: nextPending, catchUp: null, doneToday: false, weekend: false, reason: `Treino ${ideal.letter} já feito esta semana · próximo: ${nextPending.letter}` }
    return { primary: null, catchUp: null, doneToday: false, weekend: false, reason: 'Todos os treinos da semana concluídos 🎉' }
  }

  return { primary: ideal, catchUp: null, doneToday: false, weekend: false, reason: `Hoje é dia de Treino ${ideal.letter}` }
}

/* ────────────────────────────────────────────
   2. Reset total do histórico de treino
──────────────────────────────────────────── */

export async function resetTrainingHistory(userId: string) {
  const { error: e1 } = await supabase.from('session_sets').delete().eq('user_id', userId)
  if (e1) throw e1
  const { error: e2 } = await supabase.from('training_sessions').delete().eq('user_id', userId)
  if (e2) throw e2
}

/* ────────────────────────────────────────────
   3. Ajuste do treino à academia do usuário
   Regra: se o aparelho exigido não existe na academia,
   troca pelo primeiro substituto cujo aparelho existe
   (ou peso do corpo). Persistido em routine_exercises.
──────────────────────────────────────────── */

type Alt = { name: string; needs: string[] } // needs vazio = peso do corpo
type Rule = { needs: string[]; alts: Alt[] }

/** Palavras-chave de aparelho por exercício (nomes do programa e presets). */
const RULES: Record<string, Rule> = {
  'supino máquina': { needs: ['supino máquina', 'supino'], alts: [{ name: 'Supino reto com barra', needs: ['barra'] }, { name: 'Supino reto com halteres', needs: ['halteres'] }, { name: 'Flexão de braço', needs: [] }] },
  'supino inclinado halteres': { needs: ['halteres'], alts: [{ name: 'Supino inclinado máquina', needs: ['supino inclinado', 'supino máquina'] }, { name: 'Flexão declinada (pés elevados)', needs: [] }] },
  'crucifixo máquina': { needs: ['crucifixo máquina', 'peck deck'], alts: [{ name: 'Crossover', needs: ['crossover', 'cross'] }, { name: 'Crucifixo com halteres', needs: ['halteres'] }] },
  'crossover': { needs: ['crossover', 'cross'], alts: [{ name: 'Crucifixo máquina', needs: ['crucifixo máquina', 'peck deck'] }, { name: 'Crucifixo com halteres', needs: ['halteres'] }] },
  'tríceps corda': { needs: ['crossover', 'cross', 'polia'], alts: [{ name: 'Tríceps francês com halter', needs: ['halteres'] }, { name: 'Mergulho no banco', needs: [] }] },
  'tríceps francês': { needs: ['halteres'], alts: [{ name: 'Tríceps corda', needs: ['crossover', 'cross', 'polia'] }, { name: 'Mergulho no banco', needs: [] }] },
  'puxada frente': { needs: ['puxada'], alts: [{ name: 'Barra fixa', needs: ['barra fixa'] }, { name: 'Remada curvada com barra', needs: ['barra'] }, { name: 'Remada unilateral com halter', needs: ['halteres'] }] },
  'remada baixa': { needs: ['remada baixa', 'polia'], alts: [{ name: 'Remada curvada com barra', needs: ['barra'] }, { name: 'Remada unilateral com halter', needs: ['halteres'] }] },
  'remada articulada': { needs: ['remada articulada'], alts: [{ name: 'Remada baixa', needs: ['remada baixa', 'polia'] }, { name: 'Remada curvada com barra', needs: ['barra'] }, { name: 'Remada unilateral com halter', needs: ['halteres'] }] },
  'pulldown': { needs: ['crossover', 'cross', 'polia'], alts: [{ name: 'Puxada frente pegada aberta', needs: ['puxada'] }, { name: 'Pull-over com halter', needs: ['halteres'] }] },
  'rosca direta': { needs: ['barra', 'halteres'], alts: [{ name: 'Rosca direta com halteres', needs: ['halteres'] }, { name: 'Rosca no cabo', needs: ['crossover', 'cross', 'polia'] }] },
  'rosca martelo': { needs: ['halteres'], alts: [{ name: 'Rosca corda no cabo', needs: ['crossover', 'cross', 'polia'] }] },
  'rosca scott': { needs: ['rosca scott', 'scott'], alts: [{ name: 'Rosca concentrada', needs: ['halteres'] }] },
  'leg press': { needs: ['leg press'], alts: [{ name: 'Agachamento Hack', needs: ['hack', 'agachamento hack'] }, { name: 'Agachamento livre com barra', needs: ['barra'] }, { name: 'Agachamento goblet', needs: ['halteres'] }, { name: 'Agachamento livre', needs: [] }] },
  'cadeira extensora': { needs: ['cadeira extensora', 'extensora'], alts: [{ name: 'Agachamento búlgaro', needs: ['halteres'] }, { name: 'Afundo', needs: [] }] },
  'mesa flexora': { needs: ['mesa flexora', 'flexora'], alts: [{ name: 'Stiff com barra', needs: ['barra'] }, { name: 'Stiff com halteres', needs: ['halteres'] }] },
  'panturrilha no leg press': { needs: ['leg press'], alts: [{ name: 'Panturrilha máquina', needs: ['panturrilha'] }, { name: 'Panturrilha em pé (peso do corpo)', needs: [] }] },
  'cadeira abdutora': { needs: ['cadeira abdutora', 'abdutora'], alts: [{ name: 'Abdução com elástico', needs: [] }] },
  'cadeira adutora': { needs: ['cadeira adutora', 'adutora'], alts: [{ name: 'Adução com elástico', needs: [] }] },
  'desenvolvimento máquina': { needs: ['desenvolvimento'], alts: [{ name: 'Desenvolvimento com halteres', needs: ['halteres'] }, { name: 'Desenvolvimento com barra', needs: ['barra'] }, { name: 'Pike push-up', needs: [] }] },
  'elevação lateral': { needs: ['halteres'], alts: [{ name: 'Elevação lateral no cabo', needs: ['crossover', 'cross', 'polia'] }] },
  'elevação frontal': { needs: ['halteres'], alts: [{ name: 'Elevação frontal com anilha', needs: ['anilhas'] }] },
  'crucifixo invertido': { needs: ['crucifixo máquina', 'peck deck', 'halteres'], alts: [{ name: 'Crucifixo invertido com halteres', needs: ['halteres'] }, { name: 'Face pull com elástico', needs: [] }] },
  'encolhimento': { needs: ['halteres', 'barra'], alts: [{ name: 'Encolhimento na barra', needs: ['barra'] }] },
  'abdominal máquina': { needs: ['abdominal máquina'], alts: [{ name: 'Abdominal no solo', needs: [] }] },
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').trim()

function hasEquip(have: string[], needs: string[]): boolean {
  if (needs.length === 0) return true // peso do corpo
  return needs.some((n) => have.some((h) => h.includes(norm(n)) || norm(n).includes(h)))
}

export type GymChange = { routineName: string; from: string; to: string }

/** Analisa (sem gravar) o que mudaria. */
export function planGymAdjustments(routines: DBRoutine[], equipmentNames: string[]): { exerciseId: string; routineName: string; from: string; to: string }[] {
  const have = equipmentNames.map(norm)
  if (!have.length) return []
  const changes: { exerciseId: string; routineName: string; from: string; to: string }[] = []
  for (const r of routines) {
    for (const e of r.exercises) {
      const rule = RULES[norm(e.name)]
      if (!rule) continue
      if (hasEquip(have, rule.needs)) continue // já tem o aparelho
      const alt = rule.alts.find((a) => hasEquip(have, a.needs))
      if (alt && norm(alt.name) !== norm(e.name)) changes.push({ exerciseId: e.id, routineName: r.name, from: e.name, to: alt.name })
    }
  }
  return changes
}

/** Aplica as trocas no banco (routine_exercises.name + nota). */
export async function applyGymAdjustments(userId: string, changes: { exerciseId: string; from: string; to: string }[]): Promise<number> {
  let ok = 0
  for (const c of changes) {
    const { error } = await supabase.from('routine_exercises')
      .update({ name: c.to, note: `Ajustado à sua academia (antes: ${c.from})` })
      .eq('id', c.exerciseId).eq('user_id', userId)
    if (!error) ok++
  }
  return ok
}
