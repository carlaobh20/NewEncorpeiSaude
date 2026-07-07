const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }

const IMG = {
  hero: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=80', // treino ao ar livre
  food: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80', // comida saudável
  doctor: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80', // médico com tecnologia
  calm: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80', // bem-estar
}

const MODULES = [
  { emoji: '⏱️', title: 'Jejum guiado', desc: '12 protocolos com as fases do corpo em tempo real, hora a hora.' },
  { emoji: '🍽️', title: 'Nutrição', desc: 'Macros, banco de alimentos brasileiro e favoritos em 1 toque.' },
  { emoji: '💧', title: 'Hidratação', desc: 'Meta personalizada e histórico diário.' },
  { emoji: '🌙', title: 'Sono', desc: 'Horários, qualidade e média semanal.' },
  { emoji: '💊', title: 'Suplementos', desc: 'Protocolo por horário com adesão dos últimos 7 dias.' },
  { emoji: '🏋️', title: 'Treino inteligente', desc: 'Treinos A–E por dia da semana, ajustados à sua academia.' },
]

const PANEL_POINTS = [
  ['📊', 'Peso, treinos, nutrição, sono, água, jejum e suplementos — tudo num painel só'],
  ['🧪', 'Exames com faixas de referência e marcadores fora do padrão em destaque'],
  ['💬', 'Chat direto: a mensagem do profissional chega no app na hora'],
  ['🔒', 'Acesso concedido pelo paciente e revogável a qualquer momento (LGPD)'],
]

