'use client'
 
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, CheckCircle2, User, Phone, MapPin, Store, ShieldCheck, KeyRound, Loader2, ArrowRight, Activity } from 'lucide-react'
import { updateVendorProfile } from '@/lib/actions/vendor'
import { initiatePasswordReset, verifyOtpAndChangePassword } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
 
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
  email: string
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
 
export default function ProfileForm({ vendorId, email, initialData, marketName }: Props) {
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
    <div className="max-w-7xl space-y-8 pb-32 transition-colors duration-500">
      {/* Notifications Layer */}
      <div className="flex flex-col gap-4">
        {saved && (
          <div className="flex items-center gap-6 bg-[#f0f7f0] dark:bg-green-500/10 border border-green-100/50 dark:border-green-500/20 rounded-[2.5rem] px-10 py-8 shadow-2xl dark:shadow-[0_0_50px_rgba(27,107,62,0.15)] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-14 h-14 rounded-3xl bg-white dark:bg-[#121212] flex items-center justify-center text-[#1b6b3e] dark:text-green-500 shadow-xl border border-green-50 dark:border-white/5">
               <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
               <p className="text-lg font-black text-gray-900 dark:text-white font-serif italic leading-none tracking-tight uppercase">Identity Synchronized</p>
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

      <div className="flex flex-col lg:flex-row items-stretch gap-6">
        <form 
          id="profile-form" 
          onSubmit={handleSubmit(onSubmit)} 
          className="flex flex-col lg:flex-row items-stretch gap-6 flex-[2]"
        >
          {/* Core Identity Section */}
          <div className="flex-1 bg-white dark:bg-[#0a0f0a] rounded-3xl border border-gray-100 dark:border-white/[0.03] shadow-sm p-5 space-y-5 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity">
              <Store className="w-16 h-16 rotate-12 text-gray-400 dark:text-green-500" />
            </div>
            
            <div className="flex items-center gap-4 border-b border-gray-50 dark:border-white/5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center group-hover:bg-[#1b6b3e] transition-all duration-500 border border-green-100/50 dark:border-green-500/20">
                <Store className="w-4 h-4 text-[#1b6b3e] dark:text-green-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-900 dark:text-white font-serif italic leading-none tracking-tight uppercase">Terminal <span className="text-[#1b6b3e] dark:text-green-500">Identity</span></h3>
                <p className="text-[7px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mt-1">Commerce Metadata</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Business Name</label>
                <Input
                  {...register('business_name')}
                  placeholder="Juan's Premium Harvest"
                  className={cn(
                    "rounded-xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-10 px-4 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800",
                    errors.business_name && "ring-1 ring-red-400"
                  )}
                />
                {errors.business_name && <p className="text-[7px] text-red-500 font-bold ml-2">{errors.business_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Authorized Owner</label>
                <div className="relative group/input">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-gray-800 group-focus-within/input:text-[#1b6b3e] dark:group-focus-within/input:text-green-500 transition-colors" />
                  <Input
                    {...register('owner_name')}
                    placeholder="Owner Identity Signature"
                    className="rounded-xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-10 pl-10 pr-4 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logistics & Protocols Section */}
          <div className="flex-1 bg-white dark:bg-[#0a0f0a] rounded-3xl border border-gray-100 dark:border-white/[0.03] shadow-sm p-5 space-y-5 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity">
              <MapPin className="w-16 h-16 -rotate-12 text-gray-400 dark:text-green-500" />
            </div>

            <div className="flex items-center gap-4 border-b border-gray-50 dark:border-white/5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center group-hover:bg-[#1b6b3e] transition-all duration-500 border border-green-100/50 dark:border-green-500/20">
                <MapPin className="w-4 h-4 text-[#1b6b3e] dark:text-green-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-900 dark:text-white font-serif italic leading-none tracking-tight uppercase">Logistics <span className="text-[#1b6b3e] dark:text-green-500">Matrix</span></h3>
                <p className="text-[7px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mt-1">Nodal connectivity</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Stall</label>
                  <Input
                    {...register('stall_number')}
                    placeholder="ID-V-12"
                    className="rounded-xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-10 px-4 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Channel</label>
                  <div className="relative group/input">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 dark:text-gray-800 group-focus-within/input:text-[#1b6b3e] dark:group-focus-within/input:text-green-500 transition-colors" />
                    <Input
                      {...register('contact_number')}
                      placeholder="09XXXXXXXXX"
                      className={cn(
                        "rounded-xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-10 pl-8 pr-4 text-[10px] font-black font-mono tracking-wider text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800",
                        errors.contact_number && "ring-1 ring-red-400"
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Open</label>
                  <Input
                    {...register('opening_time')}
                    type="time"
                    className="rounded-xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-10 px-4 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner color-scheme-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Close</label>
                  <Input
                    {...register('closing_time')}
                    type="time"
                    className="rounded-xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-10 px-4 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner color-scheme-dark"
                  />
                </div>
              </div>

              {/* Immutable Context */}
              <div className="space-y-2 opacity-50 grayscale group-hover:grayscale-0 transition-all">
                <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Core Market</label>
                <div className="flex items-center gap-3 h-10 px-4 bg-gray-100/30 dark:bg-black/20 border border-gray-200/50 dark:border-white/5 rounded-xl cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-800" />
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-600 font-serif italic tracking-tight uppercase leading-none">{marketName}</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Security Layer Integration */}
        <div className="flex-1 w-full lg:min-w-[300px]">
          <PasswordChangeSection email={email} />
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          form="profile-form"
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-[#1b6b3e] hover:bg-[#155430] text-white h-12 w-full lg:w-80 text-[9px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_10px_30px_rgba(27,107,62,0.15)] dark:shadow-[0_0_25px_rgba(27,107,62,0.1)] active:scale-98 flex items-center justify-center gap-3 group/btn"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Commit System Changes</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1.5 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function PasswordChangeSection({ email }: { email: string }) {
  const [stage, setStage] = useState<'idle' | 'otp' | 'password'>('idle')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showPass, setShowPass] = useState(false)

  async function handleInitiate() {
    setLoading(true)
    setStatus(null)
    const res = await initiatePasswordReset(email)
    setLoading(false)
    if (res.error) {
      setStatus({ type: 'error', msg: res.error })
      toast.error('Dispatch Failure', { description: res.error })
    } else {
      setStage('otp')
      setStatus({ type: 'success', msg: 'Security code dispatched to your Gmail.' })
      toast.success('8-Digit Sequence Transmitted', { description: 'Check your relay (Gmail).' })
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (token.length < 8) {
      toast.warning('Sequence incomplete.')
      return
    }
    setStage('password')
    setStatus(null)
    toast.success('Handshake Verified', { description: 'Proceed to credential reconfiguration.' })
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', msg: 'Signatures do not match.' })
      toast.error('Mismatch Failure')
      return
    }
    if (newPassword.length < 8) {
      setStatus({ type: 'error', msg: 'Entropy baseline not met (min 8 chars).' })
      toast.error('Entropy Failure')
      return
    }

    setLoading(true)
    const res = await verifyOtpAndChangePassword({ email, token, newPassword })
    setLoading(false)

    if (res.error) {
      setStatus({ type: 'error', msg: res.error })
      toast.error('Reconfiguration Failed', { description: res.error })
    } else {
      setStatus({ type: 'success', msg: 'Credential registry updated.' })
      toast.success('Access Key Reconfigured', { description: 'Identity profile remains secure.' })
      setStage('idle')
      setToken('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="bg-white dark:bg-[#0a0f0a] rounded-3xl border border-gray-100 dark:border-white/[0.02] shadow-sm p-5 space-y-5 transition-all relative overflow-hidden group h-full">
      <div className="absolute top-0 right-0 p-4 opacity-[0.02] dark:opacity-[0.05] group-hover:opacity-[0.08] transition-opacity">
        <ShieldCheck className="w-16 h-16 rotate-6 text-amber-500" />
      </div>

      <div className="flex items-center gap-4 border-b border-gray-50 dark:border-white/5 pb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 transition-all duration-700 border border-amber-100/50 dark:border-amber-500/20">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-500 group-hover:text-white transition-colors" />
        </div>
        <div>
          <h3 className="text-xs font-black text-gray-900 dark:text-white font-serif italic leading-none tracking-tight uppercase">Security <span className="text-amber-500">Override</span></h3>
          <p className="text-[7px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mt-1 pr-10">Credential Setup {stage !== 'idle' && `— Phase ${stage === 'otp' ? '01' : '02'}`}</p>
        </div>
      </div>

      {status && (
        <div className={cn(
          "p-3 rounded-xl text-[8px] font-black uppercase tracking-widest border animate-in fade-in zoom-in-95 duration-700",
          status.type === 'success' 
            ? "bg-green-50/50 dark:bg-green-500/5 text-[#1b6b3e] dark:text-green-500 border-green-100 dark:border-green-500/20" 
            : "bg-red-50/50 dark:bg-red-500/5 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
        )}>
          {status.msg}
        </div>
      )}

      {stage === 'idle' && (
        <div className="space-y-4 py-2">
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-widest leading-relaxed">
            Verification via <span className="text-gray-900 dark:text-gray-200">{email}</span> is required to reconfigure your node access keys.
          </p>
          <Button
            onClick={handleInitiate}
            disabled={loading}
            className="w-full rounded-xl h-10 font-black uppercase tracking-[0.2em] text-[10px] bg-amber-600 hover:bg-amber-700 text-white transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <span>Initiate Challenge</span>
                <Activity className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform" />
              </>
            )}
          </Button>
        </div>
      )}

      {stage === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2 text-center">
            <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block">Enter 8-Digit Sequence</label>
            <div className="relative group/input flex justify-center mt-2">
              <Input
                required
                maxLength={8}
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="00000000"
                className="rounded-xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-10 w-full text-center text-[12px] font-black text-gray-900 dark:text-white transition-all shadow-inner tracking-[1em] placeholder:tracking-normal"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl h-10 font-black uppercase tracking-[0.2em] text-[9px] bg-amber-600 hover:bg-amber-700 text-white transition-all"
          >
            Verify Signature
          </Button>
          <button 
            type="button" 
            onClick={() => setStage('idle')}
            className="w-full text-[8px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
          >
            Cancel Protocol
          </button>
        </form>
      )}

      {stage === 'password' && (
        <form onSubmit={handleFinalSubmit} className="space-y-3">
          <div className="space-y-2">
            <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">New Access Key</label>
            <div className="relative group/input">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-200 dark:text-gray-800 group-focus-within/input:text-green-500 transition-colors" />
              <Input
                type={showPass ? "text" : "password"}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="rounded-xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-10 pl-10 pr-10 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-800 hover:text-green-500 transition-colors"
              >
                {showPass ? <Activity className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Verify Signature</label>
            <div className="relative group/input">
              <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-200 dark:text-gray-800 group-focus-within/input:text-green-500 transition-colors" />
              <Input
                type={showPass ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="rounded-xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-10 pl-10 pr-3 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl h-10 font-black uppercase tracking-[0.2em] text-[10px] bg-[#1b6b3e] hover:bg-[#155430] text-white transition-all active:scale-95 flex items-center justify-center gap-2 group/btn mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <span>Update Registry</span>
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
          <button 
            type="button" 
            onClick={() => setStage('idle')}
            className="w-full text-[8px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
          >
            Abort Transaction
          </button>
        </form>
      )}
    </div>
  )
}
