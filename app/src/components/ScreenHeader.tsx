import { useNavigate } from 'react-router-dom'

export default function ScreenHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-[#F6F8FC]/85 backdrop-blur-xl flex items-center justify-between">
      <button onClick={() => nav(-1)} aria-label="Voltar"
        className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-slate-600 hover:bg-white active:scale-95 transition">
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <h1 className="font-semibold text-slate-900">{title}</h1>
      <div className="w-9 flex justify-end">{action}</div>
    </header>
  )
}
