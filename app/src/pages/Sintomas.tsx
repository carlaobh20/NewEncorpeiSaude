import { useCallback, useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import {
  SYMPTOMS, SYMPTOM_CONTEXTS, symptomLabel,
  listSymptoms, addSymptom, deleteSymptom,
  type SymptomLog, type SymptomSlug,
} from '../lib/monitoring'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }

function EmergencyBanner() {
  return (
    <div className="rounded-2xl p-3 text-[12px] leading-snug" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#991B1B' }}>
      Este aplicativo <b>não detecta emergências</b>. Se você estiver passando mal agora, ligue <b>192 (SAMU)</b> imediatamente.
    </div>
  )
}

export default function Sintomas() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<SymptomLog[] | null>(null)
  const [picked, setPicked] = useState<SymptomSlug | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [context, setContext] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(() => {
    if (!user || !supabaseReady) return
    listSymptoms(user.id).then(setLogs).catch(() => setLogs([]))
  }, [user])
  useEffect(load, [load])

  async function save() {
    if (!user || !picked || saving) return
    setSaving(true)
    try {
      await addSymptom(user.id, { symptom: picked, intensity, context: context || undefined, notes: notes.trim() || undefined })
      setPicked(null); setIntensity(5); setContext(null); setNotes('')
      setSaved(true); setTimeout(() => setSaved(false), 2500)
      load()
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-md mx-auto px-4 pb-28">
      <ScreenHeader title="Como estou me sentindo" />
      <div className="space-y-4 mt-2">
        <EmergencyBanner />

        <div style={card} className="p-4">
          <div className="text-[13px] font-semibold mb-3" style={{ color: T.text }}>O que você está sentindo?</div>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOMS.map((s) => {
              const on = picked === s.slug
              return (
                <button key={s.slug} onClick={() => setPicked(on ? null : s.slug)}
                  className="rounded-2xl px-3 py-3 text-left text-[13px] font-medium transition active:scale-95"
                  style={{
                    border: `1.5px solid ${on ? T.teal : '#E4E9F1'}`,
                    background: on ? 'rgba(18,201,166,0.08)' : '#fff',
                    color: T.text,
                  }}>
                  <span className="mr-1.5">{s.emoji}</span>{s.label}
                </button>
              )
            })}
          </div>

          {picked && (
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-[12px] mb-1" style={{ color: T.sub }}>
                  <span>Quão forte está? (0 = quase nada, 10 = muito forte)</span>
                  <b style={{ color: T.text }}>{intensity}</b>
                </div>
                <input type="range" min={0} max={10} value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-emerald-500" />
              </div>
              <div>
                <div className="text-[12px] mb-1.5" style={{ color: T.sub }}>Quando aconteceu?</div>
                <div className="flex gap-2 flex-wrap">
                  {SYMPTOM_CONTEXTS.map((c) => {
                    const on = context === c.slug
                    return (
                      <button key={c.slug} onClick={() => setContext(on ? null : c.slug)}
                        className="rounded-full px-3 py-1.5 text-[12px] font-medium transition active:scale-95"
                        style={{ border: `1.5px solid ${on ? T.teal : '#E4E9F1'}`, background: on ? 'rgba(18,201,166,0.08)' : '#fff', color: T.text }}>
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Quer contar mais alguma coisa? (opcional)"
                className="w-full rounded-2xl px-3 py-2 text-[13px] outline-none"
                style={{ border: '1px solid #E4E9F1', color: T.text }} />
              <button onClick={save} disabled={saving}
                className="w-full rounded-2xl py-3 text-[14px] font-semibold text-white transition active:scale-95 disabled:opacity-50"
                style={{ background: T.teal }}>
                {saving ? 'Salvando…' : 'Salvar registro'}
              </button>
            </div>
          )}
          {saved && (
            <div className="mt-3 rounded-2xl p-3 text-[12px]" style={{ background: 'rgba(18,201,138,0.10)', color: '#0E9F6E' }}>
              Registrado. Se estiver fora da faixa definida pelo seu profissional, ele será avisado.
            </div>
          )}
        </div>

        <div style={card} className="p-4">
          <div className="text-[13px] font-semibold mb-2" style={{ color: T.text }}>Últimos registros</div>
          {logs === null && <p className="text-[12px] py-3 text-center" style={{ color: T.sub }}>Carregando…</p>}
          {logs !== null && logs.length === 0 && (
            <p className="text-[12px] py-3 text-center" style={{ color: T.sub }}>Nenhum registro ainda. Registrar como você se sente ajuda seu profissional a cuidar melhor de você.</p>
          )}
          {logs?.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2.5" style={{ borderTop: '1px solid #F1F5F9' }}>
              <div>
                <div className="text-[13px] font-medium" style={{ color: T.text }}>
                  {symptomLabel(l.symptom)} <span style={{ color: T.sub }}>· força {l.intensity}/10</span>
                </div>
                <div className="text-[11px]" style={{ color: T.sub }}>
                  {new Date(l.recorded_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {l.context ? ` · ${SYMPTOM_CONTEXTS.find((c) => c.slug === l.context)?.label || l.context}` : ''}
                </div>
              </div>
              {user && (
                <button onClick={() => deleteSymptom(user.id, l.id).then(load)} aria-label="Apagar"
                  className="text-[11px] px-2 py-1 rounded-full hover:bg-slate-100" style={{ color: T.sub }}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
