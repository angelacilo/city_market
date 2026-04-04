'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
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
    <div className="space-y-5">
      <StepIndicator current={3} />

      {/* No back button on step 3 - session is already established */}

      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <Lock className="w-6 h-6 text-green-700" />
        </div>
        <p className="text-xs font-bold tracking-widest text-green-600 uppercase mt-4">
          Step 3 of 3
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          Set new password
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mt-2 mb-6">
          Your identity has been verified. Create a strong new password for
          your vendor account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            New password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Enter your new password"
              className={cn(
                'rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-12 pl-11 pr-11 text-sm transition-all',
                errors.password && 'border-red-300 focus:border-red-300 ring-2 ring-red-50'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Password strength indicator */}
        {passwordValue.length > 0 && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors duration-300',
                    strength >= level ? strengthColors[strength] : 'bg-gray-200'
                  )}
                />
              ))}
            </div>
            <p
              className={cn(
                'text-xs font-medium transition-colors',
                strength <= 1 && 'text-red-500',
                strength === 2 && 'text-orange-500',
                strength === 3 && 'text-yellow-600',
                strength === 4 && 'text-green-600'
              )}
            >
              {strengthLabels[strength]}
            </p>
          </div>
        )}

        {/* Confirm password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            Confirm password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Confirm your new password"
              className={cn(
                'rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-12 pl-11 pr-11 text-sm transition-all',
                errors.confirmPassword && 'border-red-300 focus:border-red-300 ring-2 ring-red-50'
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              {sessionExpired && (
                <Link
                  href="/forgot-password"
                  className="text-sm text-green-700 underline font-medium mt-1 inline-block"
                >
                  Start over →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-700 hover:bg-green-800 text-white h-11 rounded-full text-sm font-semibold gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              Update password
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
