type Props = { value: number; size?: number }
export default function HealthRing({ value, size = 168 }: Props) {
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (value / 100) * c
  return (
    <svg width={size} height={size} className="drop-shadow-[0_0_20px_rgba(52,224,161,0.35)]">
      <defs>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7ff0c8" />
          <stop offset="60%" stopColor="#34e0a1" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke="url(#ring)" strokeWidth={stroke} fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }}
      />
      <text x="50%" y="46%" textAnchor="middle" className="fill-white" fontSize="40" fontWeight="800">{value}</text>
      <text x="50%" y="63%" textAnchor="middle" className="fill-white/50" fontSize="13" fontWeight="600" letterSpacing="1">HEALTH SCORE</text>
    </svg>
  )
}
