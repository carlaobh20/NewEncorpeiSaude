import { iconMap } from './ica'
import { tones, type DayMetric, type PlanItem, type TimelineEvent } from '../../lib/homeData'
import { Chevron, Check, Info, ArrowUp, Sliders } from './Icons'

function Ic({ name, className }: { name: string; className?: string }) {
  const C = iconMap[name]
  return C ? <C className={className} /> : null
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#ECEEF3] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_1px_rgba(15,23,42,0.03)] ${className}`}>
      {children}
    </div>
  )
}

function ScoreRing({ value, size = 92 }: { value: number; size?: number }) {
  const stroke = 9, r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c - (value / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs><linearGradient id="scoreG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF1F5" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#scoreG)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-slate-900">{value}</span></div>
    </div>
  )
}

export function HealthScoreCard({ score, delta, metrics, onMetric, onInsights }:
  { score: number; delta: number; metrics: DayMetric[]; onMetric: (k: string) => void; onInsights: () => void }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <ScoreRing value={score} />
        <div className="flex-1 min-w-0">
          <div className="text-slate-500 text-xs font-medium">Health Score</div>
          <div className="text-emerald-600 text-lg font-bold leading-tight">Excelente</div>
          <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5"><ArrowUp className="w-3 h-3 text-emerald-500" /> {delta} pts vs. ontem</div>
        </div>
        <button onClick={onInsights} className="text-emerald-600 text-sm font-semibold inline-flex items-center gap-0.5 shrink-0 active:scale-95 transition">Insights<Chevron className="w-4 h-4" /></button>
      </div>
      <div className="mt-4 pt-3 border-t border-[#F0F2F6] grid grid-cols-5 gap-1">
        {metrics.map((m) => (
          <button key={m.key} onClick={() => onMetric(m.key)} className="flex flex-col items-center gap-1 rounded-xl py-1 active:scale-95 transition">
            <Ic name={m.icon} className={`w-4 h-4 ${tones[m.tone].fg}`} />
            <div className="text-[9px] text-slate-400 leading-none text-center">{m.label}</div>
            <div className={`text-[11px] font-semibold leading-none text-center ${m.done ? 'text-emerald-600' : 'text-slate-900'}`}>{m.value}</div>
          </button>
        ))}
      </div>
    </Card>
  )
}

