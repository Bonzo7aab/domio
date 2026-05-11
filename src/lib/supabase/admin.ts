import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

/**
 * Creates a Supabase admin client with service role key.
 * This client bypasses Row Level Security and must only be used server-side.
 *
 * Set `SUPABASE_SERVICE_ROLE_KEY` in server env (e.g. `.env.local`).
 * Do not use `NEXT_PUBLIC_*` for the service role — it must never ship to the browser.
 *
 * Legacy: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is still read if set (not recommended).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable (service role secret from Supabase → Settings → API)'
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

