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
      <div className="w-full max-w-4xl transition-all duration-700">
         <div className="bg-white dark:bg-[#0a0f0a] rounded-[4rem] border border-gray-100 dark:border-white/[0.03] shadow-[0_48px_128px_-32px_rgba(0,0,0,0.12)] p-12 lg:p-24 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 dark:bg-green-500/5 rounded-full -mr-48 -mt-48 blur-[100px] group-hover:bg-green-500/15 transition-all duration-1000" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-700/5 dark:bg-green-900/5 rounded-full -ml-48 -mb-48 blur-[100px]" />


            <div className="flex flex-col items-center mb-16 text-center">
               <div className="w-20 h-1.5 bg-green-700 rounded-full mb-12 opacity-80" />
               <h2 className="text-5xl lg:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-none italic font-serif">Sign <span className="text-green-700 dark:text-green-500 underline decoration-green-100 dark:decoration-green-900/30 underline-offset-8">In</span></h2>
               <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] mt-2 px-6 leading-relaxed">
                  Authentication Protocol Required
               </p>
            </div>


            {/* Pill Toggle */}
            <div className="bg-gray-100/50 dark:bg-white/[0.03] rounded-[3rem] p-3 flex mb-16 shadow-inner border border-gray-100 dark:border-white/5 max-w-xl mx-auto backdrop-blur-md relative z-10">
               <button
                  type="button"
                  onClick={() => setSelectedRole('buyer')}
                  className={`flex-1 h-20 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-4 transition-all duration-700 ${selectedRole === 'buyer' ? 'bg-[#1b6b3e] text-white shadow-2xl shadow-green-900/50 scale-[1.02]' : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white'
                     }`}
               >
                  <ShoppingBag className={`w-5 h-5 ${selectedRole === 'buyer' ? 'scale-110' : 'opacity-40'}`} />
                  Buyer Node
               </button>
               <button
                  type="button"
                  onClick={() => setSelectedRole('vendor')}
                  className={`flex-1 h-20 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-4 transition-all duration-700 ${selectedRole === 'vendor' ? 'bg-[#1b6b3e] text-white shadow-2xl shadow-green-900/50 scale-[1.02]' : 'text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white'
                     }`}
               >
                  <Store className={`w-5 h-5 ${selectedRole === 'vendor' ? 'scale-110' : 'opacity-40'}`} />
                  Vendor Stall
               </button>
            </div>

            <div className="mb-12 text-center px-4">
               <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed opacity-80">
                  {selectedRole === 'buyer'
                     ? 'Enter the premium marketplace ecosystem.'
                     : 'Access your commercial dashboard interface.'}
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
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.3em] block ml-4">System Identity (Email)</label>
                     <div className="relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                        <Input
                           required
                           type="email"
                           placeholder="auth@bcmis.cloud"
                           className="h-20 pl-16 pr-8 rounded-[2rem] bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm tracking-tight placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           value={email}
                           onChange={e => setEmail(e.target.value)}
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center px-4 mb-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.3em] block">Secure Access Key</label>
                        <button 
                           type="button" 
                           onClick={() => router.push('/forgot-password')}
                           className="text-[10px] font-black text-green-700 dark:text-green-500 uppercase tracking-widest hover:underline hover:underline-offset-4 transition-all"
                        >
                           Recovery
                        </button>
                     </div>
                     <div className="relative group">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600 group-focus-within:text-green-700 dark:group-focus-within:text-green-500 transition-colors" />
                        <Input
                           required
                           type={showPassword ? 'text' : 'password'}
                           placeholder="••••••••••••"
                           className="h-20 pl-16 pr-16 rounded-[2rem] bg-gray-50 dark:bg-white/[0.04] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-gray-900 dark:text-white transition-all font-bold text-sm tracking-tight placeholder:text-gray-400 dark:placeholder:text-gray-600"
                           value={password}
                           onChange={e => setPassword(e.target.value)}
                        />
                        <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-green-700 dark:hover:text-green-500 transition-colors"
                        >
                           {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                     </div>
                  </div>

               </div>

               <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-20 rounded-[2rem] bg-green-700 hover:bg-green-800 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_40px_-15px_rgba(21,128,61,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
               >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                     <>
                        <span>Initiate Authorization</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                     </>
                  )}
               </Button>
            </form>

            <div className="mt-16 mb-2 pt-10 border-t border-gray-100 dark:border-white/5 text-center">
               <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[.2em] hover:text-green-700 dark:hover:text-white transition-all duration-300 group"
               >
                  Security ID not recognized? <span className="text-green-700 dark:text-green-500 ml-2 group-hover:underline">Register New Profile</span>
               </button>
            </div>
         </div>

         <div className="mt-10 flex items-center justify-center gap-10 opacity-30">
            <ShieldCheck className="w-5 h-5 text-gray-400 dark:text-gray-600" />
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 dark:text-gray-600">Encrypted Enterprise Gateway</div>
         </div>
      </div>
   )
}
