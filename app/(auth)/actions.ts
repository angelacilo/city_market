'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    redirect('/login?message=Email and password are required')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?message=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/vendor/dashboard')
}


export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string) || (formData.get('owner_name') as string)
  
  // Vendor specific
  const businessName = formData.get('business_name') as string
  const marketId = formData.get('market_id') as string
  const stallNumber = formData.get('stall_number') as string
  const contactNumber = formData.get('contact_number') as string

  if (!email || !password || !fullName || !businessName || !marketId) {
    redirect('/register?message=All required fields must be filled')
  }

  const supabase = await createClient()

  // 1. Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'vendor',
      }
    }
  })

  if (authError) {
    redirect('/register?message=' + encodeURIComponent(authError.message))
  }

  if (authData.user) {
    // 2. Create the vendor profile
    const { error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id: authData.user.id,
        business_name: businessName,
        owner_name: fullName,
        market_id: marketId,
        stall_number: stallNumber,
        contact_number: contactNumber,
        is_approved: false, // Requires admin approval
      })

    if (vendorError) {
      // Note: Ideally we should delete the auth user if this fails, 
      // but for simplicity we'll just redirect with error
      redirect('/register?message=' + encodeURIComponent('User created but vendor profile failed: ' + vendorError.message))
    }
  }

  redirect('/login?message=' + encodeURIComponent('Registration successful! Please wait for admin approval before logging in.'))
}
