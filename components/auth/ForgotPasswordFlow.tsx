'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import EmailStep from '@/components/auth/steps/EmailStep'
import OtpStep from '@/components/auth/steps/OtpStep'
import NewPasswordStep from '@/components/auth/steps/NewPasswordStep'
import SuccessView from '@/components/auth/steps/SuccessView'

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  async function handleEmailSubmit(submittedEmail: string) {
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: submittedEmail,
        options: {
          shouldCreateUser: false,
        },
      })

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('user not found') || msg.includes('no user found') || error.status === 422) {
          throw new Error('No vendor account found with this email address. Please check your email or register a new account.')
        }
        if (msg.includes('rate limit') || msg.includes('429') || error.status === 429) {
          throw new Error('Too many attempts. Please wait a few minutes before trying again.')
        }
        throw new Error('Failed to send verification code. Please try again.')
      }

      setEmail(submittedEmail)
      setStep(2)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpVerified() {
    setStep(3)
  }

  async function handlePasswordUpdated() {
    // Sign out so vendor logs in fresh
    await supabase.auth.signOut()
    setSuccess(true)
  }

  if (success) {
    return <SuccessView />
  }

  if (step === 1) {
    return (
      <EmailStep
        onSubmit={handleEmailSubmit}
        submitting={submitting}
      />
    )
  }

  if (step === 2) {
    return (
      <OtpStep
        email={email}
        onSuccess={handleOtpVerified}
        onBack={() => setStep(1)}
      />
    )
  }

  return (
    <NewPasswordStep
      onSuccess={handlePasswordUpdated}
    />
  )
}
