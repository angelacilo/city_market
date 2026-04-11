import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ChevronLeft, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import StepIndicator from './StepIndicator'

interface OtpStepProps {
  email: string
  onSuccess: () => void
  onBack: () => void
}

export default function OtpStep({ email, onSuccess, onBack }: OtpStepProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(30)
  const [resendLoading, setResendLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null, null, null])

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
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    setResendLoading(false)
    if (resendError) {
      toast.error('Dispatch failed: ' + resendError.message)
    } else {
      setResendCooldown(30)
      toast.success('8-digit sequence re-transmitted to terminal.')
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
      type: 'recovery', // password reset uses 'recovery'
    })

    setSubmitting(false)

    if (verifyError) {
      const msg = verifyError.message.toLowerCase()
      if (msg.includes('expired')) {
        setError('Sequence expired. Re-transmit code.')
        toast.error('Identity Challenge Expired')
      } else {
        setError('Incorrect sequence. Unauthorized access attempt logged.')
        toast.error('Verification Failure')
      }
      return
    }

    toast.success('Identity Verified', { description: 'Matrix access granted.' })
    onSuccess()
  }

  const allFilled = digits.join('').length === 8

  return (
    <div className="space-y-6">
      <StepIndicator current={2} />

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-600 hover:text-green-700 dark:hover:text-green-500 transition-all uppercase tracking-[0.2em] group"
      >
        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        Retreat to Step 01
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/5 flex items-center justify-center border border-amber-100/50 dark:border-amber-500/10 shadow-inner">
          <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-500" />
        </div>
        <div className="mt-6 flex flex-col items-center">
          <p className="text-[10px] font-black tracking-[0.4em] text-amber-600 dark:text-amber-500 uppercase">
            Phase 02 — Cryptographic Challenge
          </p>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mt-3 italic font-serif tracking-tighter uppercase leading-none">
            Enter <span className="text-amber-500">Access Key</span>
          </h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed mt-4 max-w-[280px] font-bold uppercase tracking-widest opacity-80">
            An 8-digit sequence was dispatched to <span className="text-gray-900 dark:text-white underline decoration-amber-500/30">{email}</span>.
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-2 py-4">
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
              'w-[38px] sm:w-[46px] h-14 text-xl font-black text-center transition-all duration-300',
              'bg-gray-50 dark:bg-white/[0.03] border-none rounded-xl',
              'text-gray-900 dark:text-white shadow-inner',
              'focus:bg-white dark:focus:bg-white/[0.08] focus:ring-2 focus:ring-amber-500/20 focus:outline-none',
              error && digit === '' && 'ring-2 ring-red-500/20',
              digit !== '' && ' ring-2 ring-amber-500/10'
            )}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/5 border-l-4 border-red-500 rounded-r-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-700 dark:text-red-400 font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-widest">Protocol Stalled?</span>
          {resendCooldown > 0 ? (
            <span className="text-[10px] font-black text-gray-300 dark:text-gray-800 uppercase tracking-widest">
              Retry in {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest hover:underline hover:underline-offset-4 transition-all disabled:opacity-30"
            >
              {resendLoading ? 'Re-Broadcasting...' : 'Re-Transmit Code'}
            </button>
          )}
        </div>
      </div>

      <Button
        type="button"
        onClick={handleVerify}
        disabled={submitting || !allFilled}
        className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500/80 dark:hover:bg-amber-500 text-white h-16 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] gap-3 shadow-[0_20px_40px_-15px_rgba(217,119,6,0.2)] dark:shadow-[0_0_30px_rgba(217,119,6,0.1)] transition-all active:scale-[0.98] group"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifying Signature...
          </>
        ) : (
          <>
            Decrypt Identity
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </>
        )}
      </Button>
    </div>
  )
}
