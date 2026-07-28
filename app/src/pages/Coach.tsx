import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import { getProfileName } from '../lib/db'

const suggestions = ['Monte meu treino de hoje', 'Como melhorar meu sono?', 'O que devo comer hoje?']

/** Antes disso, a saudação e a mensagem inicial vinham fixas de homeData.ts
 *  ("Bom dia, Carlos! Sua recuperação ainda está abaixo do ideal...") --
 *  hardcoded pra um usuário específico chamado Carlos, mostrado igual pra
 *  qualquer pessoa logada, parecendo uma análise real que nunca existiu.
 *  Trocado por uma saudação com o nome de quem está logado (mesmo padrão
 *  já usado em Home.tsx) e uma mensagem que já avisa que a IA ainda não
 *  está plugada -- consistente com a resposta automática abaixo, que já
 *  fazia esse aviso. */
export default function Coach() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  useEffect(() => {
    if (supabaseReady && user) getProfileName(user.id).then((n) => setName(n || user.email?.split('@')[0] || ''))
  }, [user])

  const greeting = name ? `Oi, ${name}!` : 'Oi!'
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: `${greeting} Ainda não tenho IA plugada nos seus dados -- quando responder aqui, uso o que você já registrou de sono, treino e exames. Por enquanto, essas sugestões abaixo te levam direto pra tela certa.` },
  ])
  const [input, setInput] = useState('')
  const send = (text: string) => {
    if (!text.trim()) return
    setMsgs((m) => [...m, { me: true, text }, { me: false, text: 'Recebi. Quando o Encorpei AI estiver plugado, respondo com base nos seus dados reais de sono, treino e exames.' }])
    setInput('')
  }
  return (
    <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-28 flex flex-col min-h-screen">
      <ScreenHeader title="IA Coach" />
      <div className="flex items-center gap-3 py-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 180deg,#10B981,#38bdf8,#6366f1,#10B981)' }} />
          <div className="absolute inset-[3px] rounded-full bg-slate-900 flex items-center justify-center text-emerald-300">‿</div>
        </div>
        <div>
          <div className="font-semibold text-slate-900">Seu Coach</div>
          <div className="text-xs" style={{ color: '#94A3B8' }}>ainda não é IA de verdade -- veja o aviso abaixo</div>
        </div>
      </div>
      <div className="flex-1 space-y-3 py-2">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.me ? 'ml-auto bg-emerald-500 text-white' : 'bg-white border border-[#ECEEF3] text-slate-700'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap py-2">
        {suggestions.map((s) => (
          <button key={s} onClick={() => send(s)} className="text-xs bg-white border border-[#ECEEF3] text-slate-600 px-3 py-1.5 rounded-full hover:border-emerald-300 transition">{s}</button>
        ))}
      </div>
      <div className="flex gap-2 sticky bottom-24 py-1">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Pergunte ao seu coach…" className="flex-1 bg-white border border-[#ECEEF3] rounded-2xl px-4 py-3 outline-none focus:border-emerald-400" />
        <button onClick={() => send(input)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 rounded-2xl transition">Enviar</button>
      </div>
    </div>
  )
}
