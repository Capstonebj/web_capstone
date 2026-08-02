import { createClient } from '@supabase/supabase-js'

// These come from your Render environment variables (see README.md).
// Never hardcode the service_role key here — only the public anon key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Variables Supabase manquantes. Définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
