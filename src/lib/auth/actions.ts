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
 */
export async function loginAction(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }
  
  console.log('Login successful')
  revalidatePath('/', 'layout')
  redirect('/')
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
  redirect('/login?message=Konto zostało utworzone pomyślnie. Sprawdź email aby potwierdzić konto.')
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
