'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})
type ForgotFormValues = z.infer<typeof schema>

export default function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: ForgotFormValues) {
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/vendor/reset-password`,
    })

    setSubmitting(false)

    if (resetError) {
      setError('Something went wrong. Please try again in a moment.')
      return
    }

    // Always show success (avoids email enumeration)
    setSentTo(data.email)
  }

  if (sentTo) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            We sent a password reset link to{' '}
            <span className="font-bold text-gray-700">{sentTo}</span>. If you do not see it, check
            your spam folder.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full h-11 font-bold">
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Account recovery</p>
        <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
        <p className="text-sm text-gray-500">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <Separator />

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border-l-[3px] border-red-500 rounded-r-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Email address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="e.g. juandelacruz@gmail.com"
              className={`pl-9 h-11 ${errors.email ? 'border-red-400' : ''}`}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Remember your password?{' '}
        <Link href="/login" className="text-green-600 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
