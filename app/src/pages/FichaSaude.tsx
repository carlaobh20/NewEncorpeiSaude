import { useCallback, useEffect, useRef, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader'
import { useAuth } from '../lib/auth'
import { supabaseReady } from '../lib/supabase'
import {
  getHealthProfile, saveHealthProfile, uploadProfilePhoto,
  type HealthProfile, type BiologicalSex, type Mobility,
} from '../lib/db'

const T = { text: '#0F172A', sub: '#64748B', teal: '#12C9A6' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, border: '1px solid #E4E9F1', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }
const input: React.CSSProperties = { border: '1px solid #E4E9F1', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: T.text, background: '#fff' }
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }

const SEX_OPTIONS: { k: BiologicalSex; l: string }[] = [
  { k: 'feminino', l: 'Feminino' }, { k: 'masculino', l: 'Masculino' }, { k: 'prefiro_nao_informar', l: 'Prefiro não informar' },
]
const MOBILITY_OPTIONS: { k: Mobility; l: string }[] = [
  { k: 'sem_limitacao', l: 'Sem limitação' }, { k: 'bengala_andador', l: 'Uso bengala/andador' },
  { k: 'cadeira_rodas', l: 'Cadeira de rodas' }, { k: 'outra', l: 'Outra' },
]

export default function FichaSaude() {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [p, setP] = useState<HealthProfile>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [flash, setFlash] = useState('')

  const load = useCallback(async () => {
    if (!user || !supabaseReady) { setLoading(false); return }
    setLoading(true)
    try { setP(await getHealthProfile(user.id)) } finally { setLoading(false) }
  }, [user])
  useEffect(() => { load() }, [load])

  async function save() {
    if (!user || busy) return
    setBusy(true)
    try {
      await saveHealthProfile(user.id, {
        name: p.name, height_cm: p.height_cm, birth_date: p.birth_date, biological_sex: p.biological_sex,
        chronic_conditions: p.chronic_conditions, allergies: p.allergies, current_medications: p.current_medications,
        mobility: p.mobility, mobility_notes: p.mobility_notes,
      })
      setFlash('Ficha salva! Seu médico ou profissional vinculado já consegue ver isso.'); setTimeout(() => setFlash(''), 2600)
    } finally { setBusy(false) }
  }

  async function onPhoto(file: File) {
    if (!user) return
    setUploadingPhoto(true)
    try { const url = await uploadProfilePhoto(user.id, file); setP((cur) => ({ ...cur, photo_url: url })) }
    catch { setFlash('Não deu pra enviar a foto. Tente outra imagem.'); setTimeout(() => setFlash(''), 2200) }
    finally { setUploadingPhoto(false) }
  }

  if (loading) return <p className="text-center py-8 text-sm" style={{ color: T.sub }}>Carregando…</p>

  return (
    <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-32">
      <ScreenHeader title="Minha ficha de saúde" />
      <p className="text-[12px] mt-1 mb-3 px-1" style={{ color: T.sub }}>
        Essas informações ficam visíveis pro profissional que você vincular (médico, personal, nutricionista) — ajuda ele a te conhecer melhor antes mesmo da primeira consulta.
      </p>

      <div style={card} className="p-4 mb-3 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: '#F1F5F9' }}>
          {p.photo_url
            ? <img src={p.photo_url} alt="Sua foto" className="w-full h-full object-cover" />
            : <span className="text-[28px]" style={{ color: T.sub }}>{(p.name || 'E').charAt(0).toUpperCase()}</span>}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Foto de perfil</div>
          <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f) }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}
            className="px-3.5 py-2 rounded-xl text-[12px] font-semibold active:scale-95 disabled:opacity-50"
            style={{ background: 'rgba(18,201,166,0.10)', color: '#0E9F6E' }}>
            {uploadingPhoto ? 'Enviando…' : p.photo_url ? 'Trocar foto' : 'Tirar ou enviar foto'}
          </button>
        </div>
      </div>

      <div style={card} className="p-4 mb-3 space-y-3">
        <div>
          <span style={label}>Nome</span>
          <input value={p.name || ''} onChange={(e) => setP({ ...p, name: e.target.value })} style={input} className="w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span style={label}>Data de nascimento</span>
            <input type="date" value={p.birth_date || ''} onChange={(e) => setP({ ...p, birth_date: e.target.value })} style={input} className="w-full" />
          </div>
          <div>
            <span style={label}>Altura (cm)</span>
            <input type="number" inputMode="numeric" value={p.height_cm ?? ''} onChange={(e) => setP({ ...p, height_cm: e.target.value ? Number(e.target.value) : null })} style={input} className="w-full" />
          </div>
        </div>
        <div>
          <span style={label}>Sexo biológico</span>
          <div className="flex flex-wrap gap-1.5">
            {SEX_OPTIONS.map((o) => (
              <button key={o.k} onClick={() => setP({ ...p, biological_sex: o.k })} className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition"
                style={p.biological_sex === o.k ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={card} className="p-4 mb-3 space-y-3">
        <div className="text-[13px] font-semibold" style={{ color: T.text }}>Histórico de saúde</div>
        <div>
          <span style={label}>Doenças crônicas</span>
          <textarea value={p.chronic_conditions || ''} onChange={(e) => setP({ ...p, chronic_conditions: e.target.value })} placeholder="Ex: hipertensão, diabetes tipo 2..." style={{ ...input, minHeight: 60 }} className="w-full" />
        </div>
        <div>
          <span style={label}>Alergias</span>
          <textarea value={p.allergies || ''} onChange={(e) => setP({ ...p, allergies: e.target.value })} placeholder="Ex: dipirona, frutos do mar..." style={{ ...input, minHeight: 50 }} className="w-full" />
        </div>
        <div>
          <span style={label}>Medicações em uso contínuo</span>
          <textarea value={p.current_medications || ''} onChange={(e) => setP({ ...p, current_medications: e.target.value })} placeholder="Ex: Losartana 50mg 1x ao dia..." style={{ ...input, minHeight: 50 }} className="w-full" />
        </div>
      </div>

      <div style={card} className="p-4 mb-3 space-y-3">
        <div className="text-[13px] font-semibold" style={{ color: T.text }}>Mobilidade</div>
        <div className="flex flex-wrap gap-1.5">
          {MOBILITY_OPTIONS.map((o) => (
            <button key={o.k} onClick={() => setP({ ...p, mobility: o.k })} className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition"
              style={p.mobility === o.k ? { background: T.teal, color: '#fff' } : { background: '#EEF1F5', color: T.sub }}>{o.l}</button>
          ))}
        </div>
        {p.mobility === 'outra' && (
          <input value={p.mobility_notes || ''} onChange={(e) => setP({ ...p, mobility_notes: e.target.value })} placeholder="Descreva" style={input} className="w-full" />
        )}
      </div>

      <button onClick={save} disabled={busy} className="w-full py-3.5 rounded-2xl font-bold text-white text-[14px] disabled:opacity-50" style={{ background: T.teal }}>
        {busy ? 'Salvando…' : 'Salvar ficha'}
      </button>

      {flash && <div className="fixed bottom-24 inset-x-0 flex justify-center z-40 px-6"><span className="px-4 py-2 rounded-full text-[13px] font-semibold text-white text-center" style={{ background: '#0F172A' }}>{flash}</span></div>}
    </div>
  )
}