function Btn({ children, onClick, ghost = false }: { children: React.ReactNode; onClick?: () => void; ghost?: boolean }) {
  return (
    <button onClick={onClick}
      className="px-7 py-3.5 rounded-2xl font-bold text-[15px] active:scale-[0.98] transition"
      style={ghost
        ? { background: 'rgba(255,255,255,0.9)', color: T.text, border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(15,23,42,0.06)' }
        : { background: 'linear-gradient(160deg,#2EE6C6,#12C98A)', color: '#fff', boxShadow: '0 14px 30px -8px rgba(18,201,138,0.55)' }}>
      {children}
    </button>
  )
}

export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",system-ui,sans-serif' }}>
      {/* NAV */}
      <nav className="sticky top-0 z-40" style={{ background: 'rgba(246,248,252,0.85)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: 'Georgia,serif' }} className="text-emerald-500 text-3xl lowercase leading-none">e</span>
            <span className="font-semibold text-lg tracking-tight" style={{ color: T.text }}>encorpei</span>
          </div>
          <button onClick={onStart} className="px-5 py-2 rounded-xl text-[14px] font-bold text-white active:scale-95 transition" style={{ background: '#0F172A' }}>Entrar</button>
        </div>
      </nav>

      {/* HERO */}
      <header className="max-w-6xl mx-auto px-5 pt-14 md:pt-20 pb-10 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-block text-[12px] font-bold px-3 py-1.5 rounded-full mb-5" style={{ background: 'rgba(18,201,138,0.12)', color: '#0E9F6E' }}>
            Saúde acompanhada de verdade
          </span>
          <h1 className="text-[38px] md:text-[52px] font-bold leading-[1.05] tracking-tight" style={{ color: T.text }}>
            Seu corpo, cuidado
            <span className="block" style={{ background: 'linear-gradient(90deg,#12C9A6,#0E9F6E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>por completo.</span>
          </h1>
          <p className="text-[17px] mt-5 leading-relaxed max-w-md" style={{ color: T.sub }}>
            Jejum, nutrição, treino, sono, água e exames em um só lugar — com seu médico ou personal acompanhando tudo <b style={{ color: T.text }}>em tempo real</b>.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Btn onClick={onStart}>Começar agora — é grátis</Btn>
            <Btn onClick={onStart} ghost>Já tenho conta</Btn>
          </div>
          <div className="flex flex-wrap gap-2 mt-8">
            {['Jejum', 'Nutrição', 'Treino', 'Sono', 'Água', 'Exames', 'Chat médico'].map((t) => (
              <span key={t} className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: '#fff', border: '1px solid #E8EDF4', color: T.sub }}>{t}</span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[36px] overflow-hidden" style={{ boxShadow: '0 30px 80px -20px rgba(15,23,42,0.35)' }}>
            <img src={IMG.hero} alt="Pessoa cuidando do corpo" className="w-full h-[420px] md:h-[520px] object-cover" loading="eager" />
          </div>
          {/* card flutuante: score */}
          <div className="absolute -bottom-5 -left-3 md:-left-8 rounded-3xl p-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', boxShadow: '0 20px 50px rgba(15,23,42,0.18)', border: '1px solid rgba(255,255,255,0.7)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: 'rgba(18,201,138,0.12)' }}>❤️</div>
            <div>
              <div className="text-[11px] font-semibold" style={{ color: T.sub }}>Health Score</div>
              <div className="text-[20px] font-bold leading-none" style={{ color: T.text }}>87 <span className="text-[12px] font-bold" style={{ color: '#0E9F6E' }}>▲ +4</span></div>
            </div>
          </div>
          {/* card flutuante: chat */}
          <div className="absolute -top-4 -right-2 md:-right-6 rounded-2xl px-4 py-3 max-w-[230px]" style={{ background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(14px)', boxShadow: '0 20px 50px rgba(15,23,42,0.3)' }}>
            <div className="text-[10px] font-bold mb-1" style={{ color: '#5EEAD4' }}>🩺 Dr. em tempo real</div>
            <div className="text-[12px] text-white leading-snug">"Vi seu exame de hoje — glicose ótima. Seguimos com o plano 👏"</div>
          </div>
        </div>
      </header>

      {/* MÓDULOS */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight text-center" style={{ color: T.text }}>Tudo que o seu corpo precisa, num só app</h2>
        <p className="text-center text-[15px] mt-2 max-w-lg mx-auto" style={{ color: T.sub }}>Sem planilhas, sem cinco aplicativos diferentes. O Encorpei acompanha o dia inteiro — do jejum da manhã ao sono da noite.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {MODULES.map((m) => (
            <div key={m.title} className="rounded-3xl p-6 transition hover:-translate-y-0.5" style={{ background: 'linear-gradient(145deg,#FFFFFF,#F4F8FC)', border: '1px solid rgba(6,182,212,0.15)', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px] mb-4" style={{ background: 'rgba(18,201,138,0.1)' }}>{m.emoji}</div>
              <div className="text-[17px] font-bold" style={{ color: T.text }}>{m.title}</div>
              <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: T.sub }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NUTRIÇÃO / CUIDADO */}
      <section className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-2 gap-10 items-center">
        <div className="rounded-[32px] overflow-hidden order-2 md:order-1" style={{ boxShadow: '0 24px 60px -16px rgba(15,23,42,0.25)' }}>
          <img src={IMG.food} alt="Alimentação saudável" className="w-full h-[340px] object-cover" loading="lazy" />
        </div>
        <div className="order-1 md:order-2">
          <span className="text-[12px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(249,115,22,0.1)', color: '#EA580C' }}>Nutrição de verdade</span>
          <h3 className="text-[26px] md:text-[32px] font-bold mt-4 tracking-tight" style={{ color: T.text }}>Registre em segundos.<br />Entenda em um olhar.</h3>
          <p className="text-[15px] mt-3 leading-relaxed" style={{ color: T.sub }}>
            Banco de alimentos brasileiro com macros calculados por grama, refeições favoritas em um toque e o balanço da semana sempre à vista — calorias, proteína, carboidratos e gordura contra as suas metas.
          </p>
        </div>
      </section>

      {/* MÉDICO EM TEMPO REAL */}
      <section style={{ background: '#0F172A' }} className="py-16 mt-10">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[12px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(94,234,212,0.15)', color: '#5EEAD4' }}>Acompanhamento profissional</span>
            <h3 className="text-[26px] md:text-[36px] font-bold mt-4 tracking-tight text-white leading-tight">
              Seu médico ou personal,<br />vendo o que importa. <span style={{ color: '#5EEAD4' }}>Ao vivo.</span>
            </h3>
            <p className="text-[15px] mt-3 leading-relaxed" style={{ color: '#94A3B8' }}>
              Você gera um convite, seu profissional entra pelo computador e passa a acompanhar sua evolução no Painel — sem prints, sem WhatsApp perdido, sem esperar a próxima consulta.
            </p>
            <div className="mt-6 space-y-3">
              {PANEL_POINTS.map(([e, t]) => (
                <div key={t as string} className="flex items-start gap-3">
                  <span className="text-[18px] mt-0.5">{e}</span>
                  <span className="text-[14px] leading-snug" style={{ color: '#CBD5E1' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[32px] overflow-hidden" style={{ boxShadow: '0 30px 70px rgba(0,0,0,0.45)' }}>
              <img src={IMG.doctor} alt="Profissional de saúde acompanhando dados" className="w-full h-[400px] object-cover" loading="lazy" />
            </div>
            <div className="absolute -bottom-5 left-6 right-6 rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', boxShadow: '0 18px 44px rgba(0,0,0,0.35)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#12C98A' }} />
                <span className="text-[13px] font-bold" style={{ color: T.text }}>Painel do Profissional</span>
              </div>
              <span className="text-[12px] font-semibold" style={{ color: T.sub }}>dados ao vivo · 🔒 LGPD</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACIDADE + CTA FINAL */}
      <section className="max-w-4xl mx-auto px-5 py-20 text-center">
        <div className="relative rounded-[36px] overflow-hidden">
          <img src={IMG.calm} alt="Bem-estar" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.82), rgba(14,116,86,0.78))' }} />
          <div className="relative px-6 py-16 md:py-20">
            <h3 className="text-[28px] md:text-[38px] font-bold tracking-tight text-white leading-tight">Cuidar de você é a parte<br />mais premium do seu dia.</h3>
            <p className="text-[15px] mt-4 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Comece grátis agora. Seus dados são seus: criptografados, protegidos por LGPD e compartilhados só com quem você autorizar.
            </p>
            <div className="mt-8">
              <Btn onClick={onStart}>Criar minha conta grátis</Btn>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto px-5 pb-10 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: 'Georgia,serif' }} className="text-emerald-500 text-2xl lowercase leading-none">e</span>
          <span className="font-semibold tracking-tight" style={{ color: T.text }}>encorpei saúde</span>
        </div>
        <p className="text-[12px]" style={{ color: '#94A3B8' }}>© {new Date().getFullYear()} Encorpei · Cuidado contínuo, do corpo à consulta · LGPD</p>
      </footer>
    </div>
  )
}
