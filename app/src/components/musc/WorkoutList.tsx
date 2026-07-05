import { useNavigate } from 'react-router-dom'
import { T, cardStyle } from './tokens'
import { useMusc } from '../../lib/MuscContext'

export default function WorkoutList() {
  const nav = useNavigate()
  const { routines, loading } = useMusc()

  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-[14px]" style={{ color: T.text }}>Meus treinos</h3>
        <button className="text-[13px] font-medium" style={{ color: T.green }}>Ver calendário</button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-[13px]" style={{ color: T.sub }}>Carregando seus treinos…</div>
      ) : !routines || routines.length === 0 ? (
        <button onClick={() => nav('/musculacao/novo')}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl active:scale-[0.99] transition"
          style={{ border: `2px dashed ${T.border}` }}>
          <span className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: T.greenBtn }}>
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </span>
          <span className="text-[14px] font-semibold" style={{ color: T.text }}>Adicionar treino</span>
        </button>
      ) : (
        <div className="space-y-2.5">
          {routines.map((r) => (
            <button key={r.id} onClick={() => nav(`/musculacao/treino/${r.id}`)}
              className="w-full flex items-center justify-between text-left active:scale-[0.99] transition"
              style={{ padding: 14, borderRadius: 18, border: `1px solid ${T.border}`, background: '#fff' }}>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: T.text }}>{r.name}</div>
                <div className="text-[11px]" style={{ color: T.sub }}>{r.exercises.length} exercícios{r.cardio_min ? ` · ${r.cardio_min} min cardio` : ''}</div>
              </div>
              <span style={{ color: '#CBD5E1' }}>›</span>
            </button>
          ))}
          <button onClick={() => nav('/musculacao/novo')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold active:scale-[0.99] transition"
            style={{ border: `1.5px dashed ${T.border}`, color: T.green }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Adicionar treino
          </button>
        </div>
      )}
    </div>
  )
}
