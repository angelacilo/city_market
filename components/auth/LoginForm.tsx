'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
   Loader2,
   Mail,
   Lock,
   Eye,
   EyeOff,
   ArrowRight,
   ShoppingBag,
   Store,
   ShieldCheck,
   AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function LoginForm() {
   const router = useRouter()
   const searchParams = useSearchParams()
   const redirectPath = searchParams.get('redirect')

   const [selectedRole, setSelectedRole] = useState<'buyer' | 'vendor'>('buyer')
   const [loading, setLoading] = useState(false)
   const [showPassword, setShowPassword] = useState(false)
   const [error, setError] = useState<string | null>(null)

   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')

   const supabase = createClient()

   const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      try {
         const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
         })

         if (authError) throw authError

         if (data.user) {
            // Check for redirect param first
            if (redirectPath && redirectPath.startsWith('/')) {
               router.push(redirectPath)
               return
            }

            // Sequential Role Check

            // 1. Check Admin
            const { data: profile } = await supabase
               .from('profiles')
               .select('role')
               .eq('id', data.user.id)
               .single()

            if (profile && profile.role === 'admin') {
               router.push('/admin/dashboard')
               return
            }

            // 2. Check Vendor
            const { data: vendor } = await supabase
               .from('vendors')
               .select('id, is_approved')
               .eq('user_id', data.user.id)
               .single()

            if (vendor) {
               if (vendor.is_approved) {
                  router.push('/vendor/dashboard')
               } else {
                  setError('Account pending approval. Please wait for the market administrator to verify your stall.')
                  await supabase.auth.signOut()
               }
               return
            }

            // 3. Check Buyer
            const { data: buyer } = await supabase
               .from('buyer_profiles')
               .select('id')
               .eq('user_id', data.user.id)
               .single()

            if (buyer) {
               router.push('/')
               return
            }

            // Fallback
            await supabase.auth.signOut()
            setError('Account type could not be determined. Please contact support.')
         }
      } catch (error: any) {
         console.error(error)
         setError(error.message || 'Login failed. Please check your credentials.')
      } finally {
         setLoading(false)
      }
   }

   return (
      <div className="w-full max-w-2xl transition-all duration-700">
         <div className="bg-white dark:bg-[#0a0f0a] rounded-[3rem] border border-gray-100 dark:border-white/[0.03] shadow-[0_32px_96px_-24px_rgba(0,0,0,0.1)] p-8 lg:p-16 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 dark:bg-green-500/5 rounded-full -mr-48 -mt-48 blur-[100px] group-hover:bg-green-500/15 transition-all duration-1000" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-700/5 dark:bg-green-900/5 rounded-full -ml-48 -mb-48 blur-[100px]" />


            <div className="flex flex-col items-center mb-10 text-center">
               <div className="w-16 h-1 bg-green-700 rounded-full mb-8 opacity-80" />
               <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter leading-none italic font-serif">Sign <span className="text-green-700 dark:text-green-500 underline decoration-green-100 dark:decoration-green-900/30 underline-offset-8">In</span></h2>
               <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] px-6">
                  Log in to your account
               </p>
            </div>


            {/* Pill Toggle */}
            <div className="bg-gray-100/50 dark:bg-white/[0.03] rounded-[2rem] p-2 flex mb-10 shadow-inner border border-gray-100 dark:border-white/5 max-w-md mx-auto backdrop-blur-md relative z-10">
               <button
                  type="button"
                  onClick={() => setSelectedRole('buyer')}
                  className={`flex-1 h-14 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-700 ${selectedRole === 'buyer' ? 'bg-[#1b6b3e] text-white shadow-xl shadow-green-900/30 scale-[1.02]' : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white'
                     }`}
               >
                  <ShoppingBag className={`w-4 h-4 ${selectedRole === 'buyer' ? 'scale-110' : 'opacity-40'}`} />
                  Buyer
               </button>
               <button
                  type="button"
                  onClick={() => setSelectedRole('vendor')}
                  className={`flex-1 h-14 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-700 ${selectedRole === 'vendor' ? 'bg-[#1b6b3e] text-white shadow-xl shadow-green-900/30 scale-[1.02]' : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white'
                     }`}
               >
                  <Store className={`w-4 h-4 ${selectedRole === 'vendor' ? 'scale-110' : 'opacity-40'}`} />
                  Vendor
               </button>
            </div>

            <div className="mb-8 text-center px-4">
               <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed opacity-80">
                  {selectedRole === 'buyer'
                     ? 'Find the best deals in Butuan.'
                     : 'Manage your store and orders.'}
               </p>
            </div>


            {error && (
               <div className="mb-10 p-6 bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900/20 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-black text-red-900 dark:text-red-200 leading-relaxed uppercase tracking-widest">{error}</p>
               </div>
            )}

            <form onSubmit={handleLogin} className="space-y-8">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block ml-4">Email Address</label>
                     <div className="relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                        <Input
                           required
                           type="email"
                           placeholder="your@email.com"
                           className="h-14 pl-14 pr-6 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm tracking-tight placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           value={email}
                           onChange={e => setEmail(e.target.value)}
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between items-center px-4 mb-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em] block">Password</label>
                        <button 
                           type="button" 
                           onClick={() => router.push('/forgot-password')}
                           className="text-[10px] font-black text-green-700 dark:text-green-500 uppercase tracking-widest hover:underline hover:underline-offset-4 transition-all"
                        >
                           Forgot?
                        </button>
                     </div>
                     <div className="relative group">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                        <Input
                           required
                           type={showPassword ? 'text' : 'password'}
                           placeholder="••••••••••••"
                           className="h-14 pl-14 pr-14 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm tracking-tight placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           value={password}
                           onChange={e => setPassword(e.target.value)}
                        />
                        <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-green-700 dark:hover:text-green-500 transition-colors"
                        >
                           {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                     </div>
                  </div>

               </div>

               <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-700/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
               >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                     <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </>
                  )}
               </Button>
            </form>

            <div className="mt-8 mb-2 pt-8 border-t border-gray-100 dark:border-white/5 text-center">
               <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[.15em] hover:text-green-700 dark:hover:text-white transition-all duration-300 group"
               >
                  Don't have an account? <span className="text-green-700 dark:text-green-500 ml-2 group-hover:underline">Create one here</span>
               </button>
            </div>
         </div>

         <div className="mt-10 flex items-center justify-center gap-10 opacity-30">
            <ShieldCheck className="w-5 h-5 text-gray-400 dark:text-gray-600" />
         <div className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 dark:text-gray-600">Protected by Secure Encryption</div>
         </div>
      </div>
   )
}
