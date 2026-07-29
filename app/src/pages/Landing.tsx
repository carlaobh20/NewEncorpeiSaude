import { useState } from 'react'
import { T } from '../lib/theme'

const IMG = {
  hero: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=80',
  care: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
}

/* ── Conteúdo real do produto, na ordem que importa pro paciente ──────
   Primeiro o que ele registra sozinho; depois, o que é opcional.        */
const FEATURES = [
  { emoji: '⚖️', title: 'Peso', desc: 'Registre e veja sua evolução ao longo do tempo, sem planilha.' },
  { emoji: '💧', title: 'Água', desc: 'Meta do dia e histórico, um toque por registro.' },
  { emoji: '🌙', title: 'Sono', desc: 'Horários e qualidade, pra entender seu padrão real.' },
  { emoji: '🍽️', title: 'Alimentação', desc: 'O que você comeu, no seu ritmo — sem julgamento.' },
  { emoji: '🏋️', title: 'Treino', desc: 'Seus treinos da semana, organizados num só lugar.' },
  { emoji: '⏱️', title: 'Jejum', desc: 'Acompanhe o protocolo que você está seguindo.' },
  { emoji: '💊', title: 'Suplementos', desc: 'Lembrete por horário, sem esquecer a dose.' },
  { emoji: '💬', title: 'Como estou me sentindo', desc: 'Registre sintomas do dia em poucos toques.' },
  { emoji: '🧪', title: 'Exames', desc: 'Guarde seus resultados e veja a evolução dos marcadores.' },
]

const SHARE_POINTS = [
  'Você decide quem vê seus dados — e pode tirar o acesso quando quiser',
  'Ele nunca vê mais do que você autorizou no convite',
  'Vocês combinam juntos o que conta como alerta antes de qualquer coisa acontecer',
]

const WAYS = [
  { t: 'Você começa sozinho', d: 'Registre peso, água, sono, treino, alimentação e como está se sentindo, no seu ritmo. O app organiza tudo automaticamente e mostra sua evolução ao longo do tempo — sem planilha, sem precisar de médico pra começar.' },
  { t: 'Você convida quem cuida de você', d: 'Quando fizer sentido, convide seu médico, personal trainer ou nutricionista com um código simples. Vocês combinam juntos o plano de acompanhamento e o que vira alerta — ele só vê o que você autorizar.' },
  { t: 'Seu médico já usa o Encorpei e te convida', d: 'Se o profissional que cuida de você já acompanha outros pacientes pelo Encorpei, ele pode te convidar direto. O plano de monitoramento só entra em vigor depois que vocês dois combinam as regras juntos — a decisão nunca é só dele.' },
]

const FAQ = [
  { q: 'Preciso ter médico, personal ou nutricionista pra usar?', a: 'Não. Você pode registrar sozinho, do seu jeito, e decidir depois se quer convidar alguém — ou nunca convidar ninguém.' },
  { q: 'Quem manda o convite, eu ou o profissional?', a: 'Pode ser dos dois jeitos. Você pode convidar seu médico, personal ou nutricionista quando quiser; ou, se ele já usa o Encorpei com outros pacientes, ele pode te convidar direto. Nos dois casos, o plano de acompanhamento só começa a valer depois que vocês combinam juntos o que conta como alerta.' },
  { q: 'É pago?', a: 'Não. O acesso do paciente é sempre gratuito.' },
  { q: 'Meus dados ficam visíveis pra qualquer profissional?', a: 'Não. Só quem você convidar, e só enquanto você autorizar. Você revoga o acesso quando quiser.' },
  { q: 'O app substitui consulta médica ou detecta emergência?', a: 'Não. Ele organiza o que você registra; a decisão de saúde continua sendo do profissional. Em qualquer emergência, ligue 192 (SAMU).' },
]

