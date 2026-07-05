import type { Muscle } from '../../lib/musculacao'

const ON = '#10B981', OFF = '#E7EBF0', LINE = '#CBD5E1'

const FRONT: Partial<Record<Muscle, JSX.Element>> = {
  ombro: <><ellipse cx="34" cy="70" rx="11" ry="9" /><ellipse cx="86" cy="70" rx="11" ry="9" /></>,
  peito: <path d="M42 68 h16 a7 7 0 0 1 7 7 v10 a9 9 0 0 1-15 6 a9 9 0 0 1-15-6 v-10 a7 7 0 0 1 7-7Z" />,
  biceps: <><ellipse cx="26" cy="92" rx="7" ry="13" /><ellipse cx="94" cy="92" rx="7" ry="13" /></>,
  core: <rect x="50" y="92" width="20" height="34" rx="6" />,
  perna: <><path d="M46 132 h12 v46 a6 6 0 0 1-12 0Z" /><path d="M62 132 h12 v46 a6 6 0 0 1-12 0Z" /></>,
  panturrilha: <><ellipse cx="52" cy="196" rx="6" ry="13" /><ellipse cx="68" cy="196" rx="6" ry="13" /></>,
}
const BACK: Partial<Record<Muscle, JSX.Element>> = {
  ombro: <><ellipse cx="34" cy="70" rx="11" ry="9" /><ellipse cx="86" cy="70" rx="11" ry="9" /></>,
  costas: <path d="M44 66 h32 a6 6 0 0 1 6 6 l-4 34 a4 4 0 0 1-4 4 H46 a4 4 0 0 1-4-4 l-4-34 a6 6 0 0 1 6-6Z" />,
  triceps: <><ellipse cx="26" cy="92" rx="7" ry="13" /><ellipse cx="94" cy="92" rx="7" ry="13" /></>,
  gluteo: <path d="M46 118 a10 9 0 0 1 14 0 a10 9 0 0 1 14 0 v8 a10 9 0 0 1-14 4 a10 9 0 0 1-14-4Z" />,
  perna: <><path d="M46 134 h12 v44 a6 6 0 0 1-12 0Z" /><path d="M62 134 h12 v44 a6 6 0 0 1-12 0Z" /></>,
  panturrilha: <><ellipse cx="52" cy="196" rx="6" ry="14" /><ellipse cx="68" cy="196" rx="6" ry="14" /></>,
}

const silhouette = (
  <path d="M60 14 a10 10 0 0 1 10 10 a10 10 0 0 1-4 8 q8 2 14 10 q6 6 8 20 l3 22 q1 6-4 7 q-4 1-6-4 l-3-16 v6 l3 40 q1 30-2 46 q-1 8-7 8 q-5 0-6-7 l-4-40 h-4 l-4 40 q-1 7-6 7 q-6 0-7-8 q-3-16-2-46 l3-40 v-6 l-3 16 q-2 5-6 4 q-5-1-4-7 l3-22 q2-14 8-20 q6-8 14-10 a10 10 0 0 1-4-8 a10 10 0 0 1 10-10Z"
    fill="#F1F4F8" stroke={LINE} strokeWidth="1.2" />
)

export default function BodyMap({ active, view = 'front', size = 150 }: { active: Muscle[]; view?: 'front' | 'back'; size?: number }) {
  const map = view === 'front' ? FRONT : BACK
  const set = new Set(active)
  return (
    <svg viewBox="0 0 120 224" width={size} height={size * 224 / 120}>
      {silhouette}
      {(Object.keys(map) as Muscle[]).map((m) => (
        <g key={m} fill={set.has(m) ? ON : OFF} opacity={set.has(m) ? 0.92 : 0.55} style={{ transition: 'fill .4s' }}>
          {map[m]}
        </g>
      ))}
      {view === 'front' && <ellipse cx="60" cy="24" rx="9" ry="10" fill="#F1F4F8" stroke={LINE} strokeWidth="1.2" />}
    </svg>
  )
}
