import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseReady = Boolean(url && anon)

// Cliente único. Se as env vars não estiverem setadas, supabaseReady = false
// e o app mostra um aviso em vez de quebrar.
export const supabase = createClient(url ?? 'http://localhost', anon ?? 'anon')
