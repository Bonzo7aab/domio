'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getRegistrationSettingsForRegister } from '../database/platform-settings'
import { registrationClosedMessage } from '../registration-settings-shared'

export interface LoginData {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  userType: 'manager' | 'contractor'
  phone?: string
  company?: string
  organizationType?: 'spółdzielnia' | 'wspólnota'
  nip?: string
  companyName?: string
  street?: string
  city?: string
  district?: string
  categories?: string[]
}

export interface UpdateUserData {
  first_name?: string
  last_name?: string
  phone?: string
  profile_completed?: boolean
  onboarding_completed?: boolean
}

/**
 * Server Action for user login
 * Returns success/error and a role-correct redirect target so the client can navigate.
 */
export async function loginAction(
  formData: FormData
): Promise<{ success: true; redirectTo: string } | { error: string }> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const requestedRedirect = (formData.get('redirectTo') as string | null)?.trim() || ''

  if (!email || !password) {
    return { error: 'Email i hasło są wymagane' }
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const userId = signInData.user?.id
  let redirectTo = '/'

  if (userId) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type, platform_role')
      .eq('id', userId)
      .single()

    const isAdmin = profile?.platform_role === 'platform_admin'
    const isContractor = profile?.user_type === 'contractor'

    const roleHome = isAdmin
      ? '/admin'
      : isContractor
        ? '/contractor-dashboard'
        : '/manager-dashboard'

    if (isAdmin) {
      // Admins always land on /admin regardless of `redirectTo`.
      redirectTo = '/admin'
    } else if (
      requestedRedirect &&
      requestedRedirect.startsWith('/') &&
      !requestedRedirect.startsWith('//')
    ) {
      const forbiddenForContractor =
        isContractor &&
        (requestedRedirect.startsWith('/account') ||
          requestedRedirect.startsWith('/manager-dashboard') ||
          requestedRedirect.startsWith('/admin'))
      const forbiddenForManager =
        !isContractor &&
        (requestedRedirect.startsWith('/admin') ||
          requestedRedirect.startsWith('/contractor-dashboard'))

      redirectTo =
        forbiddenForContractor || forbiddenForManager ? roleHome : requestedRedirect
    } else {
      redirectTo = roleHome
    }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo }
}

export type RegisterActionResult =
  | { success: true; redirectTo: string }
  | { error: string }

/**
 * Server Action for user registration
 * Creates auth user, user_profiles, companies, and user_companies.
 */
export async function registerAction(
  formData: FormData
): Promise<RegisterActionResult | void> {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const firstName = (formData.get('firstName') as string)?.trim()
  const lastName = (formData.get('lastName') as string)?.trim()
  const userType = formData.get('userType') as 'contractor' | 'manager'
  const phone = (formData.get('phone') as string)?.trim()
  const acceptTerms = formData.get('acceptTerms') as string
  const nip = (formData.get('nip') as string)?.trim()
  const companyName = (formData.get('companyName') as string)?.trim()
  const organizationType = formData.get('organizationType') as 'spółdzielnia' | 'wspólnota' | null
  const street = (formData.get('street') as string)?.trim()
  const city = (formData.get('city') as string)?.trim() || undefined
  const district = (formData.get('district') as string)?.trim() || undefined
  const categories = formData.getAll('categories') as string[]

  if (!acceptTerms || acceptTerms === '0') {
    redirect(`/register?error=${encodeURIComponent('Musisz zaakceptować regulamin i politykę prywatności')}`)
  }

  if (!email || !password || !firstName || !lastName || !userType) {
    redirect(`/register?error=${encodeURIComponent('Proszę wypełnić wszystkie wymagane pola')}`)
  }

  if (!nip || !companyName) {
    redirect(`/register?error=${encodeURIComponent('NIP i Nazwa są wymagane')}`)
  }

  if (!phone) {
    redirect(`/register?error=${encodeURIComponent('Telefon jest wymagany')}`)
  }

  if (userType === 'manager') {
    if (!organizationType || !street || !district) {
      redirect(`/register?error=${encodeURIComponent('Uzupełnij typ organizacji, adres (ulica, dzielnica)')}`)
    }
  }

  if (userType === 'contractor' && (!categories || categories.length === 0)) {
    redirect(`/register?error=${encodeURIComponent('Wybierz co najmniej jedną kategorię')}`)
  }

  if (password.length < 6) {
    redirect(`/register?error=${encodeURIComponent('Hasło musi mieć co najmniej 6 znaków')}`)
  }

  if (password !== confirmPassword) {
    redirect(`/register?error=${encodeURIComponent('Hasła nie są identyczne')}`)
  }

  const registrationSettings = await getRegistrationSettingsForRegister()
  if (userType === 'contractor' && !registrationSettings.contractorOpen) {
    redirect(`/register?error=${encodeURIComponent(registrationClosedMessage('contractor'))}`)
  }
  if (userType === 'manager' && !registrationSettings.managerOpen) {
    redirect(`/register?error=${encodeURIComponent(registrationClosedMessage('manager'))}`)
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        user_type: userType,
        phone,
      },
    },
  })

  if (authError) {
    redirect(`/register?error=${encodeURIComponent(authError.message)}`)
  }

  if (!authData.user) {
    redirect(`/register?error=${encodeURIComponent('Nie udało się utworzyć konta')}`)
  }

  const userId = authData.user.id

  const { createAdminClient } = await import('../supabase/admin')
  const admin = createAdminClient()

  const { error: profileError } = await admin
    .from('user_profiles')
    .insert({
      id: userId,
      user_type: userType,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      is_verified: false,
      profile_completed: false,
      onboarding_completed: false,
    })

  if (profileError) {
    redirect(`/register?error=${encodeURIComponent(profileError.message)}`)
  }

  const companyType: 'spółdzielnia' | 'wspólnota' | 'contractor' =
    userType === 'manager'
      ? (organizationType as 'spółdzielnia' | 'wspólnota')
      : 'contractor'

  const address =
    userType === 'manager' && street && city && district
      ? `${street}, ${city}, ${district}`
      : undefined

  const companyPayload = {
    name: companyName,
    type: companyType,
    nip: nip || null,
    address: address ?? null,
    city: userType === 'manager' ? (city || 'Warszawa') : null,
    country: 'PL',
    email: email,
    phone: phone || null,
    is_verified: false,
    verification_level: 'none' as const,
    ...(userType === 'contractor' && {
      metadata: { primary_category_slugs: categories },
    }),
  }

  const { data: companyRow, error: companyError } = await admin
    .from('companies')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- companyPayload includes metadata, type not in DB schema
    .insert(companyPayload as any)
    .select('id')
    .single()

  if (companyError) {
    redirect(`/register?error=${encodeURIComponent(companyError.message)}`)
  }

  if (!companyRow?.id) {
    redirect(`/register?error=${encodeURIComponent('Nie udało się utworzyć firmy')}`)
  }

  // user_companies not in Database type; use type assertion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: ucError } = await (admin as any)
    .from('user_companies')
    .insert({
      user_id: userId,
      company_id: companyRow.id,
      role: 'owner',
      is_primary: true,
      is_active: true,
    })

  if (ucError) {
    redirect(`/register?error=${encodeURIComponent(ucError.message)}`)
  }

  revalidatePath('/', 'layout')

  const successMessage = encodeURIComponent(
    'Konto zostało utworzone pomyślnie. Zostałeś automatycznie zalogowany.'
  )

  if (authData.session) {
    const redirectTo =
      userType === 'contractor'
        ? `/verification?message=${successMessage}`
        : `/account?message=${successMessage}`
    return { success: true, redirectTo }
  }

  redirect(
    `/login?message=${encodeURIComponent('Konto zostało utworzone pomyślnie. Sprawdź email aby potwierdzić konto.')}`
  )
}

