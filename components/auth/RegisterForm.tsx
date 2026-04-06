'use client'
 
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  const [registrationComplete, setRegistrationComplete] = useState(false)
  
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
       // 1. Sign Up
       const { data: authData, error: authError } = await supabase.auth.signUp({
          email: buyerData.email,
          password: buyerData.password,
          options: {
             data: { full_name: buyerData.fullName }
          }
       })
 
       if (authError) throw authError
 
       // 2. Insert into buyer_profiles
       if (authData.user) {
          const { error: profileError } = await supabase
             .from('buyer_profiles')
             .insert({
                user_id: authData.user.id,
                full_name: buyerData.fullName
             })
          
          if (profileError) throw profileError
       }
 
       // 3. Fix auto-login bug: sign out immediately
       await supabase.auth.signOut()
       
       setRegistrationComplete(true)
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
 
       // 2. Create Vendor record (pending approval)
       if (authData.user) {
          const { error: vendorError } = await supabase
             .from('vendors')
             .insert({
                user_id: authData.user.id,
                business_name: vendorData.businessName,
                owner_name: vendorData.ownerName,
                market_id: vendorData.marketId,
                stall_number: vendorData.stallNumber,
                contact_number: vendorData.contactNumber,
                is_approved: false
             })
          
          if (vendorError) throw vendorError
       }
 
       // 3. Fix auto-login bug: sign out immediately
       await supabase.auth.signOut()
       
       setRegistrationComplete(true)
    } catch (error: any) {
       console.error(error)
       toast.error(error.message || 'Registration failed')
    } finally {
       setLoading(false)
    }
  }
 
  if (registrationComplete) {
     return (
        <div className="w-full max-w-sm flex flex-col items-center text-center py-20 px-6 bg-white rounded-[3rem] border border-gray-50 shadow-2xl animate-in zoom-in duration-500">
           <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mb-10 border border-green-100 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-[#1b6b3e]" />
           </div>
           
           <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-none italic font-serif">
              {selectedRole === 'buyer' ? 'Account created!' : 'Registration submitted!'}
           </h2>
           <p className="text-gray-500 font-medium text-sm leading-relaxed mb-12 max-w-[280px]">
              {selectedRole === 'buyer' 
                 ? 'Your buyer account has been created successfully. Please sign in with your email and password to start browsing and inquiring about market products.' 
                 : 'Your vendor account is pending approval by the market administrator. Once approved you can sign in and start managing your stall listings.'}
           </p>
 
           <div className="w-full space-y-4">
              <Button 
                 onClick={() => router.push('/login')}
                 className="w-full h-14 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-green-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                 <span>Go to sign in</span>
                 <ArrowRight className="w-4 h-4" />
              </Button>
           </div>
 
           <div className="mt-10 pt-10 border-t border-gray-50 w-full">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                 System identity verified. <br /> Security protocols active.
              </p>
           </div>
        </div>
     )
  }
 
  return (
    <div className="w-full max-w-sm">
       <div className="bg-white rounded-[3rem] border border-gray-50 shadow-2xl p-10 overflow-hidden relative">
          
          <div className="flex flex-col items-center mb-12 text-center">
             <div className="w-12 h-1.5 bg-[#1b6b3e] rounded-full mb-8" />
             <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Create Account</h2>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select your system identity</p>
          </div>
 
          {/* Pill Toggle */}
          <div className="bg-gray-100/100 rounded-[2rem] p-1.5 flex mb-12 shadow-sm">
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
 
          {selectedRole === 'buyer' ? (
             /* BUYER FORM */
             <form onSubmit={handleBuyerSubmit} className="space-y-6">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Full Name</label>
                      <div className="relative group">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#1b6b3e] transition-colors" />
                         <Input 
                            required 
                            placeholder="Juan dela Cruz"
                            className="h-14 pl-12 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                            value={buyerData.fullName}
                            onChange={e => setBuyerData(prev => ({ ...prev, fullName: e.target.value }))}
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Email Address</label>
                      <div className="relative group">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#1b6b3e] transition-colors" />
                         <Input 
                            required 
                            type="email"
                            placeholder="juan@email.com"
                            className="h-14 pl-12 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                            value={buyerData.email}
                            onChange={e => setBuyerData(prev => ({ ...prev, email: e.target.value }))}
                         />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Password</label>
                         <div className="relative group">
                            <Input 
                               required 
                               type={showPassword ? 'text' : 'password'}
                               className="h-14 px-6 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                               value={buyerData.password}
                               onChange={e => setBuyerData(prev => ({ ...prev, password: e.target.value }))}
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
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Confirm</label>
                         <div className="relative group">
                            <Input 
                               required 
                               type={showConfirmPassword ? 'text' : 'password'}
                               className="h-14 px-6 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                               value={buyerData.confirmPassword}
                               onChange={e => setBuyerData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            />
                            <button 
                               type="button" 
                               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                               className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity"
                            >
                               {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
 
                <Button
                   type="submit"
                   disabled={loading}
                   className="w-full h-14 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-green-900/10 transition-all active:scale-[0.98]"
                >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Account'}
                </Button>
             </form>
          ) : (
             /* VENDOR FORM */
             <form onSubmit={handleVendorSubmit} className="space-y-6">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Business Name</label>
                      <Input 
                         required 
                         placeholder="Stall ni Mang Juan"
                         className="h-14 px-6 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                         value={vendorData.businessName}
                         onChange={e => setVendorData(prev => ({ ...prev, businessName: e.target.value }))}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Market Location</label>
                      <Select 
                         onValueChange={v => setVendorData(prev => ({ ...prev, marketId: v }))}
                         required
                      >
                         <SelectTrigger className="h-14 px-6 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#1b6b3e]/20 transition-all font-medium">
                            <SelectValue placeholder="Select Market" />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                            {markets.map(m => (
                               <SelectItem key={m.id} value={m.id} className="rounded-xl">{m.name}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Email</label>
                         <Input 
                            required 
                            type="email"
                            placeholder="vendor@email.com"
                            className="h-14 px-6 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                            value={vendorData.email}
                            onChange={e => setVendorData(prev => ({ ...prev, email: e.target.value }))}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Contact</label>
                         <Input 
                            required 
                            placeholder="0912..."
                            className="h-14 px-6 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                            value={vendorData.contactNumber}
                            onChange={e => setVendorData(prev => ({ ...prev, contactNumber: e.target.value }))}
                         />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Password</label>
                         <Input 
                            required 
                            type="password"
                            className="h-14 px-6 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                            value={vendorData.password}
                            onChange={e => setVendorData(prev => ({ ...prev, password: e.target.value }))}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Confirm</label>
                         <Input 
                            required 
                            type="password"
                            className="h-14 px-6 rounded-2xl bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#1b6b3e]/20 transition-all font-medium"
                            value={vendorData.confirmPassword}
                            onChange={e => setVendorData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                         />
                      </div>
                   </div>
                </div>
 
                <Button
                   type="submit"
                   disabled={loading}
                   className="w-full h-14 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-green-900/10 transition-all active:scale-[0.98]"
                >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Register Stall'}
                </Button>
             </form>
          )}
 
          <div className="mt-10 mb-2 pt-8 border-t border-gray-50 text-center">
             <button 
                type="button" 
                onClick={() => router.push('/login')}
                className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-[#1b6b3e] transition-colors"
             >
                Already have an account? <span className="text-[#1b6b3e]">Login</span>
             </button>
          </div>
       </div>
    </div>
  )
}
