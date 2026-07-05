import { useEffect, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { computeProgression, type Progress } from '../../lib/training'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784' }
const card = { background: '#fff', borderRadius: 18, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

export default function Progressao() {
  const { user } = useAuth()
  const [list, setList] = useState<Progress[] | null>(null)
  useEffect(() => { if (user && supabaseReady) computeProgression(user.id).then((r) => setList(r.list)).catch(() => setList([])); else setList([]) }, [user])
  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh' }}>
      <div className="max-w-[440px] mx-auto px-4 pb-24">
        <ScreenHeader title="Progressão" />
        <p className="text-[13px] mb-3 px-1" style={{ color: T.sub }}>Recorde (PR), última carga e a sugestão pra próxima.</p>
        <div className="rounded-2xl p-4 mb-4 text-[12px] leading-relaxed" style={{ background: '#0F172A', color: '#E2E8F0' }}>
          <div className="font-semibold mb-1" style={{ color: '#6ee7b7' }}>🧠 Quando subir a carga</div>
          Se você completou <b>todas as séries no topo da faixa de reps</b> (ex: 4x na marca de 10) com esforço confortável (RPE ≤ 8), suba <b>~2,5%</b> no próximo treino. Se falhou antes do alvo, mantenha a carga e repita.
        </div>
        {list === null ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p>
          : list.length === 0 ? <p className="text-center py-10 text-sm" style={{ color: T.sub }}>Registre treinos pra ver sua progressão.</p>
          : <div className="space-y-2.5">
              {list.map((p) => (
                <div key={p.exercise} style={card} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] font-semibold" style={{ color: T.text }}>{p.exercise}</span>
                    {p.lastLoad > 0 && p.suggested > p.lastLoad && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EAFBF1', color: T.green }}>↑ hora de subir</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><div className="text-[15px] font-bold" style={{ color: T.text }}>{p.pr} kg</div><div className="text-[10px]" style={{ color: T.sub }}>PR</div></div>
                    <div><div className="text-[15px] font-bold" style={{ color: T.text }}>{p.lastLoad} kg</div><div className="text-[10px]" style={{ color: T.sub }}>Última</div></div>
                    <div><div className="text-[15px] font-bold" style={{ color: T.green }}>{p.suggested} kg</div><div className="text-[10px]" style={{ color: T.sub }}>Sugerido ↑</div></div>
                  </div>
                </div>
              ))}
            </div>}
      </div>
    </div>
  )
}
