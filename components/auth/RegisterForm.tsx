'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Eye, EyeOff, UserPlus, Loader2, AlertCircle,
  Building2, User, MapPin, DoorOpen, Phone, Info, Mail, Lock
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

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

function mapSupabaseError(errorMsg: string): string {
  const msg = errorMsg.toLowerCase()
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit') || msg.includes('429')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  return 'Something went wrong. Please try again in a moment.'
}

interface Props {
  markets: { id: string; name: string }[]
}

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
      email: '', password: '', confirmPassword: '',
      businessName: '', ownerName: '', marketId: '',
      stallNumber: '', contactNumber: '', agreeToTerms: false
    },
  })

  async function onSubmit(data: RegisterFormValues) {
    const now = Date.now()
    if (now - lastSubmitTime.current < 10000) return
    lastSubmitTime.current = now

    setSubmitting(true)
    setAuthError('')
    const supabase = createClient()

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.ownerName } },
    })

    if (signUpError) {
      setSubmitting(false)
      setAuthError(mapSupabaseError(signUpError.message))
      return
    }

    if (!authData.user) {
      setSubmitting(false)
      setAuthError('Something went wrong. Please try again.')
      return
    }

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
      setAuthError('Account created but stall details failed to save.')
      return
    }

    router.push('/vendor/dashboard')
    router.refresh()
  }

  return (
    <div className="space-y-10 max-h-[80vh] overflow-y-auto no-scrollbar pr-2">
      {/* Header */}
      <div>
        <span className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em] block mb-3">Get Started</span>
        <h1 className="text-4xl font-black italic text-gray-900 font-serif leading-tight">
            Register Stall
        </h1>
        <p className="text-sm text-gray-400 mt-2 font-medium">Join the BCMIS vendor community today.</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-4 bg-[#f0f7f0] border border-green-100/50 rounded-2xl px-6 py-4 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-green-700" />
        </div>
        <p className="text-[11px] text-green-800 font-bold leading-relaxed">
            Stall verification typically takes 24 hours. Once registered, you can immediately begin listing products for your public stall.
        </p>
      </div>

      {/* Error alert */}
      {authError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-red-600">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-4">
        
        {/* Account Details */}
        <div className="space-y-5">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Security Credentials</p>
           
           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
             <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <Input
                    {...register('email')}
                    className={cn(
                        "rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-14 pl-12 font-bold text-sm",
                        errors.email && "border-red-300"
                    )}
                />
             </div>
             {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <Input
                            {...register('password')}
                            type={showPassword ? 'text' : 'password'}
                            className={cn(
                                "rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-14 pl-12 pr-12 font-bold text-sm font-mono tracking-widest",
                                errors.password && "border-red-300"
                            )}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-green-700">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Confirm</label>
                    <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <Input
                            {...register('confirmPassword')}
                            type={showConfirmPassword ? 'text' : 'password'}
                            className={cn(
                                "rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-14 pl-12 pr-12 font-bold text-sm font-mono tracking-widest",
                                errors.confirmPassword && "border-red-300"
                            )}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-green-700">
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
           </div>
           {errors.password && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>}
           {!errors.password && errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.confirmPassword.message}</p>}
        </div>

        {/* Stall Details */}
        <div className="space-y-5 pt-4">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Stall information</p>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Business Name</label>
              <div className="relative">
                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <Input
                    {...register('businessName')}
                    placeholder="Santos Fresh Produce"
                    className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-14 pl-12 font-bold text-sm"
                />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Owner Full Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <Input
                    {...register('ownerName')}
                    className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-14 pl-12 font-bold text-sm"
                />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Market Location</label>
                    <Select onValueChange={(v) => setValue('marketId', v, { shouldValidate: true })}>
                        <SelectTrigger className="rounded-2xl border-gray-100 bg-gray-50/50 h-14 pl-5 pr-5 font-bold text-sm">
                             <SelectValue placeholder="Select Market" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl p-2 border-gray-100 shadow-xl">
                            {markets.map(m => <SelectItem key={m.id} value={m.id} className="rounded-xl font-bold py-3">{m.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Stall ID (Optional)</label>
                    <Input
                        {...register('stallNumber')}
                        className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-14 px-5 font-bold text-sm"
                    />
                </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <Input
                    {...register('contactNumber')}
                    placeholder="09XXXXXXXXX"
                    className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-14 pl-12 font-bold text-sm font-mono tracking-widest"
                />
              </div>
           </div>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-4 cursor-pointer p-4 bg-gray-50/50 rounded-2xl border border-dotted border-gray-200">
           <input type="checkbox" {...register('agreeToTerms')} className="w-5 h-5 rounded-lg border-gray-300 text-green-700 mt-0.5" />
           <span className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-tighter">
                I agree to the <span className="text-green-700 underline">Merchant Terms of Service</span> & <span className="text-green-700 underline">Privacy Policy</span>. I confirm all provided data is accurate.
           </span>
        </label>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-14 rounded-full bg-green-700 hover:bg-green-800 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-green-700/20 gap-3"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : (
            <><UserPlus className="w-4 h-4" /> Create Merchant Account</>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="pt-6 border-t border-gray-50 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Already registered?{' '}
            <Link href="/login" className="text-green-700 hover:underline ml-1">
                 Sign In To Portal
            </Link>
        </p>
      </div>
    </div>
  )
}
