import { useState } from 'react'
import { T } from '../lib/theme'

const IMG = {
  hero: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=80',
  professional: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
}

/* ── Conteúdo real do produto — nada aqui é aspiracional ─────────────
   Cada item corresponde a uma tela que existe hoje no Encorpei.        */
const PATIENT_FEATURES = [
  'Peso e evolução', 'Água', 'Sono', 'Alimentação', 'Treino', 'Jejum',
  'Suplementos', 'Como estou me sentindo (sintomas)', 'Exames', 'Consultas & Chat', 'Meu plano de cuidado',
]
const PRO_FEATURES = [
  'Lista de pacientes vinculados, com aviso de quantos alertas cada um tem',
  'Alertas por severidade — amarelo e vermelho — configurados por você, não pelo app',
  'Painel clínico por paciente: vitais, sintomas, exames e adesão ao plano dos últimos 7 dias',
  'Histórico com data e hora de cada visto/tratado — nada se perde',
]

const STEPS = [
  { t: 'Ative seu papel', d: 'Médico, personal ou nutricionista — no mesmo login, sem cadastro separado.' },
  { t: 'Convide o paciente', d: 'Ele aceita o vínculo e dá consentimento explícito, conforme a LGPD.' },
  { t: 'Monte o plano e as faixas', d: 'Você decide o que ele registra e o que conta como alerta — o app só compara.' },
  { t: 'Receba o alerta na hora', d: 'Sem esperar a próxima consulta, sem depender de print de WhatsApp.' },
]

const ROLES = [
  { emoji: '🩺', title: 'Médico', desc: 'Acompanha vitais e sintomas entre consultas, com faixas clínicas que você mesmo define por paciente.' },
  { emoji: '💪', title: 'Personal trainer', desc: 'Vê peso, treino e adesão do aluno num painel só — sem planilha, sem depender do aluno mandar print.' },
  { emoji: '🥗', title: 'Nutricionista', desc: 'Acompanha alimentação, água e evolução de peso, com o plano de cuidado do paciente sempre visível.' },
]

const FAQ = [
  { q: 'O paciente paga alguma coisa?', a: 'Não. O acesso do paciente é gratuito. Quem assina é o profissional.' },
  { q: 'Preciso entender de tecnologia para usar?', a: 'Não. Você ativa seu papel, gera um convite e o paciente aceita pelo celular dele. Não tem etapa técnica.' },
  { q: 'O Encorpei diagnostica ou detecta emergências?', a: 'Não. Ele nunca interpreta um dado — só compara o registro do paciente com a faixa que você configurou e avisa quando sai dela. A decisão clínica é sempre sua. Em emergência, a orientação dentro do app é ligar 192 (SAMU).' },
  { q: 'Os dados do paciente são protegidos?', a: 'Sim. O vínculo só existe com consentimento explícito do paciente, revogável a qualquer momento, e todo acesso fica registrado.' },
]

function Btn({ children, onClick, ghost = false }: { children: React.ReactNode; onClick?: () => void; ghost?: boolean }) {
  return (
    <button onClick={onClick}
      className="px-7 py-3.5 rounded-2xl font-bold text-[15px] active:scale-[0.98] transition"
      style={ghost
        ? { background: '#fff', color: T.text, border: `1px solid ${T.line}` }
        : { background: T.tealDark, color: '#fff', boxShadow: '0 14px 30px -10px rgba(14,159,110,0.5)' }}>
      {children}
    </button>
  )
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`max-w-6xl mx-auto px-5 ${className}`}>{children}</section>
}

