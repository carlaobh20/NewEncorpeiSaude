import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T, cardStyle } from './tokens'
import { useMusc } from '../../lib/MuscContext'
import { useAuth } from '../../lib/auth'
import { deleteRoutine } from '../../lib/training'

export default function WorkoutList() {
  const nav = useNavigate()
  const { user } = useAuth()
  const { routines, loading, reload } = useMusc()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const del = async (id: string) => {
    if (!user) return
    try { await deleteRoutine(user.id, id); setConfirmId(null); reload() } catch { setConfirmId(null) }
  }

  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-[14px]" style={{ color: T.text }}>Meus treinos</h3>
        <button onClick={() => nav('/musculacao/novo')} className="text-[13px] font-medium" style={{ color: T.green }}>+ Adicionar</button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-[13px]" style={{ color: T.sub }}>Carregando seus treinos…</div>
      ) : !routines || routines.length === 0 ? (
        <button onClick={() => nav('/musculacao/novo')}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl active:scale-[0.99] transition" style={{ border: `2px dashed ${T.border}` }}>
          <span className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: T.greenBtn }}>
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </span>
          <span className="text-[14px] font-semibold" style={{ color: T.text }}>Adicionar treino</span>
        </button>
      ) : (
        <div className="space-y-2.5">
          {routines.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <button onClick={() => nav(`/musculacao/treino/${r.id}`)} className="flex-1 flex items-center justify-between text-left active:scale-[0.99] transition"
                style={{ padding: 14, borderRadius: 18, border: `1px solid ${T.border}`, background: '#fff' }}>
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: T.text }}>{r.name}</div>
                  <div className="text-[11px]" style={{ color: T.sub }}>{r.exercises.length} exercícios{r.cardio_min ? ` · ${r.cardio_min}min cardio` : ''}</div>
                </div>
                <span style={{ color: '#CBD5E1' }}>›</span>
              </button>
              {confirmId === r.id ? (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => del(r.id)} className="text-[11px] font-semibold px-2.5 py-2 rounded-xl text-white" style={{ background: '#EF4444' }}>Excluir</button>
                  <button onClick={() => setConfirmId(null)} className="text-[11px] px-2.5 py-2 rounded-xl" style={{ background: T.lightGray, color: T.sub }}>Não</button>
                </div>
              ) : (
                <button onClick={() => setConfirmId(r.id)} aria-label="Excluir treino" className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.lightGray }}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#94A3B8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
                </button>
              )}
            </div>
          ))}
          <button onClick={() => nav('/musculacao/novo')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold active:scale-[0.99] transition" style={{ border: `1.5px dashed ${T.border}`, color: T.green }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg> Adicionar treino
          </button>
        </div>
      )}
    </div>
  )
}
