'use client'
 
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'

import { Button } from '@/components/ui/button'
import { Lock, CheckCircle2, User, Phone, MapPin, Store, ShieldCheck, Loader2, ArrowRight, Trash2, Activity } from 'lucide-react'

import { updateVendorProfile } from '@/lib/actions/vendor'
import { changePassword } from '@/lib/actions/auth'
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
    avatar_url?: string
  }
  marketName: string
}

 
export default function ProfileForm({ vendorId, email, initialData, marketName }: Props) {
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatar_url || '')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const supabase = createClient()

 
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  })
 
  function handleAvatarSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleCancelUpload() {
    setPreviewUrl(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSaveAvatar() {
    if (!selectedFile) return

    setUploading(true)
    const fileExt = selectedFile.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const filePath = `avatars/${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('vendors')
        .update({ avatar_url: publicUrl })
        .eq('id', vendorId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setPreviewUrl(null)
      setSelectedFile(null)
      toast.success('Profile picture updated.')
      router.refresh()
    } catch (err: any) {
      toast.error('Upload failed', { description: err.message })
    } finally {
      setUploading(false)
    }
  }


  async function onSubmit(data: ProfileFormValues) {

    setServerError('')
    setSaved(false)
    const result = await updateVendorProfile(vendorId, data)
    if (result.error) {
      setServerError(result.error)
      toast.error('Failed to update shop info.')
    } else {
      setSaved(true)
      setIsEditing(false)
      toast.success('Shop profile updated!')
      setTimeout(() => setSaved(false), 3000)
    }
  }
 
  return (
    <div className="max-w-7xl space-y-8 pb-32 transition-colors duration-500">
      {/* Profile Picture */}
      <div className="bg-white dark:bg-[#0a0f0a] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/[0.03] shadow-sm relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative">
            <div className="w-40 h-40 rounded-[3rem] overflow-hidden ring-[10px] ring-green-50 dark:ring-green-900/10 shadow-xl relative bg-white flex items-center justify-center">
              {previewUrl || avatarUrl ? (
                <NextImage src={previewUrl || avatarUrl} alt="Vendor" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-[#1b6b3e] dark:text-green-500 text-4xl font-black italic font-serif">
                  {initialData.business_name.charAt(0)}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            {previewUrl ? (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 animate-in fade-in zoom-in duration-300">
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  disabled={uploading}
                  className="w-10 h-10 bg-[#1b6b3e] text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-green-800 transition-all border-4 border-white dark:border-[#0a0f0a] group/save"
                >
                  <CheckCircle2 className="w-4 h-4 group-hover:scale-110" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  disabled={uploading}
                  className="w-10 h-10 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-all border-4 border-white dark:border-[#0a0f0a] group/cancel"
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#1b6b3e] hover:bg-[#155430] text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all outline-none border-4 border-white dark:border-[#0a0f0a]"
              >
                <Activity className="w-4 h-4" />
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarSelection}
            />
          </div>


          <div className="text-center md:text-left space-y-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none italic font-serif uppercase">
                {initialData.business_name}
              </h2>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="text-[8px] font-black text-[#1b6b3e] dark:text-green-500 uppercase tracking-widest bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full border border-green-100 dark:border-green-500/20">Active</span>
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-500/20">Verified Merchant</span>
              </div>
            </div>
            <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-relaxed">
              Upload a logo or photo of your stall to personalize your shop.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications Layer */}
      <div className="flex flex-col gap-4">
        {saved && (
          <div className="flex items-center gap-6 bg-[#f0f7f0] dark:bg-green-500/10 border border-green-100/50 dark:border-green-500/20 rounded-[2.5rem] px-10 py-8 shadow-2xl dark:shadow-[0_0_50px_rgba(27,107,62,0.15)] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-14 h-14 rounded-3xl bg-white dark:bg-[#121212] flex items-center justify-center text-[#1b6b3e] dark:text-green-500 shadow-xl border border-green-50 dark:border-white/5">
               <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
               <p className="text-lg font-black text-gray-900 dark:text-white leading-none tracking-tight uppercase">Shop Profile Updated</p>
               <p className="text-[10px] font-black text-[#1b6b3e] dark:text-green-500 uppercase tracking-widest mt-2">Your changes are now live on the marketplace.</p>
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
          id="vendor-profile-form" 
          onSubmit={handleSubmit(onSubmit)} 
          className="flex flex-col lg:flex-row items-stretch gap-6 flex-[2]"
        >
          {/* Store Information Section */}
          <div className="flex-1 bg-white dark:bg-[#0a0f0a] rounded-3xl border border-gray-100 dark:border-white/[0.03] shadow-sm p-5 space-y-5 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity">
              <Store className="w-16 h-16 rotate-12 text-gray-400 dark:text-green-500" />
            </div>
            
            <div className="flex items-center gap-4 border-b border-gray-50 dark:border-white/5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center group-hover:bg-[#1b6b3e] transition-all duration-500 border border-green-100/50 dark:border-green-500/20">
                <Store className="w-4 h-4 text-[#1b6b3e] dark:text-green-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-900 dark:text-white leading-none tracking-tight uppercase">Shop <span className="text-[#1b6b3e] dark:text-green-500">Info</span></h3>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-1">Basic Details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Business Name</label>
                <Input
                  {...register('business_name')}
                  disabled={!isEditing}
                  placeholder="Juan's Premium Harvest"
                  className={cn(
                    "rounded-xl border-none h-10 px-4 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800",
                    isEditing ? "bg-white dark:bg-white/[0.05] ring-2 ring-green-100 dark:ring-green-900/20" : "bg-gray-50 dark:bg-black/20 opacity-70",
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
                    disabled={!isEditing}
                    placeholder="Owner's Name"
                    className={cn(
                      "rounded-xl border-none h-10 pl-10 pr-4 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800",
                      isEditing ? "bg-white dark:bg-white/[0.05] ring-2 ring-green-100 dark:ring-green-900/20" : "bg-gray-50 dark:bg-black/20 opacity-70"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div className="flex-1 bg-white dark:bg-[#0a0f0a] rounded-3xl border border-gray-100 dark:border-white/[0.03] shadow-sm p-5 space-y-5 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity">
              <MapPin className="w-16 h-16 -rotate-12 text-gray-400 dark:text-green-500" />
            </div>

            <div className="flex items-center gap-4 border-b border-gray-50 dark:border-white/5 pb-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center group-hover:bg-[#1b6b3e] transition-all duration-500 border border-green-100/50 dark:border-green-500/20">
                <MapPin className="w-4 h-4 text-[#1b6b3e] dark:text-green-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-900 dark:text-white leading-none tracking-tight uppercase">Stall <span className="text-[#1b6b3e] dark:text-green-500">Details</span></h3>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-1">Location & Hours</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Stall</label>
                  <Input
                    {...register('stall_number')}
                    disabled={!isEditing}
                    placeholder="ID-V-12"
                    className={cn(
                      "rounded-xl border-none h-10 px-4 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800",
                      isEditing ? "bg-white dark:bg-white/[0.05] ring-2 ring-green-100 dark:ring-green-900/20" : "bg-gray-50 dark:bg-black/20 opacity-70"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block ml-2">Channel</label>
                  <div className="relative group/input">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 dark:text-gray-800 group-focus-within/input:text-[#1b6b3e] dark:group-focus-within/input:text-green-500 transition-colors" />
                    <Input
                      {...register('contact_number')}
                      disabled={!isEditing}
                      placeholder="09XXXXXXXXX"
                      className={cn(
                        "rounded-xl border-none h-10 pl-8 pr-4 text-[10px] font-black text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-gray-800",
                        isEditing ? "bg-white dark:bg-white/[0.05] ring-2 ring-green-100 dark:ring-green-900/20" : "bg-gray-50 dark:bg-black/20 opacity-70",
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
                    disabled={!isEditing}
                    type="time"
                    className={cn(
                      "rounded-xl border-none h-10 px-4 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner",
                      isEditing ? "bg-white dark:bg-white/[0.05] ring-2 ring-green-100 dark:ring-green-900/20" : "bg-gray-50 dark:bg-black/20 opacity-70"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-widest block ml-2">Close</label>
                  <Input
                    {...register('closing_time')}
                    disabled={!isEditing}
                    type="time"
                    className={cn(
                      "rounded-xl border-none h-10 px-4 text-[11px] font-black text-gray-900 dark:text-white transition-all shadow-inner",
                      isEditing ? "bg-white dark:bg-white/[0.05] ring-2 ring-green-100 dark:ring-green-900/20" : "bg-gray-50 dark:bg-black/20 opacity-70"
                    )}
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
        {!isEditing ? (
          <Button
            type="button"
            onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
            className="rounded-xl bg-black dark:bg-white text-white dark:text-black h-12 w-full lg:w-80 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-98 flex items-center justify-center gap-3"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Edit Shop Profile</span>
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <Button
              form="vendor-profile-form"
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#1b6b3e] hover:bg-[#155430] text-white h-12 w-full sm:w-64 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-98 flex items-center justify-center gap-3 group/btn"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Save Changes</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={(e) => { e.preventDefault(); setIsEditing(false); }}
              className="h-12 w-full sm:w-auto px-10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 rounded-xl transition-all"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function PasswordChangeSection({ email }: { email: string }) {
  const [stage, setStage] = useState<'idle' | 'otp' | 'password'>('idle')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showPass, setShowPass] = useState(false)



  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setStage('password')
    setStatus(null)
    toast.success('Identity Challenge Verified')
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
    
    const res = await changePassword({ 
      currentPassword, 
      newPassword 
    })
    
    setLoading(false)

    if (res.error) {
      setStatus({ type: 'error', msg: res.error })
      toast.error('Reconfiguration Failed', { description: res.error })
    } else {
      setStatus({ type: 'success', msg: 'Credential registry updated.' })
      toast.success('Access Key Reconfigured', { description: 'Identity profile remains secure.' })
      setStage('idle')
      setCurrentPassword('')
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
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-widest leading-relaxed pr-8">
            Verify your current credentials to access security reconfiguration.
          </p>
          <Button
            onClick={() => setStage('otp')}
            className="w-full rounded-xl h-10 font-black uppercase tracking-[0.2em] text-[10px] bg-amber-600 hover:bg-amber-700 text-white transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
          >
            <span>Update Password</span>
            <ShieldCheck className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform" />
          </Button>
        </div>
      )}

      {stage === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2 text-center">
            <label className="text-[7px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.2em] block">Enter Current Password</label>
            <div className="relative group/input flex justify-center mt-2">
              <Input
                required
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl border-none bg-gray-50 dark:bg-white/[0.02] focus:bg-white dark:focus:bg-white/[0.05] h-10 w-full text-center text-[12px] font-black text-gray-900 dark:text-white transition-all shadow-inner tracking-[0.5em] placeholder:tracking-normal"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl h-10 font-black uppercase tracking-[0.2em] text-[9px] bg-amber-600 hover:bg-amber-700 text-white transition-all"
          >
            Verify Password
          </Button>

          <button 
            type="button" 
            onClick={() => setStage('idle')}
            className="w-full text-[8px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
          >
            Cancel Changes
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
