import { useState } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { ensureProfile } from '../lib/db'

const GREEN = '#22C55E'

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
    </svg>
  )
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5" />
    </svg>
  )
}
function IconEye({ off }: { off?: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" /><path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c5 0 9 4 10.5 7-.6 1.2-1.5 2.5-2.7 3.6M6.6 6.6C4.6 8 3.1 9.9 1.5 12c1.5 3 5.5 7 10.5 7 1.4 0 2.7-.3 3.9-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
function IconApple() {
  return (
    <svg viewBox="0 0 384 512" className="w-[18px] h-[18px]" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  )
}
function IconGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="w-[18px] h-[18px]">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4 24 4c-7.8 0-14.5 4.4-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.1 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.6 5.1C9.4 39.6 16.1 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.6 5.6C39.9 37.6 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  )
}
function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
      <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}

const fieldStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff',
}

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [oauthBusy, setOauthBusy] = useState<string | null>(null)

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

  const oauth = async (provider: 'apple' | 'google' | 'azure') => {
    setErr(null); setOauthBusy(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider })
      if (error) throw error
    } catch (e: any) {
      setErr(e?.message || `Não deu pra entrar com ${provider}. Esse login pode não estar configurado ainda.`)
      setOauthBusy(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B0F14' }}>
      <div className="max-w-md mx-auto">
        {/* ── Hero ── */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '800 / 750' }}>
          <img src="/login-hero.jpg" alt="Encorpei Saúde" className="absolute inset-0 w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 40%' }} loading="eager" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,15,20,0) 0%, rgba(11,15,20,0.1) 55%, rgba(11,15,20,0.92) 90%, #0B0F14 100%)' }} />

          <div className="absolute top-0 left-0 right-0 px-6 pt-7">
            <div className="flex items-end gap-2">
              <span className="leading-none text-4xl lowercase" style={{ color: GREEN, fontFamily: 'Georgia,serif' }}>e</span>
              <span className="font-semibold text-white text-[26px] tracking-tight leading-none pb-0.5">encorpei</span>
            </div>
            <div className="pl-9 -mt-0.5 text-[11px] font-bold tracking-[0.25em]" style={{ color: GREEN }}>SAÚDE</div>
          </div>

          <div className="absolute left-0 right-0 bottom-0 px-6 pb-6">
            <h1 className="text-[34px] leading-[1.08] font-bold text-white tracking-tight">
              Sua saúde.<br />Seu <span style={{ color: GREEN }}>melhor.</span>
            </h1>
            <p className="text-[14px] mt-3 leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Acompanhe, evolua e transforme sua vida com inteligência.
            </p>
          </div>
        </div>

        {/* ── Card em glass ── */}
        <div className="px-5 -mt-1 pb-8">
          <div className="rounded-[28px] p-6" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
            <h2 className="text-[20px] font-bold text-white">{mode === 'in' ? 'Bem-vindo de volta' : 'Criar conta'}</h2>
            <p className="text-[13px] mt-1 mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {mode === 'in' ? 'Faça login para acessar sua jornada de saúde' : 'Comece sua jornada de saúde agora'}
            </p>

            {!supabaseReady && (
              <div className="mb-4 text-[12px] rounded-xl px-3 py-2" style={{ background: 'rgba(217,119,6,0.15)', color: '#FBBF24' }}>
                Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
              </div>
            )}

            {mode === 'up' && (
              <div className="flex items-center gap-2.5 mb-3 rounded-2xl px-4 py-3.5" style={fieldStyle}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}><IconUser /></span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome"
                  className="w-full bg-transparent outline-none text-[14px] placeholder-white/40" style={{ color: '#fff' }} />
              </div>
            )}

            <div className="flex items-center gap-2.5 mb-3 rounded-2xl px-4 py-3.5" style={fieldStyle}>
              <span style={{ color: 'rgba(255,255,255,0.45)' }}><IconMail /></span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="E-mail"
                className="w-full bg-transparent outline-none text-[14px] placeholder-white/40" style={{ color: '#fff' }} />
            </div>

            <div className="flex items-center gap-2.5 mb-2 rounded-2xl px-4 py-3.5" style={fieldStyle}>
              <span style={{ color: 'rgba(255,255,255,0.45)' }}><IconLock /></span>
              <input value={pass} onChange={(e) => setPass(e.target.value)} type={showPass ? 'text' : 'password'} placeholder="Senha"
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full bg-transparent outline-none text-[14px] placeholder-white/40" style={{ color: '#fff' }} />
              <button type="button" onClick={() => setShowPass((v) => !v)} style={{ color: 'rgba(255,255,255,0.45)' }}>
                <IconEye off={showPass} />
              </button>
            </div>

            {mode === 'in' && (
              <div className="flex justify-end mb-4">
                <button className="text-[12.5px] font-semibold" style={{ color: GREEN }}>Esqueci minha senha</button>
              </div>
            )}
            {mode === 'up' && <div className="mb-4" />}

            {err && <div className="mb-3 text-[12.5px]" style={{ color: '#FCA5A5' }}>{err}</div>}
            {msg && <div className="mb-3 text-[12.5px]" style={{ color: GREEN }}>{msg}</div>}

            <button onClick={submit} disabled={busy || !supabaseReady}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-[15px] active:scale-[0.98] transition disabled:opacity-50"
              style={{ background: GREEN, boxShadow: '0 10px 24px -8px rgba(34,197,94,0.6)' }}>
              {busy ? '...' : mode === 'in' ? 'Entrar' : 'Criar conta'}
              {!busy && <IconArrow />}
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <span className="text-[11.5px]" style={{ color: 'rgba(255,255,255,0.45)' }}>ou continue com</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {([
                ['apple', <IconApple key="a" />],
                ['google', <IconGoogle key="g" />],
                ['azure', <IconGrid key="m" />],
              ] as const).map(([provider, icon]) => (
                <button key={provider} onClick={() => oauth(provider)} disabled={oauthBusy !== null}
                  className="py-3.5 rounded-2xl flex items-center justify-center text-white active:scale-95 transition disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center mt-6 text-[13.5px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {mode === 'in' ? (
              <>Ainda não tem uma conta? <button onClick={() => { setMode('up'); setErr(null); setMsg(null) }} className="font-semibold" style={{ color: GREEN }}>Criar agora</button></>
            ) : (
              <>Já tem uma conta? <button onClick={() => { setMode('in'); setErr(null); setMsg(null) }} className="font-semibold" style={{ color: GREEN }}>Entrar</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
