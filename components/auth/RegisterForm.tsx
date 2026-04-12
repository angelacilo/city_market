'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
   AlertCircle
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

interface RegisterFormProps {
   markets: any[]
}

export default function RegisterForm({ markets }: RegisterFormProps) {
   const router = useRouter()
   const searchParams = useSearchParams()
   const initialRole = (searchParams.get('type') === 'vendor' ? 'vendor' : 'buyer') as 'buyer' | 'vendor'

   const [selectedRole, setSelectedRole] = useState<'buyer' | 'vendor'>(initialRole)
   const [loading, setLoading] = useState(false)
   const [registrationStep, setRegistrationStep] = useState<'FORM' | 'VERIFY' | 'SUCCESS'>('FORM')
   const [otpError, setOtpError] = useState('')
   const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '', '', '']) // 8-digit code
   const [resendCooldown, setResendCooldown] = useState(0)
   const [resendLoading, setResendLoading] = useState(false)
   const otpRefs = useRef<(HTMLInputElement | null)[]>([])

   // Buyer state
   const [buyerData, setBuyerData] = useState({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
   })

   // Vendor state
   const [vendorData, setVendorData] = useState({
      email: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      ownerName: '',
      marketId: '',
      stallNumber: '',
      contactNumber: '',
   })

   const [showPassword, setShowPassword] = useState(false)
   const [showConfirmPassword, setShowConfirmPassword] = useState(false)

   const supabase = createClient()

   const handleBuyerSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (buyerData.password !== buyerData.confirmPassword) {
         toast.error('Passwords do not match')
         return
      }
      setLoading(true)

      try {
         // 1. Sign Up (triggers confirmation email code if configured)
         const { data: authData, error: authError } = await supabase.auth.signUp({
            email: buyerData.email,
            password: buyerData.password,
            options: {
               data: { full_name: buyerData.fullName }
            }
         })

         if (authError) throw authError

         setRegistrationStep('VERIFY')
         toast.success('Verification code dispatched to your email')
      } catch (error: any) {
         console.error(error)
         toast.error(error.message || 'Registration failed')
      } finally {
         setLoading(false)
      }
   }

   const handleVendorSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (vendorData.password !== vendorData.confirmPassword) {
         toast.error('Passwords do not match')
         return
      }
      setLoading(true)

      try {
         // 1. Sign Up
         const { data: authData, error: authError } = await supabase.auth.signUp({
            email: vendorData.email,
            password: vendorData.password,
            options: {
               data: { role: 'vendor', full_name: vendorData.ownerName }
            }
         })

         if (authError) throw authError

         setRegistrationStep('VERIFY')
         toast.success('Verification code dispatched to your email')
      } catch (error: any) {
         console.error(error)
         toast.error(error.message || 'Registration failed')
      } finally {
         setLoading(false)
      }
   }

   const handleVerifyOtp = async () => {
      const token = otpDigits.join('')
      if (token.length < 8) return
      
      setLoading(true)
      setOtpError('')

      try {
         const { error: verifyError } = await supabase.auth.verifyOtp({
            email: selectedRole === 'buyer' ? buyerData.email : vendorData.email,
            token,
            type: 'signup'
         })

         if (verifyError) throw verifyError

         // 2. Insert profile data now that user is confirmed
         const { data: { user } } = await supabase.auth.getUser()
         
         if (user) {
            if (selectedRole === 'buyer') {
               const { error: profileError } = await supabase
                  .from('buyer_profiles')
                  .insert({
                     user_id: user.id,
                     full_name: buyerData.fullName
                  })
               if (profileError) throw profileError
            } else {
               const { error: vendorError } = await supabase
                  .from('vendors')
                  .insert({
                     user_id: user.id,
                     business_name: vendorData.businessName,
                     owner_name: vendorData.ownerName,
                     market_id: vendorData.marketId,
                     stall_number: vendorData.stallNumber,
                     contact_number: vendorData.contactNumber,
                     is_approved: false
                  })
               if (vendorError) throw vendorError
            }
         }

         // 3. Finalize and sign out
         await supabase.auth.signOut()
         setRegistrationStep('SUCCESS')
      } catch (error: any) {
         console.error(error)
         setOtpError(error.message || 'Verification failed')
         toast.error('Invalid Verification Code')
      } finally {
         setLoading(false)
      }
   }

   const handleResendOtp = async () => {
      if (resendCooldown > 0 || resendLoading) return
      setResendLoading(true)
      
      try {
         const { error } = await supabase.auth.resend({
            type: 'signup',
            email: selectedRole === 'buyer' ? buyerData.email : vendorData.email
         })
         if (error) throw error
         
         setResendCooldown(60)
         toast.success('Verification sequence re-transmitted')
      } catch (error: any) {
         toast.error(error.message || 'Resend failed')
      } finally {
         setResendLoading(false)
      }
   }

   // Cooldown timer
   useEffect(() => {
      if (resendCooldown <= 0) return
      const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000)
      return () => clearInterval(timer)
   }, [resendCooldown])

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

   if (registrationStep === 'SUCCESS') {
      return (
         <div className="w-full max-w-2xl flex flex-col items-center text-center py-24 px-12 bg-white dark:bg-[#111111]/80 backdrop-blur-xl rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-2xl animate-in zoom-in duration-700">
            <div className="w-28 h-28 bg-green-500/10 dark:bg-green-500/5 rounded-[3rem] flex items-center justify-center mb-12 border border-green-100 dark:border-green-500/10 shadow-sm">
               <CheckCircle2 className="w-12 h-12 text-green-700 dark:text-green-500" />
            </div>

            <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-none italic font-serif uppercase">
               {selectedRole === 'buyer' ? 'Account Created!' : 'Registration Sent'}
            </h2>
            <p className="text-[11px] font-black tracking-[0.3em] text-[#1b6b3e] dark:text-green-500 uppercase mb-4">Registration complete</p>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-base leading-relaxed mb-12 max-w-md">
               {selectedRole === 'buyer'
                  ? 'Your account is now ready. You can now start browsing the market and messaging vendors.'
                  : 'Your stall registration has been sent. Please wait for the admin to verify and approve your account.'}
            </p>

            <div className="w-full max-w-sm space-y-4">
               <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-18 rounded-3xl bg-green-700 hover:bg-green-800 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-green-700/30 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
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

   if (registrationStep === 'VERIFY') {
      const currentEmail = selectedRole === 'buyer' ? buyerData.email : vendorData.email
      return (
         <div className="w-full max-w-3xl animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white dark:bg-[#0a0f0a] rounded-[4rem] border border-gray-100 dark:border-white/[0.03] shadow-2xl p-12 lg:p-20 text-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full -mr-32 -mt-32 blur-[80px]" />
               
               <button
                  type="button"
                  onClick={() => setRegistrationStep('FORM')}
                  className="absolute top-12 left-12 flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-green-700 uppercase tracking-widest transition-all group/back"
               >
                  <ChevronLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
                   Exit Registration
               </button>

               <div className="flex flex-col items-center mb-12">
                  <div className="w-20 h-20 rounded-3xl bg-green-50 dark:bg-green-500/5 flex items-center justify-center border border-green-100 dark:border-green-500/10 mb-8">
                     <ShieldCheck className="w-10 h-10 text-[#1b6b3e] dark:text-green-500" />
                  </div>
                  <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic font-serif uppercase mb-4">Confirm <span className="text-[#1b6b3e] dark:text-green-500">Identity</span></h2>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] max-w-xs mx-auto mb-8">
                     A confirmation code has been dispatched to <span className="text-gray-900 dark:text-white underline decoration-green-500/30">{currentEmail}</span>
                  </p>
               </div>

               <div className="flex justify-center gap-2 mb-12 overflow-x-auto pb-4">
                  {otpDigits.map((digit, i) => (
                     <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className={cn(
                           "w-9 h-14 md:w-11 md:h-16 text-xl md:text-2xl font-black text-center rounded-xl md:rounded-2xl bg-gray-50 dark:bg-white/[0.02] border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-green-700/20 transition-all shadow-inner",
                           digit && "ring-2 ring-green-500/10 bg-white dark:bg-white/[0.04]",
                           otpError && "ring-2 ring-red-500/20"
                        )}
                     />
                  ))}
               </div>

               {otpError && (
                  <div className="mb-10 p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/10 flex items-center justify-center gap-3 animate-shake">
                     <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                     <p className="text-[10px] font-black text-red-900 dark:text-red-400 uppercase tracking-widest">{otpError}</p>
                  </div>
               )}

               <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otpDigits.some(d => !d)}
                  className="w-full h-20 rounded-[2.5rem] bg-green-700 hover:bg-green-800 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group"
               >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                     <div className="flex items-center justify-center gap-4">
                         <span>Verify Code</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                     </div>
                  )}
               </Button>

               <div className="mt-12 flex flex-col items-center gap-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[.2em]">Didn't get the code?</p>
                  <button
                     type="button"
                     onClick={handleResendOtp}
                     disabled={resendCooldown > 0 || resendLoading}
                     className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-all",
                        resendCooldown > 0 
                           ? "text-gray-300 dark:text-gray-800"
                           : "text-[#1b6b3e] dark:text-green-500 hover:underline hover:underline-offset-8"
                     )}
                  >
                     {resendLoading ? "Sending..." : resendCooldown > 0 ? `Retry in ${resendCooldown}s` : "Resend Code"}
                  </button>
               </div>
            </div>
         </div>
      )
   }

   return (
      <div className="w-full max-w-2xl transition-all duration-700">
         <div className="bg-white dark:bg-[#0a0f0a] rounded-[2.5rem] border border-gray-100 dark:border-white/[0.03] shadow-[0_32px_96px_-24px_rgba(0,0,0,0.1)] p-6 lg:p-10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 dark:bg-green-500/5 rounded-full -mr-48 -mt-48 blur-[100px] group-hover:bg-green-500/15 transition-all duration-1000" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-700/5 dark:bg-green-900/5 rounded-full -ml-48 -mb-48 blur-[100px]" />

            <div className="flex flex-col items-center mb-10 text-center">
               <div className="w-16 h-1 bg-[#1b6b3e] dark:bg-green-600 rounded-full mb-6 opacity-80" />
            <h2 className="text-3xl lg:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-none italic font-serif uppercase">Create <span className="text-[#1b6b3e] dark:text-green-500 underline decoration-green-100 dark:decoration-green-900/30 underline-offset-8">Account</span></h2>
               <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em]">Choose your account type</p>
            </div>

            {/* Pill Toggle */}
            <div className="bg-gray-100/50 dark:bg-white/[0.03] rounded-[2rem] p-2 flex mb-10 shadow-inner border border-gray-100 dark:border-white/5 max-w-md mx-auto backdrop-blur-md">
               <button
                  type="button"
                  onClick={() => setSelectedRole('buyer')}
                  className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-700 ${selectedRole === 'buyer' ? 'bg-[#1b6b3e] text-white shadow-xl shadow-green-900/30' : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white'
                     }`}
               >
                  <ShoppingBag className={`w-4 h-4 ${selectedRole === 'buyer' ? 'scale-110' : 'opacity-40'}`} />
                  Buyer
               </button>
               <button
                  type="button"
                  onClick={() => setSelectedRole('vendor')}
                  className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-700 ${selectedRole === 'vendor' ? 'bg-[#1b6b3e] text-white shadow-xl shadow-green-900/30' : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white'
                     }`}
               >
                  <Store className={`w-4 h-4 ${selectedRole === 'vendor' ? 'scale-110' : 'opacity-40'}`} />
                  Vendor
               </button>
            </div>

            {selectedRole === 'buyer' ? (
               /* BUYER FORM */
               <form onSubmit={handleBuyerSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">Full Name</label>
                        <div className="relative group">
                           <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              required
                              placeholder="Juan Dela Cruz"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                              value={buyerData.fullName}
                              onChange={e => setBuyerData(prev => ({ ...prev, fullName: e.target.value }))}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block ml-4">Email Address</label>
                        <div className="relative group">
                           <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              required
                              type="email"
                              placeholder="juan@example.com"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                              value={buyerData.email}
                              onChange={e => setBuyerData(prev => ({ ...prev, email: e.target.value }))}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">Password</label>
                        <div className="relative group">
                           <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              required
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••••••"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                              value={buyerData.password}
                              onChange={e => setBuyerData(prev => ({ ...prev, password: e.target.value }))}
                           />
                           <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-green-700 transition-colors"
                           >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                           </button>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">Confirm Password</label>
                        <div className="relative group">
                           <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              required
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••••••"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                              value={buyerData.confirmPassword}
                              onChange={e => setBuyerData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                           />
                           <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-green-700 transition-colors"
                           >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                           </button>
                        </div>
                     </div>
                  </div>

                  <Button
                     type="submit"
                     disabled={loading}
                     className="w-full h-14 rounded-xl bg-green-700 hover:bg-green-800 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-700/20 transition-all active:scale-[0.98] group"
                  >
                     {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                        <div className="flex items-center justify-center gap-3">
                           <span>Create Account</span>
                           <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                     )}
                  </Button>
               </form>
            ) : (
               /* VENDOR FORM */
               <form onSubmit={handleVendorSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">Store Name</label>
                        <div className="relative group">
                           <Building className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              required
                              placeholder="e.g. Juan's Variety Store"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                              value={vendorData.businessName}
                              onChange={e => setVendorData(prev => ({ ...prev, businessName: e.target.value }))}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">Market Location</label>
                        <Select
                           onValueChange={v => setVendorData(prev => ({ ...prev, marketId: v }))}
                           required
                        >
                           <SelectTrigger className="h-12 px-8 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus:ring-2 focus:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm">
                              <SelectValue placeholder="Select Market" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-gray-100 dark:border-white/10 shadow-3xl bg-white dark:bg-[#111111] p-2 overflow-hidden">
                              {markets.map(m => (
                                 <SelectItem key={m.id} value={m.id} className="rounded-xl text-gray-900 dark:text-white font-bold h-10 uppercase text-[9px] tracking-widest focus:bg-green-50 dark:focus:bg-green-900/20 cursor-pointer">{m.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">Owner Name</label>
                        <div className="relative group">
                           <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              required
                              placeholder="Juan Dela Cruz"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                              value={vendorData.ownerName}
                              onChange={e => setVendorData(prev => ({ ...prev, ownerName: e.target.value }))}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">Stall Number</label>
                        <div className="relative group">
                           <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              required
                              placeholder="e.g. 101-B"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                              value={vendorData.stallNumber}
                              onChange={e => setVendorData(prev => ({ ...prev, stallNumber: e.target.value }))}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">Email Address</label>
                        <div className="relative group">
                           <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              required
                              type="email"
                              placeholder="vendor@example.com"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                              value={vendorData.email}
                              onChange={e => setVendorData(prev => ({ ...prev, email: e.target.value }))}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">Password</label>
                        <div className="relative group">
                           <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                           <Input
                              required
                              type="password"
                              placeholder="••••••••••••"
                              className="h-12 pl-14 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600"
                              value={vendorData.password}
                              onChange={e => setVendorData(prev => ({ ...prev, password: e.target.value }))}
                           />
                        </div>
                     </div>
                  </div>

                  <Button
                     type="submit"
                     disabled={loading}
                     className="w-full h-14 rounded-xl bg-green-700 hover:bg-green-800 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-700/20 transition-all active:scale-[0.98] group"
                  >
                     {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                        <div className="flex items-center justify-center gap-3">
                           <span>Register My Store</span>
                           <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                     )}
                  </Button>
               </form>
            )}

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 text-center">
               <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[.15em] hover:text-green-700 dark:hover:text-white transition-all duration-300 group"
               >
                  Already have an account? <span className="text-green-700 dark:text-green-500 ml-2 group-hover:underline">Sign in here</span>
               </button>
            </div>
         </div>
      </div>
   )
}