/**
 * Server Action for user logout
 */
export async function logoutAction() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Server Action for updating user profile
 */
export async function updateUserAction(userData: UpdateUserData) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(userData)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/', 'layout')
  return { success: true }
}

function getPublicAppOrigin(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  return base.replace(/\/$/, '')
}

/**
 * Sends Supabase password recovery email (PKCE). Link lands on `/auth/callback` then `/auth/update-password`.
 */
export async function requestPasswordResetEmailAction(
  email: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { error: 'Podaj prawidłowy adres email' }
  }

  const origin = getPublicAppOrigin()
  const next = encodeURIComponent('/auth/update-password')
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${origin}/auth/callback?next=${next}`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Server Action for password reset (legacy name; same as request flow used on forgot-password).
 */
export async function resetPasswordAction(email: string) {
  return requestPasswordResetEmailAction(email)
}

/**
 * Server Action for deleting user account
 * This permanently deletes the user from auth.users, which cascades to delete
 * user_profiles and all related data via database CASCADE constraints
 */
export async function deleteAccountAction() {
  try {
    const supabase = await createClient()
    
    // First, verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    const userId = user.id

    // Use admin client to delete the user
    // Import dynamically to avoid issues if service role key is not set
    const { createAdminClient } = await import('../supabase/admin')
    const adminClient = createAdminClient()
    
    // Delete the auth user - this will cascade delete user_profiles and related data
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('Error deleting user account:', deleteError)
      console.error('Delete error details:', JSON.stringify(deleteError, null, 2))
      
      // Provide more specific error messages
      if (deleteError.message?.includes('not found') || deleteError.message?.includes('does not exist')) {
        return { error: 'Użytkownik nie został znaleziony.' }
      }
      
      if (deleteError.message?.includes('permission') || deleteError.message?.includes('unauthorized')) {
        return {
          error:
            'Brak uprawnień do usunięcia konta. Sprawdź konfigurację SUPABASE_SECRET_KEY lub SUPABASE_SERVICE_ROLE_KEY.',
        }
      }
      
      return { error: `Błąd bazy danych podczas usuwania użytkownika: ${deleteError.message || 'Nieznany błąd'}` }
    }

    // Revalidate all paths to clear any cached user data
    revalidatePath('/', 'layout')
    
    // Sign out and redirect to homepage
    // Note: User is already deleted, but we clear any remaining session
    await supabase.auth.signOut()
    
    redirect('/')
  } catch (error: unknown) {
    console.error('Error in deleteAccountAction:', error)
    
    // Handle missing service role key gracefully
    if (
      error instanceof Error &&
      (error.message?.includes('SUPABASE_SECRET_KEY') ||
        error.message?.includes('SUPABASE_SERVICE_ROLE_KEY') ||
        error.message?.includes('elevated API key'))
    ) {
      return {
        error:
          'Usuwanie konta nie jest skonfigurowane. Dodaj do pliku .env.local zmienną SUPABASE_SECRET_KEY (klucz tajny sb_secret_...) albo SUPABASE_SERVICE_ROLE_KEY (legacy JWT). Supabase → Settings → API Keys.',
      }
    }
    
    // Handle missing URL
    if (error instanceof Error && error.message?.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      return { 
        error: 'Brak konfiguracji Supabase URL. Sprawdź zmienne środowiskowe.' 
      }
    }
    
    return { error: error instanceof Error ? error.message : 'Wystąpił błąd podczas usuwania konta' }
  }
}
