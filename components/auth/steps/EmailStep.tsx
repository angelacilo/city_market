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
    <div className="space-y-5">
      <StepIndicator current={1} />

      {/* Back to login */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to login
      </Link>

      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <Mail className="w-6 h-6 text-green-700" />
        </div>
        <p className="text-xs font-bold tracking-widest text-green-600 uppercase mt-4">
          Step 1 of 3
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          Find your account
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mt-2 mb-6">
          Enter the email address registered to your vendor account. We will
          send a 6-digit verification code to your inbox.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Email field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            Email address <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="e.g. juandelacruz@gmail.com"
            className={cn(
              'rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-12 px-4 text-sm transition-all',
              errors.email && 'border-red-300 focus:border-red-300 ring-2 ring-red-50'
            )}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">
            A 6-digit code will be sent to your Gmail inbox. Check your spam
            folder if you do not receive it within a minute.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
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
              Sending code...
            </>
          ) : (
            <>
              Send verification code
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
