import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { type UserExercise } from '../lib/workoutStore'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { createRoutine } from '../lib/training'
import { workoutsApi } from '../lib/workoutStore'
import { T } from '../components/musc/tokens'

const nameChips = ['Treino A', 'Treino B', 'Treino C', 'Treino D', 'Full Body']
type Draft = Omit<UserExercise, 'id'>

export default function NovoTreino() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('Treino A')
  const [list, setList] = useState<Draft[]>([])
  const [ex, setEx] = useState<Draft>({ name: '', sets: 3, reps: 12, load: 20 })

  const addExercise = () => {
    if (!ex.name.trim()) return
    setList((l) => [...l, { ...ex, name: ex.name.trim() }])
    setEx({ name: '', sets: 3, reps: 12, load: 20 })
  }
  const save = async () => {
    if (!list.length) return
    if (user && supabaseReady) {
      try { await createRoutine(user.id, name, list) } catch (e) { console.error(e) }
    } else { workoutsApi.add(name, list) }
    nav('/musculacao')
  }

  const field = (label: string, val: number, on: (v: number) => void) => (
    <div className="flex-1">
      <div className="text-[11px] mb-1" style={{ color: T.sub }}>{label}</div>
      <input value={val} inputMode="numeric" onChange={(e) => on(parseInt(e.target.value || '0', 10) || 0)}
        className="w-full bg-white border rounded-2xl px-3 py-2.5 text-center outline-none focus:border-emerald-400" style={{ borderColor: T.border }} />
    </div>
  )

  return (
    <div style={{ background: T.bg }} className="min-h-screen">
      <div className="max-w-[440px] mx-auto px-6 pb-28">
        <ScreenHeader title="Novo treino" />

        <div className="text-[13px] mb-2" style={{ color: T.sub }}>Nome do treino</div>
        <div className="flex gap-2 flex-wrap mb-2">
          {nameChips.map((n) => (
            <button key={n} onClick={() => setName(n)}
              className="px-3 py-1.5 rounded-full text-[13px] font-medium transition"
              style={name === n ? { background: T.greenBtn, color: '#fff' } : { background: '#fff', color: T.sub, boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>{n}</button>
          ))}
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ou digite um nome"
          className="w-full bg-white rounded-2xl px-4 py-3 outline-none mb-5" style={{ boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }} />

        <div className="rounded-[24px] p-5 mb-4" style={{ background: '#fff', boxShadow: '0 6px 22px rgba(15,23,42,0.07)' }}>
          <div className="font-semibold mb-3" style={{ color: T.text }}>Adicionar exercício</div>
          <input value={ex.name} onChange={(e) => setEx({ ...ex, name: e.target.value })} placeholder="Aparelho / exercício (ex: Supino reto)"
            className="w-full bg-white border rounded-2xl px-4 py-3 outline-none focus:border-emerald-400 mb-3" style={{ borderColor: T.border }} />
          <div className="flex gap-2">
            {field('Séries', ex.sets, (v) => setEx({ ...ex, sets: v }))}
            {field('Reps', ex.reps, (v) => setEx({ ...ex, reps: v }))}
            {field('Carga (kg)', ex.load, (v) => setEx({ ...ex, load: v }))}
          </div>
          <button onClick={addExercise} className="w-full mt-3 py-2.5 rounded-2xl font-semibold text-white active:scale-95 transition" style={{ background: T.green }}>+ Adicionar exercício</button>
        </div>

        {list.length > 0 && (
          <div className="rounded-[24px] p-4 mb-4" style={{ background: '#fff', boxShadow: '0 6px 22px rgba(15,23,42,0.07)' }}>
            <div className="font-semibold mb-2" style={{ color: T.text }}>{name} · {list.length} exercícios</div>
            {list.map((e, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-t first:border-t-0" style={{ borderColor: T.border }}>
                <div>
                  <div className="text-[14px] font-medium" style={{ color: T.text }}>{e.name}</div>
                  <div className="text-[12px]" style={{ color: T.sub }}>{e.sets}x{e.reps} · {e.load} kg</div>
                </div>
                <button onClick={() => setList((l) => l.filter((_, j) => j !== i))} className="text-rose-500 text-sm">remover</button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl px-4 py-3 mb-4 text-[12px]" style={{ background: '#EFF4FF', color: '#3B6FB5' }}>
          🧠 Os músculos trabalhados e a imagem do treino serão identificados automaticamente pela IA a partir dos aparelhos — em breve.
        </div>

        <button onClick={save} disabled={!list.length}
          className="w-full py-3.5 rounded-2xl font-semibold text-white disabled:opacity-40 active:scale-[0.99] transition"
          style={{ background: T.greenBtn }}>Salvar treino</button>
      </div>
    </div>
  )
}
