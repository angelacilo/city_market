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
    <div className="w-full max-w-sm">
       <div className="bg-white rounded-[3rem] border border-gray-50 shadow-2xl p-10 overflow-hidden relative">
          
          <div className="flex flex-col items-center mb-12 text-center">
             <div className="w-12 h-1.5 bg-[#1b6b3e] rounded-full mb-8" />
             <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight leading-none italic font-serif">Sign <span className="text-[#1b6b3e]">In</span></h2>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 px-6 leading-relaxed">
                Welcome back to Butuan City Market System
             </p>
          </div>
 
          {/* Pill Toggle (Visual only) */}
          <div className="bg-gray-100 rounded-[2rem] p-1.5 flex mb-6 shadow-sm border border-gray-100/50">
             <button
                type="button"
                onClick={() => setSelectedRole('buyer')}
                className={`flex-1 h-12 rounded-full text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                   selectedRole === 'buyer' ? 'bg-[#1b6b3e] text-white shadow-lg shadow-green-900/10' : 'text-gray-400 hover:text-gray-900'
                }`}
             >
                <ShoppingBag className={`w-3.5 h-3.5 ${selectedRole === 'buyer' ? '' : 'opacity-40'}`} />
                Buyer
             </button>
             <button
                type="button"
                onClick={() => setSelectedRole('vendor')}
                className={`flex-1 h-12 rounded-full text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                   selectedRole === 'vendor' ? 'bg-[#1b6b3e] text-white shadow-lg shadow-green-900/10' : 'text-gray-400 hover:text-gray-900'
                }`}
             >
                <Store className={`w-3.5 h-3.5 ${selectedRole === 'vendor' ? '' : 'opacity-40'}`} />
                Vendor
             </button>
          </div>
 
          <div className="mb-10 text-center px-4 animate-in fade-in duration-500">
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {selectedRole === 'buyer' 
                   ? 'Sign in to browse prices and message vendors.' 
                   : 'Sign in to manage your stall and respond to inquiries.'}
             </p>
          </div>
 
          {error && (
             <div className="mb-8 p-5 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-red-900 leading-relaxed uppercase tracking-tight">{error}</p>
             </div>
          )}
 
          <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Email</label>
                   <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#1b6b3e] transition-colors" />
                      <Input 
                         required 
                         type="email"
                         placeholder="your@email.com"
                         className="h-14 pl-12 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                         value={email}
                         onChange={e => setEmail(e.target.value)}
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between items-center px-1 mb-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Password</label>
                      <button type="button" className="text-[10px] font-black text-[#1b6b3e] uppercase tracking-widest hover:underline">Forgot?</button>
                   </div>
                   <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#1b6b3e] transition-colors" />
                      <Input 
                         required 
                         type={showPassword ? 'text' : 'password'}
                         placeholder="••••••••"
                         className="h-14 pl-12 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                         value={password}
                         onChange={e => setPassword(e.target.value)}
                      />
                      <button 
                         type="button" 
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity"
                      >
                         {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                   </div>
                </div>
             </div>
 
             <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-green-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                   <>
                      <span>Secure Access</span>
                      <ArrowRight className="w-4 h-4" />
                   </>
                )}
             </Button>
          </form>
 
          <div className="mt-10 mb-2 pt-8 border-t border-gray-50 text-center">
             <button 
                type="button" 
                onClick={() => router.push('/register')}
                className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-[#1b6b3e] transition-colors"
             >
                Don't have an account? <span className="text-[#1b6b3e]">Register</span>
             </button>
          </div>
       </div>
       
       <div className="mt-8 flex items-center justify-center gap-10 opacity-40">
          <ShieldCheck className="w-5 h-5 text-gray-400" />
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Encrypted Enterprise Auth</div>
       </div>
    </div>
  )
}
