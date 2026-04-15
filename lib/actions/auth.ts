'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Changes the password for the currently authenticated user.
 * Validates the current password before allowing the update.
 */
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

/**
 * Initiates the password recovery workflow by sending a reset link to the user's email.
 */
export async function initiatePasswordReset(email: string, redirectTo?: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo
    })
    if (error) return { error: error.message }
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to initiate recovery protocol.' }
  }
}

/**
 * Verifies a password recovery OTP and updates the user's password.
 * This is used for the direct "Enter Code" workflow.
 */
export async function verifyOtpAndChangePassword({ email, token, newPassword }: { email: string, token: string, newPassword: string }) {
  try {
    const supabase = await createClient()
    
    // 1. Verify the OTP (recovery type)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery'
    })

    if (verifyError) {
      return { error: 'Invalid or expired verification code.' }
    }

    // 2. Update the password (must be done while session is active/established by verifyOtp)
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

/**
 * Sends a security code for MFA/Reauthentication purposes.
 */
export async function initiateReauthentication() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.reauthenticate()
    if (error) return { error: error.message }
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to send security code.' }
  }
}

/**
 * Verifies a reauthentication OTP and allows security-sensitive updates like password changes.
 */
export async function verifyReauthAndChangePassword({ email, token, newPassword }: { email: string, token: string, newPassword: string }) {
  try {
    const supabase = await createClient()
    
    // First verify the reauthentication OTP using email + token
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'reauthentication' as any
    })

    if (verifyError) return { error: 'Invalid or expired code. Please try again.' }

    // Once verified, we can update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) return { error: updateError.message }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Password update failed.' }
  }
}

