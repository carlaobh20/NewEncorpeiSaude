import { useNavigate } from 'react-router-dom'
import { T, cardStyle } from './tokens'

const chips = [
  { label: 'Histórico', to: 'historico', d: 'M12 7v5l3 2', circle: true },
  { label: 'Exercícios', to: 'exercicios', d: 'M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11' },
  { label: 'Grupos', to: 'grupos', d: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0' },
  { label: 'Avaliações', to: 'avaliacoes', d: 'M9 12l2 2 4-4M4 6h16v14H4z' },
  { label: 'Fotos', to: 'fotos', d: 'M4 7h4l2-2h4l2 2h4v13H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z' },
  { label: 'Estatísticas', to: 'estatisticas', d: 'M6 20V10M12 20V4M18 20v-6' },
]
export default function ChipsNav() {
  const nav = useNavigate()
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {chips.map((c) => (
        <button key={c.label} onClick={() => nav(`/musculacao/${c.to}`)} className="flex flex-col items-center gap-1 active:scale-90 transition">
          <span className="w-11 h-11 flex items-center justify-center" style={{ ...cardStyle, borderRadius: 16 }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={T.green} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{c.circle && <circle cx="12" cy="12" r="9" />}<path d={c.d} /></svg>
          </span>
          <span className="text-[9px] text-center leading-tight" style={{ color: T.sub }}>{c.label}</span>
        </button>
      ))}
    </div>
  )
}
