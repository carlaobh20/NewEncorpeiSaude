// ─────────────────────────────────────────────────────────────
// Supabase — PRONTO PARA PLUGAR (hoje o app roda com dados locais)
// ─────────────────────────────────────────────────────────────
// 1. Crie um projeto em https://supabase.com
// 2. Rode o SQL em app/supabase/schema.sql
// 3. Preencha app/.env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
// 4. `npm i @supabase/supabase-js` e descomente o bloco abaixo.
//
// import { createClient } from '@supabase/supabase-js'
// const url = import.meta.env.VITE_SUPABASE_URL as string
// const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string
// export const supabase = createClient(url, anon)

export const supabaseReady =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
