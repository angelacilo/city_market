'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import StepIndicator from './StepIndicator'

const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      })
    }
  })

type NewPasswordValues = z.infer<typeof newPasswordSchema>

interface NewPasswordStepProps {
  onSuccess: () => void
}

function getPasswordStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  return score
}

const strengthLabels = ['', 'Too short', 'Weak', 'Almost there', 'Strong']
const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']

export default function NewPasswordStep({ onSuccess }: NewPasswordStepProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' })
  const strength = getPasswordStrength(passwordValue)

  async function onSubmit(data: NewPasswordValues) {
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    setSubmitting(false)

    if (updateError) {
      const msg = updateError.message.toLowerCase()
      if (msg.includes('same password') || msg.includes('different from')) {
        setError('New password must be different from your current password.')
      } else if (msg.includes('session') || msg.includes('auth session missing')) {
        setError('Your session has expired. Please start the password reset process again.')
        setSessionExpired(true)
      } else {
        setError('Failed to update your password. Please try again.')
      }
      return
    }

    onSuccess()
  }

  return (
    <div className="space-y-6">
      <StepIndicator current={3} />

      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-500/5 flex items-center justify-center border border-green-100/50 dark:border-green-500/10 shadow-inner">
          <Lock className="w-6 h-6 text-green-700 dark:text-green-500" />
        </div>
        <div className="mt-6 flex flex-col items-center">
          <p className="text-[10px] font-black tracking-[0.4em] text-green-700 dark:text-green-500 uppercase">
            Phase 03 — Credential Reconfiguration
          </p>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mt-3 italic font-serif tracking-tighter uppercase leading-none">
            Reset <span className="text-green-700 dark:text-green-500">Access Key</span>
          </h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed mt-4 max-w-[280px] font-bold uppercase tracking-widest opacity-80">
            Identity verified. Establish a high-entropy signature for your account record.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* New password */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-4">
            New Signature <span className="text-red-500">*</span>
          </label>
          <div className="relative group/input">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-800 group-focus-within/input:text-green-700 dark:group-focus-within/input:text-green-500 transition-colors" />
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min 8 characters"
              className={cn(
                'rounded-3xl border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.06] h-16 pl-14 pr-14 text-xs font-black text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800',
                errors.password && 'ring-2 ring-red-500/20'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-800 hover:text-green-700 dark:hover:text-green-500 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[9px] text-red-500 font-black uppercase tracking-widest ml-4">{errors.password.message}</p>
          )}
        </div>

        {/* Password strength indicator */}
        {passwordValue.length > 0 && (
          <div className="space-y-2 px-4 animate-in fade-in slide-in-from-top-1 duration-200">
             <p className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-widest mb-2">Entropy Level</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-500',
                    strength >= level 
                      ? (strength === 4 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : strengthColors[strength]) 
                      : 'bg-gray-100 dark:bg-white/5'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirm password */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-4">
            Confirm Signature <span className="text-red-500">*</span>
          </label>
          <div className="relative group/input">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-800 group-focus-within/input:text-green-700 dark:group-focus-within/input:text-green-500 transition-colors" />
            <Input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Verification signature"
              className={cn(
                'rounded-3xl border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.06] h-16 pl-14 pr-14 text-xs font-black text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800',
                errors.confirmPassword && 'ring-2 ring-red-500/20'
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-800 hover:text-green-700 dark:hover:text-green-500 transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[9px] text-red-500 font-black uppercase tracking-widest ml-4">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/5 border-l-4 border-red-500 rounded-r-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-red-700 dark:text-red-400 font-black uppercase tracking-widest leading-relaxed">{error}</p>
              {sessionExpired && (
                <Link
                  href="/forgot-password"
                  className="text-[10px] text-green-700 dark:text-green-500 underline font-black uppercase tracking-widest mt-2 inline-block hover:opacity-80"
                >
                  Restart Matrix →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#1b6b3e] hover:bg-[#155430] text-white h-16 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] gap-3 shadow-[0_20px_40px_-15px_rgba(27,107,62,0.4)] transition-all active:scale-[0.98] group"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Updating Core Registry...
            </>
          ) : (
            <>
              Update Access Key
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
