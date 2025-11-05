import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

/**
 * Creates a Supabase admin client with service role key
 * This client bypasses Row Level Security and should only be used server-side
 * 
 * Required environment variable: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

