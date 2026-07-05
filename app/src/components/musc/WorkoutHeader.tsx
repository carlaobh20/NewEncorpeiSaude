import { useNavigate } from 'react-router-dom'
import { T } from './tokens'
export default function WorkoutHeader() {
  const nav = useNavigate()
  return (
    <div className="flex items-center gap-3 pt-2 pb-4">
      <button onClick={() => nav(-1)} aria-label="Voltar"
        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition" style={{ color: T.text }}>
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <div>
        <h1 className="text-[22px] font-bold leading-tight" style={{ color: T.text }}>Musculação</h1>
        <p className="text-[13px]" style={{ color: T.sub }}>Seu treino, sua evolução.</p>
      </div>
    </div>
  )
}
