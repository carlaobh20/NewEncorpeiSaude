import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getWater } from '../lib/db'
import { getSleep, todayNutrition, listSupplements, takenToday, todayISO } from '../lib/health'
import { fetchRoutines } from '../lib/training'
import { getActiveFast } from '../lib/fasting'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6', green: '#16C784' }
const card = { background: '#fff', borderRadius: 18, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }
type Item = { icon: string; label: string; value: string; ok: boolean; to: string }

export default function Agenda() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [items, setItems] = useState<Item[] | null>(null)

  useEffect(() => {
    if (!user || !supabaseReady) { setItems([]); return }
    const d = todayISO()
    Promise.all([
      fetchRoutines(user.id).catch(() => []),
      getWater(user.id, d).catch(() => 0),
      getSleep(user.id, d).catch(() => null),
      todayNutrition(user.id, d).catch(() => ({ calories: 0, protein: 0 })),
      listSupplements(user.id).catch(() => []),
      takenToday(user.id, d).catch(() => new Set<string>()),
      getActiveFast(user.id).catch(() => null),
    ]).then(([routines, water, sleep, nutri, sups, taken, fast]) => {
      const list: Item[] = [
        { icon: '🏋️', label: 'Treino de hoje', value: routines[0] ? routines[0].name.replace(/^\w+ · /, '') : 'sem treino', ok: false, to: routines[0] ? `/musculacao/treino/${routines[0].id}` : '/musculacao' },
        { icon: '💧', label: 'Água', value: `${(water / 1000).toFixed(1)} / 3.0 L`, ok: water >= 3000, to: '/m/agua' },
        { icon: '🍽️', label: 'Alimentação', value: `${nutri.calories} kcal · ${nutri.protein}g prot`, ok: nutri.calories > 0, to: '/m/alimentacao' },
        { icon: '😴', label: 'Sono', value: sleep ? `${sleep}h` : 'não registrado', ok: sleep != null, to: '/m/sono' },
        { icon: '💊', label: 'Suplementos', value: `${taken.size}/${sups.length} tomados`, ok: sups.length > 0 && taken.size >= sups.length, to: '/suplementos' },
        { icon: '⏱️', label: 'Jejum', value: fast ? 'em andamento' : 'inativo', ok: !!fast, to: '/jejum' },
      ]
      setItems(list)
    })
  }, [user])

  const dateLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 pb-28">
        <ScreenHeader title="Agenda" />
        <p className="text-[13px] -mt-1 mb-4 px-1" style={{ color: T.sub, textTransform: 'capitalize' }}>{dateLabel}</p>
        {items === null ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p> : (
          <div className="relative pl-3">
            {items.map((it, i) => (
              <button key={i} onClick={() => nav(it.to)} className="w-full flex items-center gap-3 mb-2.5 text-left">
                <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-[18px] shrink-0" style={{ background: it.ok ? '#F0FDFA' : '#F1F5F9', border: it.ok ? '1px solid #99F6E4' : '1px solid #EDF2F7' }}>{it.icon}</span>
                <div className="flex-1" style={card}>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div><div className="font-semibold text-[14px]" style={{ color: T.text }}>{it.label}</div><div className="text-[12px]" style={{ color: T.sub }}>{it.value}</div></div>
                    {it.ok ? <span className="text-[12px] font-semibold" style={{ color: T.green }}>✓ feito</span> : <span style={{ color: '#CBD5E1' }}>›</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
