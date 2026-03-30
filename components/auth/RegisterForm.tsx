'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Eye, EyeOff, UserPlus, Loader2, AlertCircle,
  Building2, User, MapPin, DoorOpen, Phone, Info,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ── Schema ────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters with one uppercase letter and one number')
      .refine((v) => /[A-Z]/.test(v), {
        message: 'Password must be at least 8 characters with one uppercase letter and one number',
      })
      .refine((v) => /[0-9]/.test(v), {
        message: 'Password must be at least 8 characters with one uppercase letter and one number',
      }),
    confirmPassword: z.string(),
    businessName: z
      .string()
      .min(3, 'Please enter your business or stall name.')
      .max(80, 'Please enter your business or stall name.'),
    ownerName: z
      .string()
      .min(2, "Please enter the stall owner's full name.")
      .max(100, "Please enter the stall owner's full name."),
    marketId: z.string().min(1, 'Please select the market where your stall is located.'),
    stallNumber: z.string().max(20).optional(),
    contactNumber: z
      .string()
      .regex(/^09\d{9}$/, 'Please enter a valid Philippine mobile number starting with 09.'),
    agreeToTerms: z
      .boolean()
      .refine((v) => v === true, { message: 'You must agree to the terms to continue.' }),
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

type RegisterFormValues = z.infer<typeof registerSchema>

// ── Password strength ─────────────────────────────────────────────────

function getPasswordStrength(val: string): 0 | 1 | 2 | 3 | 4 {
  if (!val) return 0
  let score = 0
  if (val.length >= 8) score++
  if (/[a-z]/.test(val)) score++
  if (/[A-Z]/.test(val) || /[0-9]/.test(val)) score++
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4
}

const strengthMeta: Record<1 | 2 | 3 | 4, { label: string; color: string; bg: string }> = {
  1: { label: 'Too short', color: 'text-red-500', bg: 'bg-red-500' },
  2: { label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500' },
  3: { label: 'Almost there', color: 'text-yellow-500', bg: 'bg-yellow-400' },
  4: { label: 'Strong', color: 'text-green-600', bg: 'bg-green-500' },
}

function mapSupabaseError(errorMsg: string): string {
  const msg = errorMsg.toLowerCase()
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit') || msg.includes('429')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (msg.includes('password should be')) {
    return 'Your password does not meet the requirements. Please use at least 8 characters with one uppercase letter and one number.'
  }
  if (msg.includes('unable to validate email')) {
    return 'Please enter a valid email address.'
  }
  return 'Something went wrong. Please try again in a moment.'
}

// ── Props ─────────────────────────────────────────────────────────────

interface Props {
  markets: { id: string; name: string }[]
}

// ── Component ─────────────────────────────────────────────────────────