function Btn({ children, onClick, ghost = false, compact = false }: { children: React.ReactNode; onClick?: () => void; ghost?: boolean; compact?: boolean }) {
  return (
    <button onClick={onClick}
      className={compact
        ? 'px-5 py-2.5 text-[13px] sm:px-7 sm:py-3.5 sm:text-[15px] rounded-2xl font-bold active:scale-[0.98] transition'
        : 'px-7 py-3.5 text-[15px] rounded-2xl font-bold active:scale-[0.98] transition'}
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

      {/* HERO — banner full-bleed com a imagem da marca (já traz título/subtítulo embutidos).
          Substitui o hero anterior (H1 + foto de exercício); os botões de ação continuam
          por baixo, porque são funcionais (disparam onStart), não texto de marketing. */}
      <header className="w-full">
        <img
          src="/hero-encorpei.jpg"
          alt="Encorpei — acompanhamento em tempo real que leva você a outro nível de vida. Dados. Consistência. Estratégia. Resultados que transformam."
          className="w-full h-auto block"
          loading="eager"
        />
        <img
          src="/hero-dashboard.jpg"
          alt="Painel do profissional de saúde — visão geral dos pacientes, alertas e evolução em tempo real"
          className="w-full h-auto block"
          loading="eager"
        />
        <div className="flex justify-center py-5 sm:py-7 px-5" style={{ background: '#fff', borderBottom: `1px solid ${T.line}` }}>
          <Btn onClick={onStart} compact>Criar minha conta</Btn>
        </div>
      </header>

      {/* O QUE VOCÊ REGISTRA — seção principal, focada no paciente */}
      <Section className="py-16">
        <h2 className="text-[26px] md:text-[34px] font-bold tracking-tight text-center" style={{ color: T.text }}>Tudo que o seu corpo precisa, num só app</h2>
        <p className="text-center text-[14px] mt-2 max-w-lg mx-auto" style={{ color: T.sub }}>Sem planilha, sem cinco aplicativos diferentes — e sem depender de ninguém pra começar.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl p-3 sm:p-4" style={{ background: '#fff', border: `1px solid ${T.line}` }}>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[14px] sm:text-[18px] mb-2" style={{ background: T.chip }}>{f.emoji}</div>
              <div className="text-[12.5px] sm:text-[14px] font-bold" style={{ color: T.text }}>{f.title}</div>
              <p className="text-[11px] sm:text-[12.5px] mt-1 leading-snug" style={{ color: T.sub }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* COMPARTILHAR, SE QUISER — opcional, controlado pelo paciente */}
      <section style={{ background: T.text }} className="py-16 mt-6">
        <Section className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[12px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(94,234,212,0.15)', color: '#5EEAD4' }}>
              Opcional, sempre no seu controle
            </span>
            <h3 className="text-[24px] md:text-[30px] font-bold mt-4 tracking-tight text-white leading-tight">
              Onde você estiver, a qualquer hora, o acompanhamento é pensado na sua saúde.
            </h3>
            <p className="text-[16px] font-bold mt-3" style={{ color: '#5EEAD4' }}>
              Venha fazer parte do time Encorpei.
            </p>
            <p className="text-[14px] mt-3 leading-relaxed" style={{ color: '#94A3B8' }}>
              Convide seu médico, personal trainer ou nutricionista quando fizer sentido. Ele monta um plano com você e só recebe um aviso se algo sair da faixa que vocês combinaram — o resto continua só seu.
            </p>
            <div className="mt-6 space-y-2.5">
              {SHARE_POINTS.map((t) => (
                <div key={t} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-[14px]" style={{ color: '#5EEAD4' }}>🔒</span>
                  <span className="text-[13px] leading-snug" style={{ color: '#CBD5E1' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] overflow-hidden" style={{ boxShadow: '0 30px 70px rgba(0,0,0,0.4)' }}>
            <img src="/care-team.jpg" alt="Time de profissionais de saúde da Encorpei — cardiologista, nutricionista, endocrinologista e personal trainer" className="w-full h-auto block" loading="lazy" />
          </div>
        </Section>
      </section>

      {/* COMO FUNCIONA — 3 jeitos de usar o Encorpei (não é um fluxo linear, são 3 entradas possíveis) */}
      <Section className="py-16">
        <h2 className="text-[26px] md:text-[32px] font-bold tracking-tight text-center" style={{ color: T.text }}>Do seu jeito, no seu tempo</h2>
        <p className="text-center text-[14px] mt-2 max-w-lg mx-auto" style={{ color: T.sub }}>Três caminhos, o mesmo cuidado — você escolhe o que faz sentido agora.</p>
        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {WAYS.map((s, i) => (
            <div key={s.t} className="rounded-2xl p-5" style={{ background: '#fff', border: `1px solid ${T.line}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white mb-3" style={{ background: T.tealDark }}>{i + 1}</div>
              <div className="text-[14px] font-semibold" style={{ color: T.text }}>{s.t}</div>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: T.sub }}>{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section className="py-10 max-w-3xl">
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
          <h3 className="text-[26px] md:text-[34px] font-bold tracking-tight text-white leading-tight">Comece a cuidar do seu corpo hoje.</h3>
          <p className="text-[14px] mt-3 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Grátis, sem precisar de médico pra começar. Convide quem cuida de você quando quiser.
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
        <p className="text-[12px]" style={{ color: T.mute }}>© {new Date().getFullYear()} Encorpei · Cuidado contínuo do seu jeito · LGPD</p>
      </footer>
    </div>
  )
}
