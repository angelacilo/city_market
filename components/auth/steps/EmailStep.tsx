'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, ChevronLeft, ArrowRight, Loader2, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import StepIndicator from './StepIndicator'

const emailStepSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type EmailStepValues = z.infer<typeof emailStepSchema>

interface EmailStepProps {
  onSubmit: (email: string) => Promise<void>
  submitting: boolean
}

export default function EmailStep({ onSubmit, submitting }: EmailStepProps) {
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailStepValues>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: '' },
  })

  async function handleFormSubmit(data: EmailStepValues) {
    setError('')
    try {
      await onSubmit(data.email)
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <StepIndicator current={1} />

      {/* Back to login */}
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-600 hover:text-green-700 dark:hover:text-green-500 transition-all uppercase tracking-[0.2em] group"
      >
        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        Terminate Reset Protocol
      </Link>

      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-500/5 flex items-center justify-center border border-green-100/50 dark:border-green-500/10 shadow-inner">
          <Mail className="w-6 h-6 text-green-700 dark:text-green-500" />
        </div>
        <div className="mt-6 flex flex-col items-center">
          <p className="text-[10px] font-black tracking-[0.4em] text-green-700 dark:text-green-500 uppercase">
            Phase 01 — Identity Resolution
          </p>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mt-3 italic font-serif tracking-tighter uppercase leading-none">
            Find Your <span className="text-green-700 dark:text-green-500">Record</span>
          </h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed mt-4 max-w-[280px] font-bold uppercase tracking-widest opacity-80">
            Enter the authorized email address associated with your secure account.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Email field */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-4">
            Identity Signature (Email)
          </label>
          <div className="relative group/input">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-800 group-focus-within/input:text-green-700 dark:group-focus-within/input:text-green-500 transition-colors" />
            <Input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="auth@bcmis.cloud"
              className={cn(
                'rounded-3xl border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.06] h-16 pl-14 pr-6 text-xs font-black text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800',
                errors.email && 'ring-2 ring-red-500/20'
              )}
            />
          </div>
          {errors.email && (
            <p className="text-[9px] text-red-500 font-black uppercase tracking-widest ml-4">{errors.email.message}</p>
          )}
        </div>

        {/* Info box */}
        <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[9px] text-blue-900/60 dark:text-blue-400/60 leading-relaxed font-black uppercase tracking-wider">
            An 8-digit verification sequence will be dispatched to your Gmail inbox. Check your secure relays (spam) if not received.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/5 border-l-4 border-red-500 rounded-r-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-700 dark:text-red-400 font-black uppercase tracking-widest">{error}</p>
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
              Broadcasting Code...
            </>
          ) : (
            <>
              Initialize Recovery
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
