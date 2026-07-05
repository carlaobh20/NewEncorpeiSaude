import { useNavigate } from 'react-router-dom'
import { T, cardStyle } from './tokens'
import { useMusc } from '../../lib/MuscContext'

export default function WorkoutCard() {
  const nav = useNavigate()
  const { routines, loading } = useMusc()
  const r = routines?.[0]

  return (
    <div style={{ ...cardStyle, borderRadius: 28, padding: 20 }}>
      <div className="text-[12px]" style={{ color: T.sub }}>Próximo treino{r ? ' · Hoje' : ''}</div>

      {loading ? (
        <div className="text-[18px] font-bold mt-1 animate-pulse" style={{ color: T.sub }}>Carregando…</div>
      ) : r ? (
        <>
          <div className="text-[20px] font-bold mt-1 leading-tight" style={{ color: T.text }}>{r.name}</div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full" style={{ background: '#EAFBF1', color: T.green }}>Planejado</span>
            <span className="text-[12px] px-3 py-1 rounded-full" style={{ background: T.bg, color: T.sub }}>🏋 {r.exercises.length} exercícios</span>
            {r.cardio_min ? <span className="text-[12px] px-3 py-1 rounded-full" style={{ background: T.bg, color: T.sub }}>🏃 {r.cardio_min} min cardio</span> : null}
          </div>
          <button onClick={() => nav(`/musculacao/treino/${r.id}`)}
            className="mt-4 w-full flex items-center justify-center gap-2 text-white font-semibold text-[15px] active:scale-[0.99] transition"
            style={{ background: 'linear-gradient(180deg,#14D890,#12C47C)', borderRadius: 18, height: 52 }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> Iniciar treino
          </button>
        </>
      ) : (
        <>
          <div className="text-[20px] font-bold mt-1" style={{ color: T.text }}>Nenhum treino ainda</div>
          <p className="text-[13px] mt-1" style={{ color: T.sub }}>Crie seu primeiro treino pra começar.</p>
          <button onClick={() => nav('/musculacao/novo')}
            className="mt-4 w-full flex items-center justify-center gap-2 text-white font-semibold text-[15px] active:scale-[0.99] transition"
            style={{ background: 'linear-gradient(180deg,#14D890,#12C47C)', borderRadius: 18, height: 52 }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg> Criar treino
          </button>
        </>
      )}
    </div>
  )
}
