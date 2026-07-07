import { useEffect, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { listEquipment, addEquipment, removeEquipment, type Equipment } from '../../lib/health'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784', border: '#EDF2F7' }
const card = { background: '#fff', borderRadius: 20, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }
const PRESETS = ['Supino máquina', 'Supino inclinado', 'Crossover', 'Crucifixo máquina', 'Puxada frente', 'Remada baixa', 'Remada articulada', 'Pulldown', 'Leg Press', 'Agachamento Hack', 'Cadeira extensora', 'Mesa flexora', 'Cadeira abdutora', 'Cadeira adutora', 'Panturrilha', 'Desenvolvimento máquina', 'Elevação lateral', 'Peck Deck', 'Rosca Scott', 'Tríceps corda', 'Cross', 'Halteres', 'Barra', 'Anilhas', 'Esteira', 'Bicicleta']

export default function Academia() {
  const { user } = useAuth()
  const [items, setItems] = useState<Equipment[]>([])
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState('')
  const load = () => { if (user && supabaseReady) listEquipment(user.id).then(setItems).catch(() => {}) }
  useEffect(load, [user])
  const have = new Set(items.map((i) => i.name.toLowerCase()))

  const add = async (name: string) => {
    const n = name.trim(); if (!n || !user || have.has(n.toLowerCase())) return
    try { await addEquipment(user.id, n); setInput(''); load() } catch { setFlash('Erro: rodou o gym_schema.sql?'); setTimeout(() => setFlash(''), 2000) }
  }
  const del = async (id: string) => { if (user) { await removeEquipment(user.id, id); load() } }

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div className="max-w-[440px] md:max-w-2xl mx-auto px-4 pb-24">
        <ScreenHeader title="Minha Academia" />
        <p className="text-[13px] mb-4 px-1" style={{ color: T.sub }}>Cadastre os aparelhos que você tem. A IA sugere treinos, mas você monta fiel à sua academia.</p>

        <div style={card} className="p-4 mb-3">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add(input)} placeholder="Adicionar aparelho…" className="flex-1 bg-white border rounded-xl px-4 py-2.5 outline-none focus:border-emerald-400" style={{ borderColor: T.border }} />
            <button onClick={() => add(input)} className="text-white font-semibold px-4 rounded-xl" style={{ background: T.green }}>+</button>
          </div>
          {flash && <div className="text-[12px] mt-2" style={{ color: '#DC2626' }}>{flash}</div>}
        </div>

        {items.length > 0 && (
          <div style={card} className="p-2 mb-4">
            <div className="px-2 py-1 text-[12px] font-semibold" style={{ color: T.sub }}>Meus aparelhos ({items.length})</div>
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: '1px solid #F2F4F8' }}>
                <span className="text-[14px] font-medium" style={{ color: T.text }}>{it.name}</span>
                <button onClick={() => del(it.id)} className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>remover</button>
              </div>
            ))}
          </div>
        )}

        <div className="text-[12px] font-semibold mb-2 px-1" style={{ color: T.sub }}>Sugestões (toque pra adicionar)</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.filter((p) => !have.has(p.toLowerCase())).map((p) => (
            <button key={p} onClick={() => add(p)} className="text-[13px] px-3 py-1.5 rounded-full" style={{ background: '#fff', border: '1px solid #EDF2F7', color: T.sub }}>+ {p}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
