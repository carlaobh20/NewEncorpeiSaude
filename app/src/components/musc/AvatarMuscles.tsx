import { useState } from 'react'
import BodyMap from './BodyMap'
import type { Muscle } from '../../lib/musculacao'

// Mostra a imagem real do avatar (public/muscle-avatar.png) quando existir.
// Enquanto o Carlos não envia a imagem, cai no BodyMap (SVG) como fallback.
export default function AvatarMuscles({ active, size = 150 }: { active: Muscle[]; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (!failed) {
    return (
      <img src="/muscle-avatar.png" alt="Avatar muscular" onError={() => setFailed(true)}
        style={{ width: size, height: 'auto', objectFit: 'contain' }} />
    )
  }
  return <BodyMap active={active} size={size} />
}
