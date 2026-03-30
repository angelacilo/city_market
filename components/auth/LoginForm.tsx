'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginFormValues) {
    setSubmitting(true)
    setAuthError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setSubmitting(false)
      if (error.message.includes('Invalid login credentials')) {
        setAuthError('Incorrect email or password. Please check your details and try again.')
      } else if (error.message.includes('Email not confirmed')) {
        setAuthError('Please verify your email address before signing in. Check your inbox for a confirmation link.')
      } else {
        setAuthError('Something went wrong. Please try again in a moment.')
      }
      return
    }

    // Success — push to vendor dashboard
    router.push('/vendor/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Welcome back 👋</p>
        <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
        <p className="text-sm text-gray-500">Enter your email and password to access your vendor dashboard.</p>
      </div>

      <Separator />

      {/* Error alert */}
      {authError && (
        <div className="flex items-start gap-3 bg-red-50 border-l-[3px] border-red-500 rounded-r-lg px-4 py-3 transition-opacity duration-200">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Email address <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="e.g. juandelacruz@gmail.com"
            className={`h-11 ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`h-11 pr-10 ${errors.password ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-green-600 hover:text-green-700 font-medium">
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg gap-2 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign in
            </>
          )}
        </Button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-green-600 font-semibold hover:underline">
          Register here
        </Link>
      </p>
    </div>
  )
}
