import { useEffect, useMemo, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchRoutines, type DBExercise } from '../../lib/training'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 16, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

/** Normaliza os nomes de músculo do programa para grupos canônicos. */
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').trim()
const GROUP_OF: [string, string][] = [
  ['peito', 'Peito'], ['costas', 'Costas'], ['ombro', 'Ombros'], ['trapezio', 'Ombros'],
  ['biceps', 'Bíceps'], ['triceps', 'Tríceps'],
  ['quadriceps', 'Pernas'], ['posterior', 'Pernas'], ['perna', 'Pernas'], ['adutor', 'Pernas'],
  ['gluteo', 'Glúteos'], ['panturrilha', 'Panturrilha'],
  ['abdomen', 'Abdômen'], ['core', 'Abdômen'],
]
const groupOf = (muscle: string): string => {
  const m = norm(muscle)
  for (const [k, g] of GROUP_OF) if (m.includes(k)) return g
  return 'Outros'
}
const GROUP_EMOJI: Record<string, string> = { 'Peito': '🫁', 'Costas': '🔙', 'Ombros': '🤷', 'Bíceps': '💪', 'Tríceps': '🦾', 'Pernas': '🦵', 'Glúteos': '🍑', 'Panturrilha': '🦶', 'Abdômen': '🎯', 'Outros': '🏋️' }
const ORDER = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Panturrilha', 'Abdômen', 'Outros']

export default function ExerciciosLib() {
  const { user } = useAuth()
  const [exs, setExs] = useState<(DBExercise & { routineName: string })[] | null>(null)
  const [filter, setFilter] = useState<string>('Todos')
  const [q, setQ] = useState('')

  useEffect(() => {
    if (user && supabaseReady) fetchRoutines(user.id).then((rs) => {
      const all = rs.flatMap((r) => r.exercises.map((e) => ({ ...e, routineName: r.name })))
      const seen = new Set<string>()
      setExs(all.filter((e) => (seen.has(e.name) ? false : (seen.add(e.name), true))))
    }).catch(() => setExs([])); else setExs([])
  }, [user])

  const groups = useMemo(() => {
    if (!exs) return []
    const filtered = exs.filter((e) => {
      const g = groupOf(e.muscle)
      if (filter !== 'Todos' && g !== filter) return false
      if (q.trim() && !norm(e.name).includes(norm(q))) return false
      return true
    })
    const map = new Map<string, typeof filtered>()
    for (const e of filtered) {
      const g = groupOf(e.muscle)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(e)
    }
    return ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }))
  }, [exs, filter, q])

  const available = useMemo(() => {
    if (!exs) return []
    const set = new Set(exs.map((e) => groupOf(e.muscle)))
    return ['Todos', ...ORDER.filter((g) => set.has(g))]
  }, [exs])

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-[440px] mx-auto px-4 pb-24">
        <ScreenHeader title="Exercícios" />

        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar exercício…"
          className="w-full bg-white border rounded-2xl px-4 py-2.5 text-[14px] outline-none focus:border-emerald-400 mb-3" style={{ borderColor: '#EDF2F7', color: T.text }} />

        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {available.map((g) => (
            <button key={g} onClick={() => setFilter(g)} className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition active:scale-95"
              style={filter === g ? { background: T.green, color: '#fff' } : { background: '#fff', border: '1px solid #EDF2F7', color: T.sub }}>
              {g === 'Todos' ? '🔎 Todos' : `${GROUP_EMOJI[g]} ${g}`}
            </button>
          ))}
        </div>

        {exs === null ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p>
          : groups.length === 0 ? <p className="text-center py-10 text-sm" style={{ color: T.sub }}>Nenhum exercício encontrado.</p>
          : groups.map(({ group, items }) => (
            <div key={group} className="mt-4">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>{GROUP_EMOJI[group]} {group}</span>
                <span className="text-[11px]" style={{ color: '#94A3B8' }}>{items.length} exercício{items.length > 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {items.map((e) => (
                  <div key={e.id} style={card} className="p-3">
                    <div className="w-full aspect-[4/3] rounded-xl mb-2 flex items-center justify-center" style={{ background: '#0F172A' }}>
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={T.green} strokeWidth={1.7}><path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" /></svg>
                    </div>
                    <div className="text-[13px] font-semibold leading-tight" style={{ color: T.text }}>{e.name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: T.sub }}>{e.muscle} · {e.target_sets}x{e.target_reps}</div>
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: '#94A3B8' }}>{e.routineName}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
