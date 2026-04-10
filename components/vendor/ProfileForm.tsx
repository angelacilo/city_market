'use client'
 
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, CheckCircle2, User, Phone, MapPin, Store, ShieldCheck, KeyRound, Loader2, ArrowRight } from 'lucide-react'
import { updateVendorProfile } from '@/lib/actions/vendor'
import { cn } from '@/lib/utils'
 
const profileSchema = z.object({
  business_name: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(80, 'Business name cannot exceed 80 characters'),
  owner_name: z.string().optional(),
  stall_number: z.string().optional(),
  contact_number: z
    .string()
    .regex(/^09\d{9}$/, 'Must be a valid Philippine mobile number (e.g. 09123456789)')
    .or(z.literal('')),
  opening_time: z.string().optional().or(z.literal('')),
  closing_time: z.string().optional().or(z.literal('')),
})
 
type ProfileFormValues = z.infer<typeof profileSchema>
 
interface Props {
  vendorId: string
  initialData: {
    business_name: string
    owner_name: string
    stall_number: string
    contact_number: string
    opening_time: string
    closing_time: string
  }
  marketName: string
}
 
export default function ProfileForm({ vendorId, initialData, marketName }: Props) {
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState('')
 
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  })
 
  async function onSubmit(data: ProfileFormValues) {
    setServerError('')
    setSaved(false)
    const result = await updateVendorProfile(vendorId, data)
    if (result.error) {
      setServerError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }
 
  return (
    <div className="max-w-6xl space-y-16 pb-32">
      {/* Notifications Layer */}
      <div className="flex flex-col gap-4">
        {saved && (
          <div className="flex items-center gap-6 bg-[#f0f7f0] dark:bg-green-500/10 border border-green-100/50 dark:border-green-500/20 rounded-[2.5rem] px-10 py-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-14 h-14 rounded-3xl bg-white dark:bg-[#121212] flex items-center justify-center text-[#1b6b3e] dark:text-green-500 shadow-xl">
               <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
               <p className="text-lg font-black text-gray-900 dark:text-white font-serif italic leading-none tracking-tight">Identity Synchronized</p>
               <p className="text-[10px] font-black text-[#1b6b3e] dark:text-green-500 uppercase tracking-[0.3em] mt-2">Core data propagates through the commercial network.</p>
            </div>
          </div>
        )}
 
        {serverError && (
          <div className="p-8 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm rounded-[2.5rem] border border-red-100 dark:border-red-500/20 shadow-2xl">
            {serverError}
          </div>
        )}
      </div>
 
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Core Identity Section */}
        <div className="bg-white dark:bg-[#0a0f0a] rounded-[3.5rem] border border-gray-100 dark:border-white/[0.03] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Store className="w-32 h-32 rotate-12" />
          </div>
          
          <div className="flex items-center gap-6 border-b border-gray-50 dark:border-white/5 pb-10">
            <div className="w-14 h-14 rounded-3xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center group-hover:bg-green-600 transition-all duration-500">
              <Store className="w-7 h-7 text-[#1b6b3e] dark:text-green-500 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white font-serif italic leading-none tracking-tight uppercase">Terminal <span className="text-[#1b6b3e] dark:text-green-500">Identity</span></h3>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] mt-2">Public commerce metadata</p>
            </div>
          </div>
 
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-4">Sub-Terminal Reference (Business Name)</label>
              <Input
                {...register('business_name')}
                placeholder="Juan's Premium Harvest"
                className={cn(
                  "rounded-3xl border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.08] h-20 px-8 font-bold text-base dark:text-white transition-all shadow-inner",
                  errors.business_name && "ring-2 ring-red-400"
                )}
              />
              {errors.business_name && <p className="text-[10px] text-red-500 font-bold ml-4">{errors.business_name.message}</p>}
            </div>
 
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-4">Authorized Principal (Owner Name)</label>
              <div className="relative group/input">
                <User className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 dark:text-gray-800 group-focus-within/input:text-[#1b6b3e] dark:group-focus-within/input:text-green-500 transition-colors" />
                <Input
                  {...register('owner_name')}
                  placeholder="Principal Identity Signature"
                  className="rounded-3xl border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.08] h-20 pl-20 pr-8 font-bold text-base dark:text-white transition-all shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>
 
        {/* Logistics & Protocols Section */}
        <div className="bg-white dark:bg-[#0a0f0a] rounded-[3.5rem] border border-gray-100 dark:border-white/[0.03] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <MapPin className="w-32 h-32 -rotate-12" />
          </div>

          <div className="flex items-center gap-6 border-b border-gray-50 dark:border-white/5 pb-10">
            <div className="w-14 h-14 rounded-3xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center group-hover:bg-green-600 transition-all duration-500">
              <MapPin className="w-7 h-7 text-[#1b6b3e] dark:text-green-500 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white font-serif italic leading-none tracking-tight uppercase">Logistics <span className="text-[#1b6b3e] dark:text-green-500">Matrix</span></h3>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] mt-2">Nodal parameters & connectivity</p>
            </div>
          </div>
 
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-4">Stall Unit</label>
                <Input
                  {...register('stall_number')}
                  placeholder="ID-V-12"
                  className="rounded-3xl border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.08] h-20 px-8 font-bold text-base dark:text-white transition-all shadow-inner"
                />
              </div>
 
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-4">Sync Channel</label>
                <div className="relative group/input">
                  <Phone className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-800 group-focus-within/input:text-[#1b6b3e] dark:group-focus-within/input:text-green-500 transition-colors" />
                  <Input
                    {...register('contact_number')}
                    placeholder="09XXXXXXXXX"
                    className={cn(
                      "rounded-3xl border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.08] h-20 pl-16 pr-8 font-bold text-base font-mono tracking-widest dark:text-white transition-all shadow-inner",
                      errors.contact_number && "ring-2 ring-red-400"
                    )}
                  />
                </div>
              </div>
            </div>
 
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-4">Open Window</label>
                <Input
                  {...register('opening_time')}
                  type="time"
                  className="rounded-3xl border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.08] h-20 px-8 font-bold text-lg dark:text-white transition-all shadow-inner"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-4">Close Window</label>
                <Input
                  {...register('closing_time')}
                  type="time"
                  className="rounded-3xl border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.08] h-20 px-8 font-bold text-lg dark:text-white transition-all shadow-inner"
                />
              </div>
            </div>
 
            {/* Immutable Node Context */}
            <div className="space-y-4 opacity-50 grayscale">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] block ml-4">Market Core Assignment</label>
              <div className="flex items-center gap-6 h-20 px-8 bg-gray-100/50 dark:bg-black/30 border border-gray-200 dark:border-white/5 rounded-3xl cursor-not-allowed">
                <Lock className="w-5 h-5 text-gray-400 dark:text-gray-700" />
                <span className="text-base font-black text-gray-600 dark:text-gray-600 font-serif italic tracking-tight">{marketName}</span>
              </div>
            </div>
          </div>
        </div>
 
        <div className="lg:col-span-2 flex justify-end pt-10">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[2.5rem] bg-[#1b6b3e] hover:bg-[#155430] text-white h-24 px-16 text-[13px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_20px_50px_rgba(27,107,62,0.3)] active:scale-95 flex items-center gap-6 group/btn"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>Commit System Changes</span>
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </form>
 
      {/* Security Layer */}
      <div className="pt-20 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-1 h-6 bg-amber-500 rounded-full" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 dark:text-gray-700">Security Configuration</h4>
        </div>
        <PasswordChangeSection />
      </div>
    </div>
  )
}
 
function PasswordChangeSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
 
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
 
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', msg: 'Verification mismatch: Input strings must be identical.' })
      return
    }
 
    if (newPassword.length < 6) {
      setStatus({ type: 'error', msg: 'Security failure: Password entropy too low (minimum 6 charts).' })
      return
    }
 
    setLoading(true)
    const { changePassword } = await import('@/lib/actions/auth')
    const res = await changePassword({ currentPassword, newPassword })
    setLoading(false)
 
    if (res.error) {
      setStatus({ type: 'error', msg: res.error })
    } else {
      setStatus({ type: 'success', msg: 'Security override successful: Primary credential updated.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }
 
  return (
    <div className="bg-white dark:bg-[#0a0f0a] rounded-[4rem] border border-gray-100 dark:border-white/[0.02] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.06)] p-12 lg:p-20 space-y-16 transition-all relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.05]">
        <ShieldCheck className="w-64 h-64 rotate-6" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-50 dark:border-white/5 pb-10">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 rounded-[2rem] bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 transition-all duration-700">
            <ShieldCheck className="w-10 h-10 text-amber-600 dark:text-amber-500 group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white font-serif italic leading-none tracking-tight uppercase">Security <span className="text-amber-500">Override</span></h3>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] mt-3">Advanced credential reconfiguration</p>
          </div>
        </div>
      </div>
 
      {status && (
        <div className={cn(
          "p-10 rounded-[2.5rem] text-[13px] font-black uppercase tracking-widest border animate-in fade-in zoom-in-95 duration-700",
          status.type === 'success' 
            ? "bg-green-50/50 dark:bg-green-500/5 text-[#1b6b3e] dark:text-green-500 border-green-100 dark:border-green-500/20" 
            : "bg-red-50/50 dark:bg-red-500/5 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
        )}>
          {status.msg}
        </div>
      )}
 
      <form onSubmit={handlePasswordChange} className="grid grid-cols-1 xl:grid-cols-2 gap-16">
        <div className="space-y-12">
           <div className="space-y-5">
             <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] block ml-6">Primary Authentication Key</label>
             <div className="relative group/input">
               <Lock className="absolute left-10 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-200 dark:text-gray-800 group-focus-within/input:text-amber-500 transition-colors" />
               <Input
                 type={showPass ? "text" : "password"}
                 required
                 value={currentPassword}
                 onChange={e => setCurrentPassword(e.target.value)}
                 className="rounded-[2.5rem] border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.08] h-24 px-24 font-bold text-lg dark:text-white transition-all shadow-inner"
               />
               <button
                 type="button"
                 onClick={() => setShowPass(!showPass)}
                 className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 hover:text-amber-500 transition-colors"
               >
                 {showPass ? (
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/></svg>
                 ) : (
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                 )}
               </button>
             </div>
           </div>
        </div>
 
        <div className="space-y-12">
          <div className="space-y-5">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] block ml-6">New Security Identifier</label>
            <div className="relative group/input">
              <KeyRound className="absolute left-10 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-200 dark:text-gray-800 group-focus-within/input:text-amber-500 transition-colors" />
              <Input
                type={showPass ? "text" : "password"}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="High Entropy Signature"
                className="rounded-[2.5rem] border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.08] h-24 px-24 font-bold text-lg dark:text-white transition-all shadow-inner"
              />
            </div>
          </div>
 
          <div className="space-y-5">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] block ml-6">Verifying Sequence</label>
            <div className="relative group/input">
              <CheckCircle2 className="absolute left-10 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-200 dark:text-gray-800 group-focus-within/input:text-amber-500 transition-colors" />
              <Input
                type={showPass ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Commit Signature"
                className="rounded-[2.5rem] border-none bg-gray-50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/[0.08] h-24 px-24 font-bold text-lg dark:text-white transition-all shadow-inner"
              />
            </div>
          </div>
 
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-[2.5rem] h-24 font-black uppercase tracking-[0.4em] text-[13px] bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-2xl shadow-amber-900/20 active:scale-95 flex items-center justify-center gap-8 group/btn"
          >
            {loading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <>
                <span>Update Credentials</span>
                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-3 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