export default function RegisterForm({ markets }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const lastSubmitTime = useRef<number>(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      ownerName: '',
      marketId: '',
      stallNumber: '',
      contactNumber: '',
    },
  })

  const passwordValue = watch('password') ?? ''
  const strength = getPasswordStrength(passwordValue)

  async function onSubmit(data: RegisterFormValues) {
    const now = Date.now()
    if (now - lastSubmitTime.current < 30000) {
      setAuthError('Please wait a moment before trying again')
      return
    }
    lastSubmitTime.current = now

    setSubmitting(true)
    setAuthError('')

    const supabase = createClient()

    // 1. Sign up with Supabase auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { 
        data: { name: data.ownerName }
      },
    })

    if (signUpError) {
      setSubmitting(false)
      setAuthError(mapSupabaseError(signUpError.message))
      return
    }

    if (!authData.user) {
      setSubmitting(false)
      setAuthError('Something went wrong. Please try again in a moment.')
      return
    }

    // 2. Insert vendor row
    const { error: vendorError } = await supabase.from('vendors').insert({
      user_id: authData.user.id,
      market_id: data.marketId,
      business_name: data.businessName.trim(),
      owner_name: data.ownerName.trim(),
      stall_number: data.stallNumber?.trim() || undefined,
      contact_number: data.contactNumber.trim(),
      is_approved: true,
      is_active: true,
    })

    if (vendorError) {
      setSubmitting(false)
      setAuthError(
        'Your account was created but we could not save your stall details. Please contact support.'
      )
      return
    }

    // Success — push straight to vendor dashboard where the "Pending Approval" UI handles the rest
    router.push('/vendor/dashboard')
  }


  // ── Form view ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Create your account</p>
        <h1 className="text-2xl font-bold text-gray-900">Register your stall</h1>
        <p className="text-sm text-gray-500">Fill in your details to start listing your products in Butuan markets.</p>
      </div>

      <Separator />

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Registration is free. Your account will be reviewed by the market administrator before
          activation, which typically takes one to two business days.
        </p>
      </div>

      {/* Error alert */}
      {authError && (
        <div className="flex items-start gap-3 bg-red-50 border-l-[3px] border-red-500 rounded-r-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Group 1: Account details ─────────────────────────────── */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Account details</p>

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
              className={`h-11 ${errors.email ? 'border-red-400' : ''}`}
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
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                className={`h-11 pr-10 ${errors.password ? 'border-red-400' : ''}`}
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength */}
            {passwordValue && (
              <div className="space-y-1 pt-0.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength
                          ? strengthMeta[strength as 1 | 2 | 3 | 4]?.bg ?? 'bg-gray-200'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                {strength > 0 && (
                  <p className={`text-xs font-medium ${strengthMeta[strength as 1 | 2 | 3 | 4]?.color}`}>
                    {strengthMeta[strength as 1 | 2 | 3 | 4]?.label}
                  </p>
                )}
              </div>
            )}
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Confirm password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                className={`h-11 pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
              />
              <button
                type="button"
                aria-label="Toggle confirm password visibility"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* ── Group 2: Stall information ───────────────────────────── */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Stall information</p>

          {/* Business name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Business / stall name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                {...register('businessName')}
                placeholder="e.g. Santos Fresh Produce"
                className={`pl-9 h-11 ${errors.businessName ? 'border-red-400' : ''}`}
              />
            </div>
            {errors.businessName && <p className="text-xs text-red-500">{errors.businessName.message}</p>}
          </div>

          {/* Owner name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Owner full name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                {...register('ownerName')}
                placeholder="e.g. Maria Santos"
                className={`pl-9 h-11 ${errors.ownerName ? 'border-red-400' : ''}`}
              />
            </div>
            {errors.ownerName && <p className="text-xs text-red-500">{errors.ownerName.message}</p>}
          </div>

          {/* Market selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Market location <span className="text-red-500">*</span>
            </label>
            <Select onValueChange={(val) => setValue('marketId', val, { shouldValidate: true })}>
              <SelectTrigger className={`h-11 ${errors.marketId ? 'border-red-400' : ''}`}>
                <div className="flex items-center gap-2 text-left">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <SelectValue placeholder="Select the market where your stall is located" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {markets.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.marketId && <p className="text-xs text-red-500">{errors.marketId.message}</p>}
          </div>

          {/* Stall number (optional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Stall number <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                {...register('stallNumber')}
                placeholder="e.g. A-12 or Stall 7"
                className="pl-9 h-11"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Group 3: Contact ────────────────────────────────────── */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Contact</p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Mobile number <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500">Buyers and the market admin will use this number to contact you.</p>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                {...register('contactNumber')}
                type="tel"
                placeholder="e.g. 09171234567"
                maxLength={11}
                className={`pl-9 h-11 ${errors.contactNumber ? 'border-red-400' : ''}`}
              />
            </div>
            {errors.contactNumber && (
              <p className="text-xs text-red-500">{errors.contactNumber.message}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Terms checkbox */}
        <div className="space-y-1.5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('agreeToTerms')}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer flex-shrink-0"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" className="text-green-600 underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-green-600 underline">Privacy Policy</Link>
              {' '}of the Butuan City Market Information System and confirm that all the information I provided is accurate.
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-xs text-red-500">{errors.agreeToTerms.message}</p>
          )}
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
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Create account
            </>
          )}
        </Button>
      </form>

      {/* Sign in link */}
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-green-600 font-semibold hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  )
}
