'use server'

import { createClient } from '@/lib/supabase/server'

export async function changePassword({ currentPassword, newPassword }: { currentPassword: string, newPassword: string }) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Authentication required to change password.' }
    }

    // Supabase auth.signInWithPassword validates the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (signInError) {
      return { error: 'Incorrect current password.' }
    }

    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      return { error: updateError.message }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred.' }
  }
}
