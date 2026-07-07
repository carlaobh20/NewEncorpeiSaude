import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { computeProgression, fetchExerciseHistory, type Progress, type ExHistoryPoint } from '../../lib/training'
import ScreenHeader from '../../components/ScreenHeader'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784', blue: '#3B82F6' }
const card = { background: '#fff', borderRadius: 18, border: '1px solid #EDF2F7', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }
const fmt = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

export default function Progressao() {
  const { user } = useAuth()
  const [list, setList] = useState<Progress[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [hist, setHist] = useState<Record<string, ExHistoryPoint[]>>({})

  useEffect(() => { if (user && supabaseReady) computeProgression(user.id).then((r) => setList(r.list)).catch(() => setList([])); else setList([]) }, [user])

  const toggle = async (name: string) => {
    if (open === name) { setOpen(null); return }
    setOpen(name)
    if (!hist[name] && user) { const h = await fetchExerciseHistory(user.id, name); setHist((p) => ({ ...p, [name]: h })) }
  }

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div className="max-w-[440px] md:max-w-2xl mx-auto px-4 pb-28">
        <ScreenHeader title="Progressão" />
        <p className="text-[13px] mb-3 px-1" style={{ color: T.sub }}>Recorde (PR), última carga e sugestão. Toque pra ver o histórico.</p>
        <div className="rounded-2xl p-4 mb-4 text-[12px] leading-relaxed" style={{ background: '#0F172A', color: '#E2E8F0' }}>
          <div className="font-semibold mb-1" style={{ color: '#6ee7b7' }}>🧠 Quando subir a carga</div>
          Completou todas as séries no topo da faixa de reps com esforço confortável (RPE ≤ 8)? Suba <b>~2,5%</b> no próximo treino.
        </div>

        {list === null ? <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p>
          : list.length === 0 ? <p className="text-center py-10 text-sm" style={{ color: T.sub }}>Registre treinos pra ver sua progressão.</p>
          : <div className="space-y-2.5">
              {list.map((p) => {
                const h = hist[p.exercise]
                return (
                  <div key={p.exercise} style={card}>
                    <button onClick={() => toggle(p.exercise)} className="w-full p-4 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[14px] font-semibold" style={{ color: T.text }}>{p.exercise}</span>
                        {p.lastLoad > 0 && p.suggested > p.lastLoad && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EAFBF1', color: T.green }}>↑ hora de subir</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><div className="text-[15px] font-bold" style={{ color: T.text }}>{p.pr} kg</div><div className="text-[10px]" style={{ color: T.sub }}>PR</div></div>
                        <div><div className="text-[15px] font-bold" style={{ color: T.text }}>{p.lastLoad} kg</div><div className="text-[10px]" style={{ color: T.sub }}>Última</div></div>
                        <div><div className="text-[15px] font-bold" style={{ color: T.green }}>{p.suggested} kg</div><div className="text-[10px]" style={{ color: T.sub }}>Sugerido ↑</div></div>
                      </div>
                      <div className="text-center text-[11px] mt-2" style={{ color: T.blue }}>{open === p.exercise ? 'ocultar histórico ▲' : 'ver histórico ▼'}</div>
                    </button>
                    {open === p.exercise && (
                      <div className="px-4 pb-4">
                        {!h ? <div className="text-[12px] text-center py-3" style={{ color: T.sub }}>Carregando…</div>
                          : h.length === 0 ? <div className="text-[12px] text-center py-3" style={{ color: T.sub }}>Sem histórico ainda.</div>
                          : <div className="divide-y" style={{ borderColor: '#F2F4F8' }}>
                              {[...h].reverse().map((pt, i, arr) => {
                                const prev = arr[i + 1]; const up = prev && pt.load > prev.load
                                return (
                                  <div key={i} className="flex items-center justify-between py-2 text-[13px]">
                                    <span style={{ color: T.sub }}>{fmt(pt.date)}</span>
                                    <span style={{ color: T.text }}><b>{pt.load} kg</b> × {pt.reps} {up && <span style={{ color: T.blue }}> ↑ subiu</span>}</span>
                                  </div>
                                )
                              })}
                            </div>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>}
      </div>
    </div>
  )
}
