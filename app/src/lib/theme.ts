// ── Design system único do Encorpei (paciente) ──────────────────────────────
// Antes: duas linguagens visuais coexistiam (a "home cockpit" colorida, com
// gradientes/confete/cards grandes, e a área clínica sóbria com T.text/sub/teal).
// Este arquivo é a fonte única de verdade: cards menores, sem gradiente,
// paleta reduzida (tinta + teal + 2 acentos de estado). Todo o app do
// paciente deve importar daqui em vez de recriar estilo local.

export const T = {
  text: '#0F172A',
  sub: '#64748B',
  mute: '#94A3B8',
  teal: '#12C9A6',
  tealDark: '#0E9F6E',
  amber: '#D97706',
  rose: '#DC2626',
  line: '#ECEEF3',
  soft: '#F8FAFC',
  chip: '#F1F5F9',
}

/** Card padrão — menor e mais discreto que o anterior (radius 28→16, sombra pesada→sutil). */
export const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  border: `1px solid ${T.line}`,
  boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.03)',
}

/** Card ainda mais compacto, para linhas de lista dentro de uma seção. */
export const cardTight: React.CSSProperties = { ...card, borderRadius: 14 }

/** Ícone/avatar em bloco neutro — substitui os tiles coloridos (bg-emerald-50 etc). */
export const iconTile: React.CSSProperties = {
  background: T.chip,
  borderRadius: 12,
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

export const chipBadge = (tone: 'ok' | 'warn' | 'bad' | 'neutral'): React.CSSProperties => {
  const map = {
    ok: { color: T.tealDark, background: 'rgba(18,201,138,0.12)' },
    warn: { color: T.amber, background: 'rgba(217,119,6,0.12)' },
    bad: { color: T.rose, background: 'rgba(220,38,38,0.10)' },
    neutral: { color: T.sub, background: T.chip },
  }
  return { ...map[tone], fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }
}
