import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Confetti from '../components/Confetti'
import { workouts as staticWorkouts, type SplitKey } from '../lib/musculacao'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { fetchRoutines, saveSession, computeProgression } from '../lib/training'

type Set = { load: number; reps: number; rpe: number; done: boolean }
type Ex = { name: string; muscle: string; rest: number; targetReps: string; note?: string; sets: Set[] }

const L = { bg: '#F6F8FC', card: '#FFFFFF', border: '#E4E9F1', text: '#0F172A', sub: '#64748B', green: '#16C784', greenHi: '#22C55E', track: '#EDF2F7' }
const shadow = '0 8px 24px rgba(15,23,42,0.08)'
const firstNum = (s: string) => parseInt(s) || 10

export default function TreinoExecucao() {
  const { key } = useParams<{ key: string }>()
  const nav = useNavigate()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [routineId, setRoutineId] = useState<string | null>(null)
  const [ex, setEx] = useState<Ex[] | null>(null)
  const [active, setActive] = useState(0)
  const [rest, setRest] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [fire, setFire] = useState(0)
  const [finished, setFinished] = useState(false)
  const [foco, setFoco] = useState(false)
  const TARGET = 45 * 60

  useEffect(() => {
    let alive = true
    async function load() {
      if (user && supabaseReady && key) {
        try {
          const rs = await fetchRoutines(user.id)
          const r = rs.find((x) => x.id === key)
          if (r && alive) {
            setName(r.name); setRoutineId(r.id)
            let lastByExercise: Record<string, number> = {}
            try { lastByExercise = (await computeProgression(user.id)).lastByExercise } catch { /* ok */ }
            setEx(r.exercises.map((e) => ({
              name: e.name, muscle: e.muscle, rest: e.rest_sec, targetReps: e.target_reps, note: e.note,
              sets: Array.from({ length: e.target_sets }, () => ({ load: lastByExercise[e.name] || 0, reps: firstNum(e.target_reps), rpe: 8, done: false })),
            })))
            return
          }
        } catch { /* fallback */ }
      }
      const s = staticWorkouts[key as SplitKey]
      if (s && alive) {
        setName(s.name)
        setEx(s.exercises.map((e) => ({ name: e.name, muscle: e.group, rest: parseInt(e.rest) || 60, targetReps: String(e.sets[0]?.reps ?? 10), note: undefined,
          sets: e.sets.map((x) => ({ load: x.load, reps: x.reps, rpe: 8, done: false })) })))
      } else if (alive) setEx([])
    }
    load()
    return () => { alive = false }
  }, [user?.id, key])

  useEffect(() => { const t = setInterval(() => setElapsed((e) => e + 1), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    if (rest == null) return
    if (rest <= 0) { setRest(null); return }
    const t = setTimeout(() => setRest((r) => (r ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [rest])

  const totals = useMemo(() => {
    let total = 0, done = 0, exDone = 0, volume = 0
    ;(ex || []).forEach((e) => {
      const d = e.sets.filter((s) => s.done).length
      total += e.sets.length; done += d
      if (d === e.sets.length && e.sets.length) exDone++
      e.sets.forEach((s) => { if (s.done) volume += s.load * s.reps })
    })
    return { total, done, exDone, volume, pct: total ? Math.round((done / total) * 100) : 0 }
  }, [ex])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (ex === null) return <div style={{ background: L.bg, minHeight: '100vh' }} className="flex items-center justify-center" ><span className="animate-pulse" style={{ color: L.sub }}>Carregando treino…</span></div>
  if (ex.length === 0) return <div style={{ background: L.bg, minHeight: '100vh' }} className="flex flex-col items-center justify-center gap-3"><span style={{ color: L.sub }}>Treino não encontrado.</span><button onClick={() => nav('/musculacao')} className="text-white px-4 py-2 rounded-xl" style={{ background: L.green }}>Voltar</button></div>

  const cur = ex[active]
  const nextSetIdx = cur.sets.findIndex((s) => !s.done)

  const setField = (setI: number, f: 'load' | 'reps', v: string) => {
    const n = parseInt(v || '0', 10) || 0
    // guarda o valor e preenche as próximas séries ainda não concluídas (não digita 4x)
    setEx((prev) => prev!.map((e, i) => i === active ? { ...e, sets: e.sets.map((s, j) => {
      if (j === setI) return { ...s, [f]: n }
      if (j > setI && !s.done) return { ...s, [f]: n }
      return s
    }) } : e))
  }
  const toggleSet = (setI: number) => setEx((prev) => prev!.map((e, i) => i === active ? { ...e, sets: e.sets.map((s, j) => j === setI ? { ...s, done: !s.done } : s) } : e))
  const nextPendingAfter = (list: Ex[], from: number) => {
    for (let i = from + 1; i < list.length; i++) if (list[i].sets.some((s) => !s.done)) return i
    for (let i = 0; i < list.length; i++) if (i !== from && list[i].sets.some((s) => !s.done)) return i
    return -1
  }
  const concluirSerie = () => {
    if (nextSetIdx < 0) return
    toggleSet(nextSetIdx); setRest(cur.rest)
    if (nextSetIdx === cur.sets.length - 1) {
      const nx = nextPendingAfter(ex, active)
      if (nx >= 0) setTimeout(() => setActive(nx), 400)
    }
  }

  const finalizar = async () => {
    setFire((f) => f + 1); setFinished(true)
    if (user && supabaseReady && routineId) {
      const sets = ex.flatMap((e) => e.sets.map((s, i) => ({ exercise: e.name, index: i, load: s.load, reps: s.reps, rpe: s.rpe, done: s.done })).filter((s) => s.done))
      try { await saveSession(user.id, routineId, name, sets, elapsed) } catch (e) { console.error('saveSession', e) }
    }
  }

  if (finished) return (
    <div style={{ background: L.bg, minHeight: '100vh', color: L.text }} className="flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: L.green }}>
        <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><path d="M5 12l5 5L20 6" /></svg>
      </div>
      <h2 className="text-2xl font-bold mt-4">{name} concluído!</h2>
      <p className="text-sm mt-1" style={{ color: L.sub }}>{user && supabaseReady ? 'Sessão salva no seu perfil.' : 'Faça login pra salvar.'}</p>
      <div className="grid grid-cols-3 gap-3 mt-6 w-full max-w-xs">
        {[['Séries', `${totals.done}/${totals.total}`], ['Volume', `${totals.volume.toLocaleString('pt-BR')}kg`], ['Tempo', fmt(elapsed)]].map(([l, v]) => (
          <div key={l} className="rounded-2xl p-4" style={{ background: L.card, boxShadow: shadow }}><div className="text-lg font-bold">{v}</div><div className="text-xs" style={{ color: L.sub }}>{l}</div></div>
        ))}
      </div>
      <button onClick={() => nav('/musculacao')} className="mt-8 w-full max-w-xs py-3 rounded-2xl font-semibold text-white" style={{ background: L.green }}>Voltar</button>
      <Confetti fire={fire} />
    </div>
  )

  const Thumb = () => (
    <div className="w-[64px] h-[48px] rounded-xl shrink-0 flex items-center justify-center" style={{ background: '#0F172A' }}>
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={L.green} strokeWidth={1.7}><path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" /></svg>
    </div>
  )

  if (foco) {
    const over = elapsed > TARGET
    return (
      <div style={{ background: L.bg, minHeight: '100vh', color: L.text }} className="flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4">
          <button onClick={() => setFoco(false)} className="text-[13px] font-semibold" style={{ color: L.sub }}>✕ Sair do foco</button>
          <div className="text-[14px] font-bold tabular-nums" style={{ color: over ? '#EF4444' : L.text }}>{fmt(elapsed)} / {fmt(TARGET)}</div>
        </div>
        <div className="h-1.5 mx-5 mt-2 rounded-full" style={{ background: L.track }}><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, elapsed / TARGET * 100)}%`, background: over ? '#EF4444' : L.green }} /></div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-[13px]" style={{ color: L.sub }}>Exercício {active + 1} de {ex.length}</div>
          <h2 className="text-[26px] font-bold mt-1 leading-tight" style={{ color: L.text }}>{cur.name}</h2>
          <div className="text-[13px] mt-1" style={{ color: L.sub }}>{cur.muscle} · alvo {cur.sets.length}x{cur.targetReps}</div>
          {cur.note && <div className="mt-3 text-[13px] rounded-xl px-3 py-2 max-w-xs" style={{ background: '#FFF7ED', color: '#9A5B0E' }}>💡 {cur.note}</div>}
          {rest != null && rest > 0 ? (
            <div className="mt-8"><div className="text-[13px]" style={{ color: L.sub }}>Descanse</div><div className="text-[56px] font-bold tabular-nums" style={{ color: L.green }}>{fmt(rest)}</div><button onClick={() => setRest(null)} className="text-[13px] font-semibold" style={{ color: L.sub }}>Pular descanso</button></div>
          ) : nextSetIdx >= 0 ? (
            <>
              <div className="mt-8 text-[13px] font-semibold" style={{ color: L.green }}>Série {nextSetIdx + 1} de {cur.sets.length}</div>
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="flex items-center gap-1"><input value={cur.sets[nextSetIdx].load || ''} onChange={(e) => setField(nextSetIdx, 'load', e.target.value)} inputMode="numeric" placeholder="0" className="w-24 bg-white border rounded-2xl py-3 text-center text-[22px] font-bold outline-none focus:border-emerald-400" style={{ borderColor: L.border }} /><span style={{ color: L.sub }}>kg</span></div>
                <div className="flex items-center gap-1"><input value={cur.sets[nextSetIdx].reps || ''} onChange={(e) => setField(nextSetIdx, 'reps', e.target.value)} inputMode="numeric" placeholder="0" className="w-20 bg-white border rounded-2xl py-3 text-center text-[22px] font-bold outline-none focus:border-emerald-400" style={{ borderColor: L.border }} /><span style={{ color: L.sub }}>reps</span></div>
              </div>
              <button onClick={concluirSerie} className="mt-8 w-full max-w-xs py-4 rounded-2xl font-bold text-white text-[17px] active:scale-[0.98] transition" style={{ background: L.green }}>Concluir série {nextSetIdx + 1}</button>
            </>
          ) : active < ex.length - 1 ? (
            <button onClick={() => setActive((a) => a + 1)} className="mt-8 w-full max-w-xs py-4 rounded-2xl font-bold text-white text-[17px]" style={{ background: L.green }}>Próximo exercício →</button>
          ) : (
            <button onClick={finalizar} className="mt-8 w-full max-w-xs py-4 rounded-2xl font-bold text-white text-[17px]" style={{ background: L.green }}>Finalizar treino</button>
          )}
        </div>
        <div className="text-center pb-6 text-[12px]" style={{ color: L.sub }}>{over ? 'Passou dos 45 min — acelere o descanso.' : `Faltam ${fmt(TARGET - elapsed)} pra bater o tempo`}</div>
      </div>
    )
  }

  return (
    <div style={{ background: L.bg, minHeight: '100vh', color: L.text }}>
      <div className="max-w-[460px] mx-auto px-5 pb-40">
        <div className="flex items-center justify-between pt-4">
          <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: L.card, boxShadow: shadow }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={L.text} strokeWidth={2} strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <div className="text-center px-2"><div className="text-[16px] font-bold leading-tight">{name}</div><div className="text-[12px]" style={{ color: L.sub }}>em andamento</div></div>
          <div className="w-9" />
        </div>

        <div className="rounded-2xl p-4 mt-4 flex items-center gap-4" style={{ background: L.card, boxShadow: shadow }}>
          <div className="relative w-16 h-16 shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="27" fill="none" stroke={L.track} strokeWidth="6" />
              <circle cx="32" cy="32" r="27" fill="none" stroke={L.green} strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 27} strokeDashoffset={2 * Math.PI * 27 * (1 - totals.pct / 100)} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset .4s' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[15px] font-bold">{totals.pct}%</div>
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold" style={{ color: L.green }}>Treino em andamento</div>
            <div className="text-[13px]" style={{ color: L.sub }}>{totals.exDone} de {ex.length} exercícios concluídos</div>
            <div className="mt-2 h-1.5 rounded-full" style={{ background: L.track }}><div className="h-full rounded-full" style={{ width: `${totals.pct}%`, background: L.green, transition: 'width .3s' }} /></div>
          </div>
          <div className="text-right"><div className="text-[20px] font-bold tabular-nums">{fmt(elapsed)}</div><div className="text-[11px]" style={{ color: L.sub }}>tempo</div></div>
        </div>

        <button onClick={() => setFoco(true)} className="w-full mt-4 py-3 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.99] transition" style={{ background: 'linear-gradient(180deg,#14D890,#12C47C)' }}>
          🎯 Modo foco — terminar em 45 min
        </button>
        <div className="mt-4 mb-2 text-[12px] font-semibold tracking-wider" style={{ color: L.sub }}>EXERCÍCIOS</div>

        {ex.map((e, i) => {
          if (i === active) return (
        <div key={i} className="rounded-2xl p-4 mb-3" style={{ background: '#F6FEFA', border: `1.5px solid ${L.greenHi}`, boxShadow: shadow }}>
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 text-white" style={{ background: L.green }}>{active + 1}</span>
            <Thumb />
            <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold truncate">{cur.name}</div><div className="text-[12px]" style={{ color: L.sub }}>{cur.muscle} · alvo {cur.sets.length}x{cur.targetReps}</div></div>
          </div>
          <div className="mt-2 mb-1 flex items-center justify-between px-1 text-[11px]" style={{ color: L.sub }}>
            <span>Série</span><span>Carga · Reps · marque quando fizer</span>
          </div>
          <div className="space-y-2">
            {cur.sets.map((s, i) => {
              const isNext = i === nextSetIdx
              return (
                <div key={i} className="flex items-center gap-2 rounded-2xl px-2 py-2" style={{ background: s.done ? '#F3FCF7' : '#fff', border: `1px solid ${isNext ? L.greenHi : L.border}` }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: s.done ? L.green : '#F1F5F9', color: s.done ? '#fff' : L.sub }}>{i + 1}</span>
                  <div className="flex-1 flex items-center gap-1 min-w-0">
                    <input value={s.load || ''} onChange={(e) => setField(i, 'load', e.target.value)} inputMode="numeric" placeholder="0"
                      className="w-full bg-white border rounded-xl py-2 text-center text-[15px] outline-none focus:border-emerald-400" style={{ borderColor: L.border }} />
                    <span className="text-[11px] shrink-0" style={{ color: L.sub }}>kg</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1 min-w-0">
                    <input value={s.reps || ''} onChange={(e) => setField(i, 'reps', e.target.value)} inputMode="numeric" placeholder="0"
                      className="w-full bg-white border rounded-xl py-2 text-center text-[15px] outline-none focus:border-emerald-400" style={{ borderColor: L.border }} />
                    <span className="text-[11px] shrink-0" style={{ color: L.sub }}>reps</span>
                  </div>
                  <button onClick={() => toggleSet(i)} aria-label="Marcar série" className="shrink-0">
                    <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: s.done ? L.green : 'transparent', border: s.done ? 'none' : `1.5px solid #CBD5E1` }}>
                      {s.done && <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><path d="M5 12l5 5L20 6" /></svg>}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={concluirSerie} disabled={nextSetIdx < 0} className="flex-1 py-3 rounded-xl font-bold text-[13px] text-white disabled:opacity-40" style={{ background: L.green }}>
              {nextSetIdx < 0 ? 'EXERCÍCIO CONCLUÍDO' : `CONCLUIR SÉRIE ${nextSetIdx + 1}`}
            </button>
            <button onClick={() => setRest(cur.rest)} className="px-4 py-2 rounded-xl text-[12px] flex flex-col items-center bg-white" style={{ border: `1px solid ${L.border}`, color: L.text }}>
              <span style={{ color: L.sub }}>Descanso</span><span className="font-bold tabular-nums">{rest != null ? fmt(rest) : fmt(cur.rest)}</span>
            </button>
          </div>
        </div>
          )
          const done = e.sets.length > 0 && e.sets.every((s) => s.done)
          return (
            <button key={i} onClick={() => setActive(i)} className="w-full flex items-center gap-3 rounded-2xl p-3 mb-2 text-left transition"
              style={{ background: done ? '#ECFDF5' : L.card, border: `1.5px solid ${done ? '#16C784' : 'transparent'}`, boxShadow: done ? 'none' : shadow }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 text-white"
                style={{ background: done ? '#16C784' : '#F1F5F9', color: done ? '#fff' : L.sub }}>
                {done ? <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><path d="M5 12l5 5L20 6" /></svg> : i + 1}
              </span>
              <Thumb />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold truncate" style={{ color: done ? '#047857' : L.text }}>{e.name}</div>
                <div className="text-[12px]" style={{ color: L.sub }}>{done ? 'Concluído ✓' : e.muscle}</div>
                <div className="text-[11px]" style={{ color: L.sub }}>{e.sets.length} séries · {e.targetReps} reps · {e.rest}s</div>
              </div>
              <span style={{ color: done ? '#16C784' : '#CBD5E1' }}>{done ? '✓' : '›'}</span>
            </button>
          )
        })}
      </div>

      <div className="fixed inset-x-0 z-10" style={{ background: L.card, borderTop: `1px solid ${L.border}`, bottom: 'calc(74px + env(safe-area-inset-bottom))' }}>
        <div className="max-w-[460px] mx-auto px-5 py-3 flex items-center justify-between">
          <Stat icon="⏱" v={fmt(elapsed)} l="tempo" />
          <Stat icon="🔥" v={`${Math.round(totals.volume / 200 + elapsed / 6)}`} l="kcal" />
          <Stat icon="🏆" v={String(totals.exDone)} l="feitos" />
          <button onClick={finalizar} className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-white" style={{ background: L.green }}>FINALIZAR</button>
        </div>
      </div>
    </div>
  )
}
function Stat({ icon, v, l }: { icon: string; v: string; l: string }) {
  return <div className="flex items-center gap-1.5"><span>{icon}</span><div><div className="text-[14px] font-bold leading-none" style={{ color: '#0F172A' }}>{v}</div><div className="text-[10px]" style={{ color: '#64748B' }}>{l}</div></div></div>
}
