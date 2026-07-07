import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, cardStyle } from './tokens'
import { useMusc } from '../../lib/MuscContext'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchWeekSessions, suggestWorkout, type Suggestion } from '../../lib/trainingSmart'

export default function WorkoutCard() {
  const nav = useNavigate()
  const { user } = useAuth()
  const { routines, loading } = useMusc()
  const [sug, setSug] = useState<Suggestion | null>(null)

  useEffect(() => {
    if (!routines.length) { setSug(null); return }
    if (user && supabaseReady) {
      fetchWeekSessions(user.id)
        .then((week) => setSug(suggestWorkout(routines, week)))
        .catch(() => setSug(suggestWorkout(routines, [])))
    } else {
      setSug(suggestWorkout(routines, []))
    }
  }, [user, routines])

  const startBtn = (id: string, label: string, solid = true) => (
    <button onClick={() => nav(`/musculacao/treino/${id}`)}
      className="w-full flex items-center justify-center gap-2 font-semibold text-[15px] active:scale-[0.99] transition"
      style={solid
        ? { background: 'linear-gradient(180deg,#14D890,#12C47C)', color: '#fff', borderRadius: 18, height: 52 }
        : { background: '#F1F5F9', color: T.text, borderRadius: 18, height: 48 }}>
      {solid && <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
      {label}
    </button>
  )

  return (
    <div style={{ ...cardStyle, borderRadius: 28, padding: 20 }}>
      <div className="text-[12px]" style={{ color: T.sub }}>Treino de hoje</div>

      {loading || (routines.length > 0 && !sug) ? (
        <div className="text-[18px] font-bold mt-1 animate-pulse" style={{ color: T.sub }}>Carregando…</div>
      ) : routines.length === 0 ? (
        <>
          <div className="text-[20px] font-bold mt-1" style={{ color: T.text }}>Nenhum treino ainda</div>
          <p className="text-[13px] mt-1" style={{ color: T.sub }}>Crie seu primeiro treino pra começar.</p>
          <div className="mt-4">{/* criar */}
            <button onClick={() => nav('/musculacao/novo')}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold text-[15px] active:scale-[0.99] transition"
              style={{ background: 'linear-gradient(180deg,#14D890,#12C47C)', borderRadius: 18, height: 52 }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg> Criar treino
            </button>
          </div>
        </>
      ) : sug && sug.primary ? (
        <>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-[16px] font-bold text-white shrink-0" style={{ background: '#0F172A' }}>{sug.primary.letter}</span>
            <div className="text-[19px] font-bold leading-tight" style={{ color: T.text }}>{sug.primary.routine.name}</div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full" style={sug.doneToday ? { background: '#EAFBF1', color: T.green } : sug.catchUp ? { background: '#FEF3C7', color: '#B45309' } : { background: '#EAFBF1', color: T.green }}>
              {sug.doneToday ? 'Concluído hoje ✅' : sug.catchUp ? 'Escolha o treino' : 'Planejado pra hoje'}
            </span>
            <span className="text-[12px] px-3 py-1 rounded-full" style={{ background: T.bg, color: T.sub }}>🏋 {sug.primary.routine.exercises.length} exercícios</span>
            {sug.primary.routine.cardio_min ? <span className="text-[12px] px-3 py-1 rounded-full" style={{ background: T.bg, color: T.sub }}>🏃 {sug.primary.routine.cardio_min} min</span> : null}
          </div>

          <p className="text-[12px] mt-2" style={{ color: T.sub }}>{sug.reason}</p>

          {!sug.doneToday && (
            <div className="mt-4 space-y-2">
              {startBtn(sug.primary.routine.id, sug.catchUp ? `Fazer o ideal · Treino ${sug.primary.letter}` : 'Iniciar treino')}
              {sug.catchUp && startBtn(sug.catchUp.routine.id, `Recuperar o Treino ${sug.catchUp.letter} · ${sug.catchUp.routine.focus}`, false)}
            </div>
          )}
          {sug.doneToday && (
            <div className="mt-4">{startBtn(sug.primary.routine.id, 'Treinar de novo mesmo assim', false)}</div>
          )}
        </>
      ) : (
        <>
          <div className="text-[20px] font-bold mt-1" style={{ color: T.text }}>{sug?.reason || 'Semana completa 🎉'}</div>
          <p className="text-[13px] mt-1" style={{ color: T.sub }}>Descanse ou repita um treino pela lista abaixo.</p>
        </>
      )}
    </div>
  )
}
