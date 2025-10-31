import { createClient } from '../lib/supabase/server'
import { getCurrentUser } from '../lib/auth/user-profile'
import { Header } from './Header'

export async function HeaderWrapper() {
  // Fetch user server-side
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  return <Header initialUser={user} />
}
