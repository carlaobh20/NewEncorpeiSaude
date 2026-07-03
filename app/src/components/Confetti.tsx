import { useEffect, useState } from 'react'

const COLORS = ['#10B981', '#38bdf8', '#f59e0b', '#f43f5e', '#8b5cf6']

export default function Confetti({ fire }: { fire: number }) {
  const [bits, setBits] = useState<{ id: number; x: number; c: string; d: number; r: number }[]>([])
  useEffect(() => {
    if (!fire) return
    const b = Array.from({ length: 26 }, (_, i) => ({
      id: fire * 100 + i, x: 40 + Math.random() * 20, c: COLORS[i % COLORS.length],
      d: Math.random() * 0.25, r: Math.random() * 360,
    }))
    setBits(b)
    const t = setTimeout(() => setBits([]), 1200)
    return () => clearTimeout(t)
  }, [fire])
  if (!bits.length) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bits.map((b) => (
        <span key={b.id} style={{
          position: 'absolute', left: `${b.x}%`, top: '38%', width: 9, height: 9, background: b.c,
          borderRadius: 2, transform: `rotate(${b.r}deg)`, animation: `conf 1.1s ${b.d}s cubic-bezier(.2,.7,.3,1) forwards`,
        }} />
      ))}
      <style>{`@keyframes conf{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(240px) rotate(320deg)}}`}</style>
    </div>
  )
}
