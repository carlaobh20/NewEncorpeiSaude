import { useNavigate } from 'react-router-dom'
import { T } from './tokens'

const left = [
  { key: 'resumo', label: 'Resumo', active: true, d: 'M4 13h6V4H4zM14 21h6v-9h-6zM14 4v5h6V4zM4 21h6v-4H4z' },
  { key: 'ex', label: 'Exercícios', d: 'M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11' },
]
const right = [
  { key: 'stats', label: 'Estatísticas', d: 'M6 20V10M12 20V4M18 20v-6' },
  { key: 'mais', label: 'Mais', d: 'M5 12h.01M12 12h.01M19 12h.01' },
]
export default function BottomNavigation() {
  const nav = useNavigate()
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 pointer-events-none">
      <div className="max-w-[440px] mx-auto px-6 pointer-events-auto" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="relative flex items-center h-[70px] px-2"
          style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 28, boxShadow: '0 10px 30px rgba(15,23,42,0.12)' }}>
          <div className="flex-1 flex justify-around">
            {left.map((i) => <Item key={i.key} i={i} onClick={() => nav(i.key === 'ex' ? '/musculacao/exercicios' : '/musculacao')} />)}
          </div>
          <div className="w-16 shrink-0" />
          <div className="flex-1 flex justify-around">
            {right.map((i) => <Item key={i.key} i={i} onClick={() => nav(i.key === 'stats' ? '/musculacao/estatisticas' : '/perfil')} />)}
          </div>
          <button onClick={() => nav('/musculacao/novo')} aria-label="Adicionar treino"
            className="absolute left-1/2 -translate-x-1/2 -top-6 w-15 h-15 rounded-full flex items-center justify-center text-white active:scale-90 transition"
            style={{ width: 58, height: 58, background: T.greenBtn, boxShadow: '0 10px 24px -6px rgba(22,199,132,0.7)' }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
function Item({ i, onClick }: { i: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1" style={{ color: i.active ? T.green : '#94A3B8' }}>
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={i.d} /></svg>
      <span className="text-[10px] font-medium">{i.label}</span>
    </button>
  )
}
