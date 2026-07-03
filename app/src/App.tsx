import { useStore } from './lib/store'
import { healthScore, scoreLabel, bmi, waterToday, workoutsThisWeek } from './lib/metrics'
import { supabaseReady } from './lib/supabase'
import HealthRing from './components/HealthRing'
import { WeightCard, WaterCard, WorkoutCard, DailyMission } from './components/Cards'

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <svg width="30" height="30" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0b131c" stroke="rgba(52,224,161,0.3)"/><path d="M16 7c5 0 8 3.2 8 7.4 0 5-4.6 8.6-8 10.6-3.4-2-8-5.6-8-10.6C8 10.2 11 7 16 7z" fill="none" stroke="#34e0a1" strokeWidth="2"/><path d="M9 16h4l2-4 3 8 2-4h3" fill="none" stroke="#34e0a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div>
      <div className="font-extrabold tracking-tight leading-none">Encorpei</div>
      <div className="text-[10px] text-mint-400/80 font-semibold tracking-widest">HEALTH OS</div>
    </div>
  </div>
)

export default function App() {
  const { state, addWeight, addWater, toggleWorkout, addWorkout, reset } = useStore()
  const score = healthScore(state)
  const { label, tone } = scoreLabel(score)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="min-h-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <span className={`text-[11px] px-2.5 py-1 rounded-full border ${supabaseReady ? 'border-mint-500/40 text-mint-300' : 'border-white/15 text-white/45'}`}>
            {supabaseReady ? 'Supabase conectado' : 'Modo local'}
          </span>
          <button onClick={reset} className="text-white/40 hover:text-white/70 text-xs">resetar</button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mint-400 to-aqua-500 flex items-center justify-center font-bold text-ink-900">
            {state.profile.name.charAt(0)}
          </div>
        </div>
      </header>

      <section className="mt-8 flex flex-col md:flex-row items-center gap-6 fade-up">
        <HealthRing value={score} />
        <div className="flex-1 text-center md:text-left">
          <div className="text-white/50 text-sm">{greet},</div>
          <h1 className="text-3xl font-extrabold tracking-tight">{state.profile.name}</h1>
          <p className="mt-1 text-white/60 text-sm max-w-md">
            Seu score hoje está <span className={`font-bold ${tone}`}>{label}</span>. Saúde se constrói todo dia —
            complete a missão abaixo pra subir.
          </p>
          <div className="mt-4 flex gap-6 justify-center md:justify-start">
            <Mini label="IMC" value={bmi(state)?.toString() ?? '—'} />
            <Mini label="Água hoje" value={`${(waterToday(state) / 1000).toFixed(1)}L`} />
            <Mini label="Treinos/sem" value={`${workoutsThisWeek(state)}`} />
          </div>
        </div>
      </section>

      <section className="mt-8 grid md:grid-cols-2 gap-4">
        <DailyMission s={state} />
        <WaterCard s={state} onAdd={addWater} />
        <WeightCard s={state} onAdd={addWeight} />
        <WorkoutCard s={state} onToggle={toggleWorkout} onAdd={addWorkout} />
      </section>

      <footer className="mt-10 text-center text-white/25 text-xs">
        Encorpei · MVP Paciente — dados de demonstração salvos neste navegador. Wire Supabase para persistência real.
      </footer>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  )
}
