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
        <p className="text-[13px] mb-4 px-1" style={{ color: T.sub }}>Recorde (PR), última carga e a sugestão pra próxima (+2,5%).</p>
        {list === null ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p>
          : list.length === 0 ? <p className="text-center py-10 text-sm" style={{ color: T.sub }}>Registre treinos pra ver sua progressão.</p>
          : <div className="space-y-2.5">
              {list.map((p) => (
                <div key={p.exercise} style={card} className="p-4">
                  <div className="text-[14px] font-semibold mb-2" style={{ color: T.text }}>{p.exercise}</div>
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
