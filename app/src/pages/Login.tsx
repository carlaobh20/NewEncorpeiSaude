import { useState } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { ensureProfile } from '../lib/db'

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setErr(null); setMsg(null); setBusy(true)
    try {
      if (mode === 'up') {
        const { data, error } = await supabase.auth.signUp({ email, password: pass })
        if (error) throw error
        if (data.user) { try { await ensureProfile(data.user.id, name || email.split('@')[0]) } catch {} }
        setMsg('Conta criada! Se pedir confirmação, verifique seu e-mail e depois entre.')
        setMode('in')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) throw error
      }
    } catch (e: any) {
      setErr(e?.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : (e?.message ?? 'Erro ao entrar.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F7F8FC' }}>
      <div className="flex items-center gap-2 mb-8">
        <span style={{ fontFamily: 'Georgia,serif' }} className="text-emerald-500 text-3xl lowercase">e</span>
        <span className="font-semibold text-slate-900 text-2xl tracking-tight">encorpei</span>
      </div>

      <div className="w-full max-w-sm bg-white rounded-[24px] border border-[#ECEEF3] p-6 shadow-[0_10px_40px_-20px_rgba(16,24,40,0.25)]">
        <h1 className="text-xl font-bold text-slate-900">{mode === 'in' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="text-slate-500 text-sm mt-1 mb-5">Seu acompanhamento de saúde, num só lugar.</p>

        {!supabaseReady && (
          <div className="mb-4 text-sm bg-amber-50 text-amber-700 rounded-xl px-3 py-2">
            Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
          </div>
        )}

        {mode === 'up' && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome"
            className="w-full mb-3 bg-[#F7F8FC] border border-[#ECEEF3] rounded-xl px-4 py-3 outline-none focus:border-emerald-400" />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="E-mail"
          className="w-full mb-3 bg-[#F7F8FC] border border-[#ECEEF3] rounded-xl px-4 py-3 outline-none focus:border-emerald-400" />
        <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="Senha"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full mb-4 bg-[#F7F8FC] border border-[#ECEEF3] rounded-xl px-4 py-3 outline-none focus:border-emerald-400" />

        {err && <div className="mb-3 text-sm text-rose-600">{err}</div>}
        {msg && <div className="mb-3 text-sm text-emerald-600">{msg}</div>}

        <button onClick={submit} disabled={busy || !supabaseReady}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition">
          {busy ? '...' : mode === 'in' ? 'Entrar' : 'Criar conta'}
        </button>

        <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(null); setMsg(null) }}
          className="w-full text-center text-emerald-600 text-sm font-medium mt-4">
          {mode === 'in' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
