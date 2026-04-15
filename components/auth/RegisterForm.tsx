'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
   Loader2,
   Store,
   MapPin,
   ShoppingBag,
   User,
   Mail,
   Lock,
   CheckCircle2,
   Eye,
   EyeOff,
   ArrowRight,
   Phone,
   Building,
   ShieldCheck,
   ChevronLeft,
   AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const registerSchema = z
   .object({
      fullName: z.string().optional(),
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string().min(8, 'Confirm password is required'),
      businessName: z.string().optional(),
      ownerName: z.string().optional(),
      marketId: z.string().optional(),
      stallNumber: z.string().optional(),
      contactNumber: z.string().optional(),
   })
   .superRefine((data, ctx) => {
      if (data.password && data.confirmPassword) {
         if (data.password !== data.confirmPassword) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: 'Passwords do not match',
               path: ['confirmPassword'],
            })
         }
      }
   })

type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
   markets: any[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getOtpErrorMessage(error: any): string {
   const msg: string = error?.message ?? ''
   if (
      msg.toLowerCase().includes('expired') ||
      msg.toLowerCase().includes('otp_expired')
   ) {
      return 'Your verification code has expired. Click Resend Code to get a new one.'
   }
   if (
      msg.toLowerCase().includes('invalid') ||
      msg.toLowerCase().includes('otp_invalid') ||
      msg.toLowerCase().includes('token')
   ) {
      return 'Incorrect code. Please check your email and try again.'
   }
   return 'Verification failed. Please try again.'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RegisterForm({ markets }: RegisterFormProps) {
   const router = useRouter()
   const searchParams = useSearchParams()
   const initialRole = (
      searchParams.get('type') === 'vendor' ? 'vendor' : 'buyer'
   ) as 'buyer' | 'vendor'

   // ---- registration flow state ----
   const [selectedRole, setSelectedRole] = useState<'buyer' | 'vendor'>(initialRole)
   const [loading, setLoading] = useState(false)
   const [registrationStep, setRegistrationStep] = useState<'FORM' | 'VERIFY' | 'SUCCESS'>('FORM')
   const [formError, setFormError] = useState('')

   // ---- OTP state ----
   const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '', '', ''])
   const [otpError, setOtpError] = useState('')
   const otpRefs = useRef<(HTMLInputElement | null)[]>([])

   // ---- Resend state ----
   const [resendCooldown, setResendCooldown] = useState(0)
   const [resendLoading, setResendLoading] = useState(false)
   const [resendMessage, setResendMessage] = useState('')

   // ---- Pending profile data (inserted AFTER OTP verification) ----
   const [registrationEmail, setRegistrationEmail] = useState('')
   const [pendingProfileData, setPendingProfileData] = useState<Record<string, any>>({})

   // ---- UI state ----
   const [showPassword, setShowPassword] = useState(false)
   const [showConfirmPassword, setShowConfirmPassword] = useState(false)

   const supabase = createClient()

   const form = useForm<RegisterFormValues>({
      resolver: zodResolver(registerSchema),
      defaultValues: {
         fullName: '',
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

   // ---- Resend countdown ----
   useEffect(() => {
      if (resendCooldown <= 0) return
      const timer = setInterval(() => setResendCooldown((p) => p - 1), 1000)
      return () => clearInterval(timer)
   }, [resendCooldown])

   // ---- Role toggle resets form ----
   const handleRoleToggle = (role: 'buyer' | 'vendor') => {
      setSelectedRole(role)
      setFormError('')
      form.reset({
         fullName: '',
         email: '',
         password: '',
         confirmPassword: '',
         businessName: '',
         ownerName: '',
         marketId: '',
         stallNumber: '',
         contactNumber: '',
      })
   }



   // ---------------------------------------------------------------------------
   // SUBMIT: signUp → check identities → show OTP screen
   // ---------------------------------------------------------------------------
   const onSubmit = async (data: RegisterFormValues) => {
      setLoading(true)
      setFormError('')
      const email = data.email.trim().toLowerCase()

      try {


         // --- Step 2: call signUp with emailRedirectTo undefined so Supabase
         //     uses the OTP token in the email template rather than a magic link ---
         const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password: data.password,
            options: {
               emailRedirectTo: undefined,
               data:
                  selectedRole === 'buyer'
                     ? { role: 'buyer', full_name: data.fullName }
                     : { role: 'vendor', business_name: data.businessName },
            },
         })

         if (authError) throw authError

         // --- Step 3: check for duplicate via empty identities array ---
         if (
            authData?.user &&
            authData.user.identities &&
            authData.user.identities.length === 0
         ) {
            setFormError(
               'An account with this email already exists. Please sign in instead or use a different email address.'
            )
            setLoading(false)
            return
         }

         // --- Step 4: store pending profile data to insert AFTER OTP ---
         setRegistrationEmail(email)
         if (selectedRole === 'buyer') {
            setPendingProfileData({ full_name: data.fullName ?? '' })
         } else {
            setPendingProfileData({
               business_name: data.businessName ?? '',
               owner_name: data.ownerName ?? '',
               market_id: data.marketId ?? '',
               stall_number: data.stallNumber ?? '',
               contact_number: data.contactNumber ?? '',
               is_approved: false,
            })
         }

         // --- Step 5: show OTP screen ---
         setRegistrationStep('VERIFY')
         toast.success('Verification code sent — check your email inbox.')
      } catch (error: any) {
         console.error('[REGISTER]', error)
         setFormError(error.message || 'Registration failed. Please try again.')
      } finally {
         setLoading(false)
      }
   }

   // ---------------------------------------------------------------------------
   // OTP VERIFY: call verifyOtp with type 'signup', then insert profile
   // ---------------------------------------------------------------------------
   const handleVerifyOtp = async () => {
      const token = otpDigits.join('')
      if (token.length < 8) return

      setLoading(true)
      setOtpError('')

      try {
         const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            email: registrationEmail,
            token,
            type: 'signup',
         })

         if (verifyError) {
            setOtpError(getOtpErrorMessage(verifyError))
            setLoading(false)
            return
         }

         // --- Insert profile AFTER successful OTP verification ---
         const user = verifyData?.user
         if (!user) throw new Error('User not found after verification.')

         if (selectedRole === 'buyer') {
            const { error: profileError } = await supabase
               .from('buyer_profiles')
               .insert({ user_id: user.id, ...pendingProfileData })
            if (profileError) throw profileError
         } else {
            const { error: vendorError } = await supabase
               .from('vendors')
               .insert({ user_id: user.id, ...pendingProfileData })
            if (vendorError) throw vendorError
         }

         // Sign out to prevent auto-login; user will use /login
         await supabase.auth.signOut()
         setRegistrationStep('SUCCESS')
      } catch (error: any) {
         console.error('[VERIFY_OTP]', error)
         setOtpError(getOtpErrorMessage(error))
      } finally {
         setLoading(false)
      }
   }

   // ---------------------------------------------------------------------------
   // RESEND: use supabase.auth.resend with type 'signup'
   // ---------------------------------------------------------------------------
   const handleResendOtp = async () => {
      if (resendCooldown > 0 || resendLoading) return
      setResendLoading(true)
      setResendMessage('')

      const { error } = await supabase.auth.resend({
         type: 'signup',
         email: registrationEmail,
      })

      setResendLoading(false)
      if (!error) {
         setResendCooldown(60)
         setResendMessage('New code sent. Check your inbox.')
         toast.success('Verification code resent.')
      } else {
         toast.error('Failed to resend. Please wait and try again.')
      }
   }

   // ---------------------------------------------------------------------------
   // OTP input handlers
   // ---------------------------------------------------------------------------
   const handleOtpChange = (index: number, value: string) => {
      const char = value.slice(-1)
      if (char && !/^\d$/.test(char)) return

      const newDigits = [...otpDigits]
      newDigits[index] = char
      setOtpDigits(newDigits)
      setOtpError('')

      if (char && index < 7) {
         otpRefs.current[index + 1]?.focus()
      }
   }

   const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
         otpRefs.current[index - 1]?.focus()
      }
   }

   // ---------------------------------------------------------------------------
   // SUCCESS SCREEN
   // ---------------------------------------------------------------------------
   if (registrationStep === 'SUCCESS') {
      return (
         <div className="w-full max-w-2xl flex flex-col items-center text-center py-24 px-12 bg-white dark:bg-[#111111]/80 backdrop-blur-xl rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-2xl transition-all duration-700">
            <div className="w-28 h-28 bg-green-500/10 dark:bg-green-500/5 rounded-[3rem] flex items-center justify-center mb-12 border border-green-100 dark:border-green-500/10 shadow-sm">
               <CheckCircle2 className="w-12 h-12 text-green-700 dark:text-green-500" />
            </div>

            <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-none italic font-serif uppercase">
               {selectedRole === 'buyer' ? 'Account Created!' : 'Registration Sent'}
            </h2>
            <p className="text-[11px] font-black tracking-[0.3em] text-[#1b6b3e] dark:text-green-500 uppercase mb-4">
               Registration complete
            </p>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-base leading-relaxed mb-12 max-w-md">
               {selectedRole === 'buyer'
                  ? 'Your account is now ready. You can now start browsing the market and messaging vendors.'
                  : 'Your stall registration has been sent. Please wait for the admin to verify and approve your account.'}
            </p>

            <div className="w-full max-w-sm space-y-4">
               <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-14 rounded-3xl bg-green-700 hover:bg-green-800 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-green-700/30 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
               >
                  <span>Go to Login</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </Button>
            </div>
            <div className="mt-12 pt-10 border-t border-gray-100 dark:border-white/5 w-full">
               <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] leading-relaxed">
                  Your account is secure <br /> and protected.
               </p>
            </div>
         </div>
      )
   }

   // ---------------------------------------------------------------------------
   // OTP VERIFY SCREEN
   // ---------------------------------------------------------------------------
   if (registrationStep === 'VERIFY') {
      return (
         <div className="w-full max-w-3xl transition-all duration-700">
            <div className="bg-white dark:bg-[#0a0f0a] rounded-[4rem] border border-gray-100 dark:border-white/[0.03] shadow-2xl p-12 lg:p-20 text-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full -mr-32 -mt-32 blur-[80px]" />

               <button
                  type="button"
                  onClick={() => setRegistrationStep('FORM')}
                  className="absolute top-12 left-12 flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-green-700 uppercase tracking-widest transition-all group/back"
               >
                  <ChevronLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
                  Back
               </button>

               <div className="flex flex-col items-center mb-12">
                  <div className="w-20 h-20 rounded-3xl bg-green-50 dark:bg-green-500/5 flex items-center justify-center border border-green-100 dark:border-green-500/10 mb-8">
                     <ShieldCheck className="w-10 h-10 text-[#1b6b3e] dark:text-green-500" />
                  </div>
                  <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic font-serif uppercase mb-4">
                     Confirm <span className="text-[#1b6b3e] dark:text-green-500">Identity</span>
                  </h2>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] max-w-xs mx-auto mb-2">
                     An 8-digit verification code was sent to
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white underline decoration-green-500/30 mb-8">
                     {registrationEmail}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                     Check your inbox (and spam folder). The code expires in 10 minutes.
                  </p>
               </div>

               {/* OTP Inputs with accessibility: id, label, autocomplete */}
               <div
                  className="flex justify-center gap-2 mb-12 overflow-x-auto pb-4"
                  role="group"
                  aria-label="Enter the 8-digit verification code"
               >
                  {otpDigits.map((digit, i) => (
                     <div key={i} className="flex flex-col items-center">
                        <label htmlFor={`otp-${i}`} className="sr-only">
                           Digit {i + 1} of 8
                        </label>
                        <input
                           id={`otp-${i}`}
                           ref={(el) => { otpRefs.current[i] = el }}
                           type="text"
                           inputMode="numeric"
                           maxLength={1}
                           value={digit}
                           autoComplete={i === 0 ? 'one-time-code' : 'off'}
                           aria-label={`Digit ${i + 1} of 8`}
                           onChange={(e) => handleOtpChange(i, e.target.value)}
                           onKeyDown={(e) => handleOtpKeyDown(i, e)}
                           className={cn(
                              'w-9 h-14 md:w-11 md:h-16 text-xl md:text-2xl font-black text-center rounded-xl md:rounded-2xl bg-gray-50 dark:bg-white/[0.02] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-green-700/20 transition-all shadow-inner outline-none',
                              digit && 'ring-2 ring-green-500/20 bg-white dark:bg-white/[0.04]',
                              otpError && 'ring-2 ring-red-500/20'
                           )}
                        />
                     </div>
                  ))}
               </div>

               {/* OTP Error */}
               {otpError && (
                  <div className="mb-8 p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/10 flex items-center justify-center gap-3 animate-in fade-in">
                     <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                     <p className="text-[10px] font-black text-red-900 dark:text-red-400 uppercase tracking-widest">
                        {otpError}
                     </p>
                  </div>
               )}

               {/* Resend success message */}
               {resendMessage && !otpError && (
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-6 animate-in fade-in">
                     {resendMessage}
                  </p>
               )}

               <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otpDigits.some((d) => !d)}
                  className="w-full h-20 rounded-[2.5rem] bg-green-700 hover:bg-green-800 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group"
               >
                  {loading ? (
                     <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  ) : (
                     <div className="flex items-center justify-center gap-4">
                        <span>Verify Code</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                     </div>
                  )}
               </Button>

               <div className="mt-12 flex flex-col items-center gap-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[.2em]">
                     Didn&apos;t get the code?
                  </p>
                  <button
                     type="button"
                     onClick={handleResendOtp}
                     disabled={resendCooldown > 0 || resendLoading}
                     className={cn(
                        'text-[10px] font-black uppercase tracking-widest transition-all',
                        resendCooldown > 0 || resendLoading
                           ? 'text-gray-300 dark:text-gray-800 cursor-not-allowed'
                           : 'text-[#1b6b3e] dark:text-green-500 hover:underline hover:underline-offset-8'
                     )}
                  >
                     {resendLoading
                        ? 'Sending...'
                        : resendCooldown > 0
                        ? `Retry in ${resendCooldown}s`
                        : 'Resend Code'}
                  </button>
               </div>
            </div>
         </div>
      )
   }

   // ---------------------------------------------------------------------------
   // REGISTRATION FORM
   // ---------------------------------------------------------------------------
   return (
      <div className="w-full max-w-2xl transition-all duration-700">
         <div className="bg-white dark:bg-[#0a0f0a] rounded-[2.5rem] border border-gray-100 dark:border-white/[0.03] shadow-[0_32px_96px_-24px_rgba(0,0,0,0.1)] p-6 lg:p-10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 dark:bg-green-500/5 rounded-full -mr-48 -mt-48 blur-[100px] group-hover:bg-green-500/15 transition-all duration-1000" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-700/5 dark:bg-green-900/5 rounded-full -ml-48 -mb-48 blur-[100px]" />

            <div className="flex flex-col items-center mb-10 text-center">
               <div className="w-16 h-1 bg-[#1b6b3e] dark:bg-green-600 rounded-full mb-6 opacity-80" />
               <h2 className="text-3xl lg:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-none italic font-serif uppercase">
                  Create{' '}
                  <span className="text-[#1b6b3e] dark:text-green-500 underline decoration-green-100 dark:decoration-green-900/30 underline-offset-8">
                     Account
                  </span>
               </h2>
               <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em]">
                  Choose your account type
               </p>
            </div>

            {/* Role Toggle */}
            <div className="bg-gray-100/50 dark:bg-white/[0.03] rounded-[2rem] p-2 flex mb-10 shadow-inner border border-gray-100 dark:border-white/5 max-w-md mx-auto backdrop-blur-md">
               <button
                  type="button"
                  onClick={() => handleRoleToggle('buyer')}
                  className={cn(
                     'flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-700',
                     selectedRole === 'buyer'
                        ? 'bg-[#1b6b3e] text-white shadow-xl shadow-green-900/30'
                        : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white'
                  )}
               >
                  <ShoppingBag className={cn('w-4 h-4', selectedRole === 'buyer' ? 'scale-110' : 'opacity-40')} />
                  Buyer
               </button>
               <button
                  type="button"
                  onClick={() => handleRoleToggle('vendor')}
                  className={cn(
                     'flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-700',
                     selectedRole === 'vendor'
                        ? 'bg-[#1b6b3e] text-white shadow-xl shadow-green-900/30'
                        : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white'
                  )}
               >
                  <Store className={cn('w-4 h-4', selectedRole === 'vendor' ? 'scale-110' : 'opacity-40')} />
                  Vendor
               </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10" noValidate>
               {/* ---- BUYER FIELDS ---- */}
               {selectedRole === 'buyer' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                     <div className="space-y-2">
                        <label
                           htmlFor="reg-full-name"
                           className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4"
                        >
                           Full Name
                        </label>
                        <div className="relative group">
                           <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              id="reg-full-name"
                              {...form.register('fullName')}
                              required
                              autoComplete="name"
                              placeholder="Juan Dela Cruz"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label
                           htmlFor="reg-email-buyer"
                           className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block ml-4"
                        >
                           Email Address
                        </label>
                        <div className="relative group">
                           <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              id="reg-email-buyer"
                              {...form.register('email')}
                              required
                              type="email"
                              autoComplete="email"
                              placeholder="juan@example.com"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           />
                        </div>
                        {form.formState.errors.email && (
                           <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-1 ml-4">
                              {form.formState.errors.email.message}
                           </p>
                        )}
                     </div>
                  </div>
               ) : (
                  /* ---- VENDOR FIELDS ---- */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                     <div className="space-y-2">
                        <label
                           htmlFor="reg-business-name"
                           className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4"
                        >
                           Store Name
                        </label>
                        <div className="relative group">
                           <Building className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              id="reg-business-name"
                              {...form.register('businessName')}
                              required
                              autoComplete="organization"
                              placeholder="e.g. Juan's Variety Store"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label
                           htmlFor="reg-market-id"
                           className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4"
                        >
                           Market Location
                        </label>
                        <Select
                           onValueChange={(v) => form.setValue('marketId', v)}
                        >
                           <SelectTrigger
                              id="reg-market-id"
                              className="h-12 px-8 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus:ring-2 focus:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm"
                           >
                              <SelectValue placeholder="Select Market" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-gray-100 dark:border-white/10 shadow-3xl bg-white dark:bg-[#111111] p-2 overflow-hidden">
                              {markets.map((m) => (
                                 <SelectItem
                                    key={m.id}
                                    value={m.id}
                                    className="rounded-xl text-gray-900 dark:text-white font-bold h-10 uppercase text-[9px] tracking-widest focus:bg-green-50 dark:focus:bg-green-900/20 cursor-pointer"
                                 >
                                    {m.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <label
                           htmlFor="reg-owner-name"
                           className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4"
                        >
                           Owner Name
                        </label>
                        <div className="relative group">
                           <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              id="reg-owner-name"
                              {...form.register('ownerName')}
                              required
                              autoComplete="name"
                              placeholder="Juan Dela Cruz"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label
                           htmlFor="reg-stall-number"
                           className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4"
                        >
                           Stall Number
                        </label>
                        <div className="relative group">
                           <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              id="reg-stall-number"
                              {...form.register('stallNumber')}
                              required
                              autoComplete="off"
                              placeholder="e.g. 101-B"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label
                           htmlFor="reg-email-vendor"
                           className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4"
                        >
                           Email Address
                        </label>
                        <div className="relative group">
                           <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              id="reg-email-vendor"
                              {...form.register('email')}
                              required
                              type="email"
                              autoComplete="email"
                              placeholder="vendor@example.com"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           />
                        </div>
                        {form.formState.errors.email && (
                           <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-1 ml-4">
                              {form.formState.errors.email.message}
                           </p>
                        )}
                     </div>
                     <div className="space-y-2">
                        <label
                           htmlFor="reg-contact-number"
                           className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4"
                        >
                           Phone Number
                        </label>
                        <div className="relative group">
                           <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              id="reg-contact-number"
                              {...form.register('contactNumber')}
                              required
                              autoComplete="tel"
                              placeholder="09123456789"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           />
                        </div>
                     </div>
                  </div>
               )}

               {/* Password fields — shared */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-2">
                     <label
                        htmlFor="reg-password"
                        className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4"
                     >
                        Password
                     </label>
                     <div className="relative group">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                        <Input
                           id="reg-password"
                           {...form.register('password')}
                           required
                           type={showPassword ? 'text' : 'password'}
                           autoComplete="new-password"
                           placeholder="••••••••••••"
                           className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                        />
                        <button
                           type="button"
                           aria-label={showPassword ? 'Hide password' : 'Show password'}
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-green-700 transition-colors"
                        >
                           {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                     </div>
                     {form.formState.errors.password && (
                        <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-1 ml-4">
                           {form.formState.errors.password.message}
                        </p>
                     )}
                  </div>
                  <div className="space-y-2">
                     <label
                        htmlFor="reg-confirm-password"
                        className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4"
                     >
                        Confirm Password
                     </label>
                     <div className="relative group">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                        <Input
                           id="reg-confirm-password"
                           {...form.register('confirmPassword')}
                           required
                           type={showConfirmPassword ? 'text' : 'password'}
                           autoComplete="new-password"
                           placeholder="••••••••••••"
                           className={cn(
                              'h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600',
                              form.formState.errors.confirmPassword && 'ring-2 ring-red-500/50'
                           )}
                        />
                        <button
                           type="button"
                           aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                           className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-green-700 transition-colors"
                        >
                           {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                     </div>
                     {form.formState.errors.confirmPassword && (
                        <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-1 ml-4 animate-in fade-in slide-in-from-top-1">
                           {form.formState.errors.confirmPassword.message}
                        </p>
                     )}
                  </div>
               </div>

               {/* Form-level error (duplicate email, etc.) */}
               {formError && (
                  <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl p-4 animate-in fade-in slide-in-from-top-2">
                     <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                     <p className="text-[11px] font-bold text-red-700 dark:text-red-400 leading-relaxed">
                        {formError}
                     </p>
                  </div>
               )}

               <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-xl bg-green-700 hover:bg-green-800 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-700/20 transition-all active:scale-[0.98] group"
               >
                  {loading ? (
                     <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                     <div className="flex items-center justify-center gap-3">
                        <span>{selectedRole === 'vendor' ? 'Register My Store' : 'Create Account'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </div>
                  )}
               </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 text-center">
               <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[.15em] hover:text-green-700 dark:hover:text-white transition-all duration-300 group"
               >
                  Already have an account?{' '}
                  <span className="text-green-700 dark:text-green-500 ml-2 group-hover:underline">
                     Sign in here
                  </span>
               </button>
            </div>
         </div>
      </div>
   )
}