export function QuickActions({ actions, onPick }: { actions: any[]; onPick: (k: string) => void }) {
  return (
    <section>
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-slate-900 font-semibold">Registre agora</h3>
        <button onClick={() => onPick('mais')} className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
          Personalizar <Sliders className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2.5">
        {actions.map((a) => (
          <button key={a.key} onClick={() => onPick(a.key)}
            className="flex flex-col items-center gap-1.5 group active:scale-90 transition">
            <span className={`w-full aspect-square rounded-2xl ${tones[a.tone].bg} flex items-center justify-center group-hover:brightness-95 group-active:brightness-90 transition`}>
              <Ic name={a.icon} className={`w-6 h-6 ${tones[a.tone].fg}`} />
            </span>
            <span className="text-[11px] text-slate-600 font-medium text-center leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function MiniRing({ pct, done }: { pct: number; done: boolean }) {
  const r = 13, c = 2 * Math.PI * r, off = c - (pct / 100) * c
  if (done) return (
    <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 transition">
      <Check className="w-4 h-4 text-white" />
    </span>
  )
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0">
      <circle cx="16" cy="16" r={r} fill="none" stroke="#EEF1F5" strokeWidth="3" />
      {pct > 0 && <circle cx="16" cy="16" r={r} fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 16 16)" />}
    </svg>
  )
}

export function PlanToday({ items, onToggle, onSeeAll }: { items: PlanItem[]; onToggle: (id: string) => void; onSeeAll?: () => void }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-slate-900 font-semibold">Plano de hoje</h3>
        {onSeeAll && <button onClick={onSeeAll} className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">Ver plano completo <Chevron className="w-4 h-4" /></button>}
      </div>
      <div className="divide-y divide-[#F2F4F8]">
        {items.map((it) => (
          <button key={it.id} onClick={() => onToggle(it.id)} className="w-full flex items-center gap-3 py-3 text-left group active:bg-slate-50 rounded-xl transition">
            <MiniRing pct={it.progress ?? 0} done={it.status === 'done'} />
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${it.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{it.title}</div>
              <div className={`text-sm ${it.status === 'progress' ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>{it.sub}</div>
            </div>
            <span className={`w-10 h-10 rounded-xl ${tones[it.tone].bg} flex items-center justify-center shrink-0`}>
              <Ic name={it.icon} className={`w-5 h-5 ${tones[it.tone].fg}`} />
            </span>
            <Chevron className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>
    </Card>
  )
}

export function Timeline({ events, onSeeAll }: { events: TimelineEvent[]; onSeeAll?: () => void }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-900 font-semibold">Timeline de hoje</h3>
        {onSeeAll && <button onClick={onSeeAll} className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">Ver tudo <Chevron className="w-4 h-4" /></button>}
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {events.map((e, i) => (
          <div key={e.id} className="flex items-center shrink-0">
            <div className="flex flex-col items-center w-[72px]">
              <div className="text-[11px] text-slate-400 mb-2">{e.time}</div>
              <span className={`w-11 h-11 rounded-2xl ${tones[e.tone].bg} flex items-center justify-center`}>
                <Ic name={e.icon} className={`w-5 h-5 ${tones[e.tone].fg}`} />
              </span>
              <div className="text-xs font-medium text-slate-700 mt-2">{e.label}</div>
              <div className="text-[11px] text-slate-400">{e.detail}</div>
            </div>
            {i < events.length - 1 && <div className="w-4 border-t border-dashed border-slate-200 mb-8" />}
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ── Novo conjunto minimalista (só dados reais, sem gradiente/confete) ── */

export type TodayMetric = { key: string; label: string; value: string; icon: string }

/** Card "Hoje": só mostra o que veio do banco. Sem valor mostra "—", nunca inventa número. */
export function TodayCard({ metrics, onMetric }: { metrics: TodayMetric[]; onMetric: (k: string) => void }) {
  return (
    <Card className="p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>Hoje</div>
      <div className="grid grid-cols-4 gap-1">
        {metrics.map((m) => (
          <button key={m.key} onClick={() => onMetric(m.key)} className="flex flex-col items-center gap-1 py-1 rounded-xl active:scale-95 transition">
            <span style={{ color: '#0E9F6E' }}><Ic name={m.icon} className="w-4 h-4" /></span>
            <div className="text-[9px] leading-none text-center" style={{ color: '#94A3B8' }}>{m.label}</div>
            <div className="text-[12px] font-semibold leading-none text-center" style={{ color: '#0F172A' }}>{m.value}</div>
          </button>
        ))}
      </div>
    </Card>
  )
}

export function QuickActionsSlim({ actions, onPick }: { actions: { key: string; label: string; icon: string }[]; onPick: (k: string) => void }) {
  return (
    <section>
      <h3 className="text-[13px] font-semibold px-1 mb-2" style={{ color: '#0F172A' }}>Registrar</h3>
      <div className="grid grid-cols-6 gap-2">
        {actions.map((a) => (
          <button key={a.key} onClick={() => onPick(a.key)} className="flex flex-col items-center gap-1 active:scale-90 transition">
            <span className="w-full aspect-square rounded-xl flex items-center justify-center" style={{ background: '#F1F5F9', color: '#0E9F6E' }}>
              <Ic name={a.icon} className="w-[18px] h-[18px]" />
            </span>
            <span className="text-[10px] font-medium text-center leading-tight" style={{ color: '#475569' }}>{a.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/** Leva para o plano REAL (persistido no Supabase via Sprint 2), não o checklist fake antigo. */
export function PlanTeaser({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full text-left">
      <Card className="p-4 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold" style={{ color: '#0F172A' }}>Meu plano de cuidado</div>
          <div className="text-[11px] mt-0.5" style={{ color: '#64748B' }}>O que seu profissional pediu para você registrar</div>
        </div>
        <span style={{ color: '#CBD5E1' }}><Chevron className="w-4 h-4" /></span>
      </Card>
    </button>
  )
}

export function CoachTeaser({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full text-left">
      <Card className="p-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ background: '#0E9F6E' }}>C</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold" style={{ color: '#0F172A' }}>Fale com seu Coach</div>
          <div className="text-[11px] truncate" style={{ color: '#64748B' }}>Tire dúvidas sobre treino, sono e alimentação</div>
        </div>
        <span className="shrink-0" style={{ color: '#CBD5E1' }}><Chevron className="w-4 h-4" /></span>
      </Card>
    </button>
  )
}

export function CoachCard({ greeting, message, goal, onConversar }: { greeting: string; message: string; goal: number; onConversar: () => void }) {
  return (
    <Card className="p-5">
      <h3 className="text-slate-900 font-semibold mb-3">IA Coach</h3>
      <div className="flex gap-4 items-start">
        <div className="relative shrink-0 w-14 h-14">
          <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 180deg, #10B981, #38bdf8, #6366f1, #10B981)' }} />
          <div className="absolute inset-[3px] rounded-full bg-slate-900 flex items-center justify-center">
            <span className="text-emerald-300 text-lg">‿</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">{greeting}</div>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">{message}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-emerald-600 text-sm font-semibold">Meta de hoje: {goal} pontos</span>
            <button onClick={onConversar} className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold text-sm px-4 py-2 rounded-xl transition">Conversar</button>
          </div>
        </div>
      </div>
    </Card>
  )
}
