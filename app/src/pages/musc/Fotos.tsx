import { useEffect, useRef, useState } from 'react'
import ScreenHeader from '../../components/ScreenHeader'
import { useAuth } from '../../lib/auth'
import { supabaseReady } from '../../lib/supabase'
import { fetchPhotos, addPhotoFromFile, type Photo } from '../../lib/muscExtra'

const T = { text: '#0F172A', sub: '#64748B', green: '#16C784' }

export default function Fotos() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [msg, setMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const load = () => { if (user && supabaseReady) fetchPhotos(user.id).then(setPhotos).catch(() => {}) }
  useEffect(load, [user])
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !user) return
    setMsg('Enviando…')
    try { await addPhotoFromFile(user.id, f, 'frente'); setMsg('Foto salva!'); setTimeout(() => setMsg(''), 1500); load() }
    catch { setMsg('Erro: crie o bucket "progress-photos" no Storage do Supabase.') }
  }
  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div className="max-w-[440px] md:max-w-2xl mx-auto px-4 pb-24">
        <ScreenHeader title="Fotos de evolução" />
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <button onClick={() => inputRef.current?.click()} className="w-full py-3 rounded-2xl font-semibold text-white mb-3" style={{ background: T.green }}>+ Adicionar foto</button>
        {msg && <div className="text-[12px] text-center mb-3" style={{ color: T.sub }}>{msg}</div>}
        {photos.length === 0 ? <p className="text-center py-10 text-sm" style={{ color: T.sub }}>Nenhuma foto ainda. Registre sua evolução.</p> : (
          <div className="grid grid-cols-2 gap-2.5">
            {photos.map((p) => (
              <div key={p.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #EDF2F7' }}>
                <img src={p.url} alt={p.pose} className="w-full aspect-[3/4] object-cover" />
                <div className="text-[11px] p-2" style={{ color: T.sub }}>{new Date(p.date).toLocaleDateString('pt-BR')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
