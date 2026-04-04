'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ChevronLeft, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import StepIndicator from './StepIndicator'

interface OtpStepProps {
  email: string
  onSuccess: () => void
  onBack: () => void
}

export default function OtpStep({ email, onSuccess, onBack }: OtpStepProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(30)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null])

  // Initial 30s cooldown on mount
  useEffect(() => {
    setResendCooldown(30)
  }, [])

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [resendCooldown])

  const updateDigit = useCallback((index: number, value: string) => {
    setDigits((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  function handleChange(index: number, value: string) {
    // Keep only the last typed character (handles overtype)
    const char = value.slice(-1)
    // Only allow digits
    if (char && !/^\d$/.test(char)) return

    updateDigit(index, char)
    setError('')

    // Auto-advance
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      updateDigit(index - 1, '')
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const newDigits = [...digits]
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || ''
    }
    setDigits(newDigits)
    setError('')

    // Focus the last filled or the 6th box
    const lastFilled = Math.min(pasted.length, 6) - 1
    inputRefs.current[lastFilled]?.focus()
  }

  async function handleResend() {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setError('')

    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    setResendLoading(false)
    setResendCooldown(30)
    setResendSuccess('Code resent successfully')
    setTimeout(() => setResendSuccess(''), 3000)
  }

  async function handleVerify() {
    const token = digits.join('')
    if (token.length < 6) return

    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    setSubmitting(false)

    if (verifyError) {
      const msg = verifyError.message.toLowerCase()
      if (msg.includes('expired') || msg.includes('otp_expired')) {
        setError('Your code has expired. Please request a new code by clicking Resend.')
      } else if (msg.includes('invalid') || msg.includes('otp_invalid') || verifyError.status === 422) {
        setError('Incorrect code. Please check your email and try again. You have a few attempts remaining.')
      } else {
        setError('Verification failed. Please try again.')
      }
      return
    }

    onSuccess()
  }

  const allFilled = digits.join('').length === 6

  return (
    <div className="space-y-5">
      <StepIndicator current={2} />

      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back
      </button>

      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-green-700" />
        </div>
        <p className="text-xs font-bold tracking-widest text-green-600 uppercase mt-4">
          Step 2 of 3
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          Enter verification code
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mt-2 mb-6">
          We sent a 6-digit code to{' '}
          <span className="text-green-700 font-semibold">{email}</span>.
        </p>
      </div>

      {/* 6-digit OTP inputs */}
      <div className="flex justify-center gap-3 mb-6">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={cn(
              'w-[52px] h-[60px] text-2xl font-black text-center text-gray-900',
              'border-2 border-gray-200 rounded-xl',
              'focus:border-green-600 focus:outline-none focus:ring-0',
              'caret-green-600 transition-colors bg-white',
              error && digit === '' && 'border-red-300'
            )}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Resend row */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Didn&apos;t receive the code?</span>
        {resendCooldown > 0 ? (
          <span className="text-sm text-gray-400">
            Resend in {resendCooldown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm text-green-700 font-medium underline hover:text-green-800 transition-colors disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend code'}
          </button>
        )}
      </div>

      {/* Resend success message */}
      {resendSuccess && (
        <p className="text-xs text-green-600 text-center animate-in fade-in">
          {resendSuccess}
        </p>
      )}

      {/* Verify button */}
      <Button
        type="button"
        onClick={handleVerify}
        disabled={submitting || !allFilled}
        className="w-full bg-green-700 hover:bg-green-800 text-white h-11 rounded-full text-sm font-semibold gap-2 disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <ShieldCheck className="w-3.5 h-3.5" />
            Verify code
          </>
        )}
      </Button>
    </div>
  )
}
