'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, LogIn, Loader2, AlertCircle, Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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

    router.push('/vendor/dashboard')
    router.refresh()
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <span className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em] block mb-3">Welcome back</span>
        <h1 className="text-4xl font-black italic text-gray-900 font-serif leading-tight">
            Sign In
        </h1>
        <p className="text-sm text-gray-400 mt-2 font-medium">Access your vendor portal to managing products and inquiries.</p>
      </div>

      {/* Error alert */}
      {authError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-red-600 leading-relaxed">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="vendor@example.com"
                className={cn(
                    "rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-14 pl-12 pr-5 font-bold text-sm transition-all",
                    errors.email && "border-red-300 focus:border-red-300 ring-2 ring-red-50"
                )}
            />
          </div>
          {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-2">
           <div className="flex justify-between items-center px-1">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
               Security Password
             </label>
             <Link href="/forgot-password" size="sm" className="text-[10px] font-black text-green-700 uppercase tracking-widest hover:underline">
               Forgot?
             </Link>
           </div>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={cn(
                    "rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-14 pl-12 pr-12 font-bold text-sm transition-all font-mono tracking-widest",
                    errors.password && "border-red-300 focus:border-red-300 ring-2 ring-red-50"
                )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-14 rounded-full bg-green-700 hover:bg-green-800 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-green-700/20 gap-3 mt-4"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign In
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="pt-6 border-t border-gray-50 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            New vendor?{' '}
            <Link href="/register" className="text-green-700 hover:underline ml-1">
                 Create Merchant Account
            </Link>
        </p>
      </div>
    </div>
  )
}
