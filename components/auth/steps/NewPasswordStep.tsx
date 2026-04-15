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
        setError('New password must be different from your old one.')
      } else if (msg.includes('session') || msg.includes('auth session missing')) {
        setError('Session expired. Please restart the process.')
        setSessionExpired(true)
      } else {
        setError(updateError.message || 'Failed to update password.')
      }
      return
    }

    onSuccess()
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-[2rem] bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-100 dark:border-green-500/20">
          <Lock className="w-8 h-8 text-green-700 dark:text-green-500" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter leading-none italic font-serif uppercase">
           New Password
        </h2>
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] max-w-[280px] mx-auto leading-relaxed">
           Create a strong, secure password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">
            New Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn(
                "h-14 pl-14 pr-14 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-700 shadow-inner",
                errors.password && "ring-2 ring-red-500/20"
              )}
            />
            <button
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors"
            >
               {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-red-500 font-black uppercase ml-4 mt-1">{errors.password.message}</p>}
          
          {/* Strength Indicator */}
          {passwordValue.length > 0 && (
            <div className="flex gap-1.5 px-4 pt-1">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-500",
                    strength >= i ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-gray-100 dark:bg-white/5"
                  )} 
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">
            Confirm Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
            <Input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn(
                "h-14 pl-14 pr-14 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-700 shadow-inner",
                errors.confirmPassword && "ring-2 ring-red-500/20"
              )}
            />
            <button
               type="button"
               onClick={() => setShowConfirm(!showConfirm)}
               className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors"
            >
               {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-[10px] text-red-500 font-black uppercase ml-4 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/10 animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <div>
               <p className="text-[10px] font-black text-red-900 dark:text-red-400 uppercase tracking-widest leading-relaxed">{error}</p>
               {sessionExpired && (
                 <button onClick={() => window.location.reload()} className="text-[10px] text-green-700 dark:text-green-500 underline font-black uppercase tracking-widest mt-2 block">
                    Restart Process →
                 </button>
               )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-14 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <div className="flex items-center justify-center gap-3">
               <span>Update Password</span>
               <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>
      </form>
    </div>
  )
}
