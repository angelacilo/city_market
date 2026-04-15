'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ChevronLeft, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface OtpStepProps {
  email: string
  onSuccess: () => void
  onBack: () => void
}

export default function OtpStep({ email, onSuccess, onBack }: OtpStepProps) {
  // Updated to 8 digits to match Supabase settings
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(60)
  const [resendLoading, setResendLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array(8).fill(null))

  useEffect(() => {
    setResendCooldown(60)
  }, [])

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
    const char = value.slice(-1)
    if (char && !/^\d$/.test(char)) return

    updateDigit(index, char)
    setError('')

    if (char && index < 7) {
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
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (!pasted) return

    const newDigits = [...digits]
    for (let i = 0; i < 8; i++) {
      newDigits[i] = pasted[i] || ''
    }
    setDigits(newDigits)
    setError('')

    const lastFilled = Math.min(pasted.length, 8) - 1
    inputRefs.current[lastFilled]?.focus()
  }

  async function handleResend() {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setError('')

    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resetPasswordForEmail(email)

    setResendLoading(false)
    if (resendError) {
      if (resendError.message.includes('rate limit')) {
         setError('Rate limit exceeded. Please wait.')
      }
      toast.error('Failed to resend: ' + resendError.message)
    } else {
      setResendCooldown(60)
      toast.success('Recovery code resent.')
    }
  }

  async function handleVerify() {
    const token = digits.join('')
    if (token.length < 8) return

    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    })

    setSubmitting(false)

    if (verifyError) {
      const msg = verifyError.message.toLowerCase()
      if (msg.includes('expired')) {
        setError('Code expired. Please resend.')
      } else {
        setError('Invalid code. Please check and try again.')
      }
      return
    }

    onSuccess()
  }

  const allFilled = digits.join('').length === 8

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-[2rem] bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-100 dark:border-green-500/20">
          <ShieldCheck className="w-8 h-8 text-green-700 dark:text-green-500" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter leading-none italic font-serif uppercase">
           Verify Code
        </h2>
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] max-w-[280px] mx-auto leading-relaxed">
          Enter the 8-digit code sent to <span className="text-green-700 dark:text-green-500 lowercase underline">{email}</span>
        </p>
      </div>

      <div className="flex justify-between gap-1 sm:gap-2 mb-8 overflow-x-auto pb-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={cn(
              'w-8 sm:w-10 h-14 sm:h-16 text-lg sm:text-xl font-black text-center transition-all duration-300',
              'bg-gray-50 dark:bg-white/[0.04] border-none rounded-xl shadow-inner text-gray-900 dark:text-white',
              'focus:bg-white dark:focus:bg-white/[0.08] focus:ring-2 focus:ring-green-700/20 focus:outline-none focus:scale-105',
              digit !== '' && 'ring-2 ring-green-700/10'
            )}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/10 mb-8 animate-in fade-in zoom-in duration-300">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-[10px] font-black text-red-900 dark:text-red-400 uppercase tracking-widest leading-relaxed">
            {error}
          </p>
        </div>
      )}

      <div className="space-y-6">
        <Button
          type="button"
          onClick={handleVerify}
          disabled={submitting || !allFilled}
          className="w-full h-14 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <div className="flex items-center justify-center gap-3">
               <span>Verify Code</span>
               <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-500 uppercase tracking-widest transition-colors disabled:opacity-40"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
          </button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-green-700 dark:hover:text-white transition-all h-8"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Change Email
          </Button>
        </div>
      </div>
    </div>
  )
}
