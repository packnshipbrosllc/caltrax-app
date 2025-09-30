import { createClient } from '@supabase/supabase-js'

// Prefer REACT_APP_* but fall back to NEXT_PUBLIC_*
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl)
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

