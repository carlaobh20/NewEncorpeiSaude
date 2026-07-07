import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { listMessages, sendMessage, subscribeMessages, type CareMessage } from '../lib/care'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }

/** Chat em tempo real. `as` define de que lado esta instância envia. */
export default function CareChat({ as = 'paciente', height = 380, userId }: { as?: 'paciente' | 'profissional'; height?: number; userId?: string }) {
  const { user } = useAuth()
  const threadId = userId ?? user?.id
  const [msgs, setMsgs] = useState<CareMessage[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!threadId || !supabaseReady) return
    listMessages(threadId).then(setMsgs).catch(() => {})
    const off = subscribeMessages(threadId, (m) => setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])))
    return off
  }, [threadId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = async () => {
    const t = text.trim()
    if (!t || !threadId || busy) return
    setBusy(true)
    try { await sendMessage(threadId, as, t); setText('') } catch { /* noop */ } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #E4E9F1', height }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#0F172A' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: '#2EE6C6' }} />
        <span className="text-[13px] font-semibold text-white">Chat com {as === 'paciente' ? 'seu profissional' : 'o paciente'}</span>
        <span className="text-[10px] ml-auto" style={{ color: '#94A3B8' }}>tempo real</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" style={{ background: '#F6F8FC' }}>
        {msgs.length === 0 && <p className="text-center text-[12px] py-6" style={{ color: T.sub }}>Nenhuma mensagem ainda. Envie a primeira!</p>}
        {msgs.map((m) => {
          const mine = m.sender === as
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] px-3 py-2 rounded-2xl text-[13px]" style={mine
                ? { background: T.teal, color: '#fff', borderBottomRightRadius: 6 }
                : { background: '#fff', color: T.text, border: '1px solid #E4E9F1', borderBottomLeftRadius: 6 }}>
                <div className="text-[9px] font-semibold mb-0.5" style={{ color: mine ? 'rgba(255,255,255,0.75)' : '#94A3B8' }}>
                  {m.sender === 'paciente' ? '👤 Paciente' : '🩺 Profissional'} · {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {m.text}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 p-2.5" style={{ background: '#fff', borderTop: '1px solid #E4E9F1' }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Escreva sua mensagem…"
          className="flex-1 bg-white border rounded-2xl px-4 py-2.5 text-[14px] outline-none focus:border-emerald-400" style={{ borderColor: '#EDF2F7', color: T.text }} />
        <button onClick={send} disabled={busy || !text.trim()} className="px-4 rounded-2xl font-bold text-white active:scale-95 transition disabled:opacity-40" style={{ background: T.teal }}>➤</button>
      </div>
    </div>
  )
}