export default function Landing({ onStart }: { onStart: () => void }) {
  const [tab, setTab] = useState(0)

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",system-ui,sans-serif' }}>
      {/* NAV */}
      <nav className="sticky top-0 z-40" style={{ background: 'rgba(246,248,252,0.85)', backdropFilter: 'blur(18px)', borderBottom: `1px solid ${T.line}` }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: 'Georgia,serif' }} className="text-emerald-600 text-3xl lowercase leading-none">e</span>
            <span className="font-semibold text-lg tracking-tight" style={{ color: T.text }}>encorpei</span>
          </div>
          <button onClick={onStart} className="px-5 py-2 rounded-xl text-[14px] font-bold text-white active:scale-95 transition" style={{ background: T.text }}>Entrar</button>
        </div>
      </nav>

      {/* HERO */}
      <header>
        <Section className="pt-14 md:pt-20 pb-10 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block text-[12px] font-bold px-3 py-1.5 rounded-full mb-5" style={{ background: 'rgba(18,201,138,0.12)', color: T.tealDark }}>
              Para médico, personal trainer e nutricionista
            </span>
            <h1 className="text-[34px] md:text-[46px] font-bold leading-[1.1] tracking-tight" style={{ color: T.text }}>
              O que seu paciente faz entre as consultas, você vê no mesmo dia.
            </h1>
            <p className="text-[16px] mt-5 leading-relaxed max-w-md" style={{ color: T.sub }}>
              Peso, sono, água, treino, alimentação e sintomas — registrados por ele, com alerta automático quando algo sai da faixa que <b style={{ color: T.text }}>você</b> define.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Btn onClick={onStart}>Criar minha conta grátis</Btn>
              <Btn onClick={onStart} ghost>Já tenho conta</Btn>
            </div>
            <div className="flex flex-wrap gap-2 mt-8">
              {['Peso', 'Sono', 'Água', 'Treino', 'Sintomas', 'Exames', 'Alertas em tempo real'].map((t) => (
                <span key={t} className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: '#fff', border: `1px solid ${T.line}`, color: T.sub }}>{t}</span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[28px] overflow-hidden" style={{ boxShadow: '0 30px 80px -20px rgba(15,23,42,0.3)' }}>
              <img src={IMG.hero} alt="Paciente registrando dados de saúde" className="w-full h-[380px] md:h-[460px] object-cover" loading="eager" />
            </div>
            {/* mockup honesto: exemplo real do formato de alerta usado no painel do profissional */}
            <div className="absolute -bottom-6 -left-3 md:-left-6 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(14px)', boxShadow: '0 20px 50px rgba(15,23,42,0.16)', border: `1px solid ${T.line}`, width: 236 }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: T.rose, background: 'rgba(220,38,38,0.1)' }}>VERMELHO</span>
                <span className="text-[10px]" style={{ color: T.mute }}>agora</span>
              </div>
              <div className="text-[13px] font-medium" style={{ color: T.text }}>Pressão arterial: 186/96</div>
              <div className="text-[11px] mt-0.5" style={{ color: T.sub }}>exemplo de alerta no painel</div>
            </div>
          </div>
        </Section>
      </header>

      {/* COMO FUNCIONA */}
      <Section className="py-16">
        <h2 className="text-[26px] md:text-[32px] font-bold tracking-tight text-center" style={{ color: T.text }}>Como funciona</h2>
        <p className="text-center text-[14px] mt-2 max-w-lg mx-auto" style={{ color: T.sub }}>Quatro passos, do convite ao alerta — sem etapa técnica para você configurar.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {STEPS.map((s, i) => (
            <div key={s.t} className="rounded-2xl p-5" style={{ background: '#fff', border: `1px solid ${T.line}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white mb-3" style={{ background: T.tealDark }}>{i + 1}</div>
              <div className="text-[14px] font-semibold" style={{ color: T.text }}>{s.t}</div>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: T.sub }}>{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* APP DO PACIENTE x PAINEL DO PROFISSIONAL */}
      <Section className="py-10 grid md:grid-cols-2 gap-6">
        <div className="rounded-[28px] p-7" style={{ background: '#fff', border: `1px solid ${T.line}` }}>
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: T.chip, color: T.sub }}>App do paciente</span>
          <h3 className="text-[20px] font-bold mt-4" style={{ color: T.text }}>Tudo que ele já faz, num toque</h3>
          <ul className="mt-4 space-y-2.5">
            {PATIENT_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px]" style={{ color: T.sub }}>
                <span className="mt-0.5" style={{ color: T.tealDark }}>✓</span>{f}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[28px] p-7" style={{ background: T.text }}>
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(94,234,212,0.15)', color: '#5EEAD4' }}>Painel do profissional</span>
          <h3 className="text-[20px] font-bold mt-4 text-white">O que importa, sem esperar a consulta</h3>
          <ul className="mt-4 space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: '#CBD5E1' }}>
                <span className="mt-0.5" style={{ color: '#5EEAD4' }}>✓</span>{f}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* PAPÉIS */}
      <Section className="py-16">
        <h2 className="text-[26px] md:text-[32px] font-bold tracking-tight text-center" style={{ color: T.text }}>Um app, três formas de cuidar</h2>
        <p className="text-center text-[14px] mt-2 max-w-lg mx-auto" style={{ color: T.sub }}>Você escolhe seu papel ao ativar a conta — o painel se adapta ao que você acompanha.</p>
        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {ROLES.map((r) => (
            <div key={r.title} className="rounded-2xl p-6" style={{ background: '#fff', border: `1px solid ${T.line}` }}>
              <div className="text-[28px] mb-3">{r.emoji}</div>
              <div className="text-[16px] font-bold" style={{ color: T.text }}>{r.title}</div>
              <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: T.sub }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* SEGURANÇA / LGPD */}
      <section style={{ background: T.text }} className="py-16 mt-6">
        <Section className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[12px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(94,234,212,0.15)', color: '#5EEAD4' }}>
              Segurança e limites, com clareza
            </span>
            <h3 className="text-[24px] md:text-[30px] font-bold mt-4 tracking-tight text-white leading-tight">
              O app compara. Quem decide é você.
            </h3>
            <p className="text-[14px] mt-3 leading-relaxed" style={{ color: '#94A3B8' }}>
              O Encorpei nunca interpreta um dado clínico — só verifica se o que o paciente registrou está dentro da faixa que você configurou. Em qualquer emergência, a orientação dentro do app é ligar 192 (SAMU).
            </p>
            <div className="mt-6 space-y-2.5">
              {[
                'Vínculo só existe com consentimento explícito do paciente',
                'Consentimento revogável a qualquer momento, pelo próprio paciente',
                'Todo acesso e ação fica registrado, com data e hora',
              ].map((t) => (
                <div key={t} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-[14px]" style={{ color: '#5EEAD4' }}>🔒</span>
                  <span className="text-[13px] leading-snug" style={{ color: '#CBD5E1' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] overflow-hidden" style={{ boxShadow: '0 30px 70px rgba(0,0,0,0.4)' }}>
            <img src={IMG.professional} alt="Profissional de saúde consultando dados do paciente" className="w-full h-[320px] object-cover" loading="lazy" />
          </div>
        </Section>
      </section>

      {/* FAQ */}
      <Section className="py-16 max-w-3xl">
        <h2 className="text-[26px] md:text-[32px] font-bold tracking-tight text-center" style={{ color: T.text }}>Perguntas frequentes</h2>
        <div className="mt-8 space-y-2">
          {FAQ.map((f, i) => {
            const open = tab === i
            return (
              <div key={f.q} className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${T.line}` }}>
                <button onClick={() => setTab(open ? -1 : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="text-[14px] font-semibold" style={{ color: T.text }}>{f.q}</span>
                  <span style={{ color: T.mute }}>{open ? '−' : '+'}</span>
                </button>
                {open && <p className="px-5 pb-4 text-[13px] leading-relaxed" style={{ color: T.sub }}>{f.a}</p>}
              </div>
            )
          })}
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section className="py-16 text-center">
        <div className="rounded-[28px] px-6 py-14 md:py-16" style={{ background: 'linear-gradient(135deg, #0F172A, #0E4F42)' }}>
          <h3 className="text-[26px] md:text-[34px] font-bold tracking-tight text-white leading-tight">Comece a acompanhar em tempo real hoje.</h3>
          <p className="text-[14px] mt-3 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Grátis para o paciente. Ative seu papel de profissional e convide o primeiro paciente em minutos.
          </p>
          <div className="mt-7">
            <Btn onClick={onStart}>Criar minha conta grátis</Btn>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto px-5 pb-10 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: 'Georgia,serif' }} className="text-emerald-600 text-2xl lowercase leading-none">e</span>
          <span className="font-semibold tracking-tight" style={{ color: T.text }}>encorpei saúde</span>
        </div>
        <p className="text-[12px]" style={{ color: T.mute }}>© {new Date().getFullYear()} Encorpei · Cuidado contínuo entre profissional e paciente · LGPD</p>
      </footer>
    </div>
  )
}
