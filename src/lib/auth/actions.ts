'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
 * Returns success/error instead of redirecting to allow client-side handling
 */
export async function loginAction(formData: FormData): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Email i hasło są wymagane' }
  }
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    return { error: error.message }
  }
  
  console.log('Login successful')
  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Server Action for user registration
 */
export async function registerAction(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const userType = formData.get('userType') as 'contractor' | 'manager'
  const phone = formData.get('phone') as string
  const company = formData.get('company') as string

  // Validation
  if (!email || !password || !firstName || !lastName || !userType) {
    redirect(`/register?error=${encodeURIComponent('Proszę wypełnić wszystkie wymagane pola')}`)
  }

  if (password.length < 6) {
    redirect(`/register?error=${encodeURIComponent('Hasło musi mieć co najmniej 6 znaków')}`)
  }

  if (password !== confirmPassword) {
    redirect(`/register?error=${encodeURIComponent('Hasła nie są identyczne')}`)
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        user_type: userType,
        phone,
        company
      }
    }
  })

  if (authError) {
    redirect(`/register?error=${encodeURIComponent(authError.message)}`)
  }
  
  if (!authData.user) {
    redirect(`/register?error=${encodeURIComponent('Failed to create user')}`)
  }

  // Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      user_type: userType,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      is_verified: false,
      profile_completed: false,
      onboarding_completed: false
    })

  if (profileError) {
    redirect(`/register?error=${encodeURIComponent(profileError.message)}`)
  }
  
  revalidatePath('/', 'layout')
  
  // Check if user was auto-confirmed (session exists) or needs email confirmation
  // If session exists, user is already logged in - redirect to home
  // Otherwise, redirect to login with message about email confirmation
  if (authData.session) {
    // User is auto-confirmed and logged in - redirect to home
    // The auth context will sync the session on the next page load
    redirect('/?message=Konto zostało utworzone pomyślnie. Zostałeś automatycznie zalogowany.')
  } else {
    // Email confirmation required - redirect to login
    redirect('/login?message=Konto zostało utworzone pomyślnie. Sprawdź email aby potwierdzić konto.')
  }
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

/**
 * Server Action for password reset
 */
export async function resetPasswordAction(email: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
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
    const { data: deleteData, error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('Error deleting user account:', deleteError)
      console.error('Delete error details:', JSON.stringify(deleteError, null, 2))
      
      // Provide more specific error messages
      if (deleteError.message?.includes('not found') || deleteError.message?.includes('does not exist')) {
        return { error: 'Użytkownik nie został znaleziony.' }
      }
      
      if (deleteError.message?.includes('permission') || deleteError.message?.includes('unauthorized')) {
        return { error: 'Brak uprawnień do usunięcia konta. Sprawdź konfigurację SUPABASE_SERVICE_ROLE_KEY.' }
      }
      
      return { error: `Błąd bazy danych podczas usuwania użytkownika: ${deleteError.message || 'Nieznany błąd'}` }
    }

    // Revalidate all paths to clear any cached user data
    revalidatePath('/', 'layout')
    
    // Sign out and redirect to homepage
    // Note: User is already deleted, but we clear any remaining session
    await supabase.auth.signOut()
    
    redirect('/')
  } catch (error: any) {
    console.error('Error in deleteAccountAction:', error)
    
    // Handle missing service role key gracefully
    if (error.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return { 
        error: 'Usuwanie konta nie jest skonfigurowane. Dodaj zmienną środowiskową SUPABASE_SERVICE_ROLE_KEY do pliku .env.local. Klucz można znaleźć w ustawieniach projektu Supabase w sekcji API → service_role (secret) key.' 
      }
    }
    
    // Handle missing URL
    if (error.message?.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      return { 
        error: 'Brak konfiguracji Supabase URL. Sprawdź zmienne środowiskowe.' 
      }
    }
    
    return { error: error.message || 'Wystąpił błąd podczas usuwania konta' }
  }
}
