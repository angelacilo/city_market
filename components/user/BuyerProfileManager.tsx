'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { changePassword } from '@/lib/actions/auth'
import {
  User,
  Mail,
  MapPin,
  Phone,
  Lock,
  Trash2,
  AlertTriangle,
  Loader2,
  Check,
  Edit2,
  Shield,
  Briefcase,
  ArrowRight,
  Activity,
  ShieldCheck
} from 'lucide-react'
import { initiatePasswordReset, verifyOtpAndChangePassword } from '@/lib/actions/auth'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  contact_number: z.string().regex(/^09\d{9}$/, 'Must be a valid Philippine mobile (09XXXXXXXXX)').optional().or(z.literal('')),
  barangay: z.string().min(1, 'Please select your barangay'),
})


type ProfileFormValues = z.infer<typeof profileSchema>

const securitySchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type SecurityFormValues = z.infer<typeof securitySchema>

export default function BuyerProfileManager({ initialProfile, userEmail }: { initialProfile: any, userEmail: string }) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)


  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialProfile.full_name || '',
      contact_number: initialProfile.contact_number || '',
      barangay: initialProfile.barangay || ''
    }

  })

  const { register: registerSecurity, handleSubmit: handleSubmitSecurity, formState: { errors: securityErrors }, reset: resetSecurity } = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })


  const onUpdateProfile = async (values: ProfileFormValues) => {
    setLoading(true)
    const { error } = await supabase
      .from('buyer_profiles')
      .update(values)
      .eq('user_id', initialProfile.user_id)

    if (error) {
      toast.error('Failed to update profile.')
    } else {
      toast.success('Profile updated successfully.')
      setIsEditing(false)
      router.refresh()
    }
    setLoading(false)
  }

  const handleStartEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsEditing(false)
  }

  const handleCancelProfile = () => {
    // Force reset to initial values
    window.location.reload()
  }

  const handleAvatarSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleCancelUpload = () => {
    setPreviewUrl(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveAvatar = async () => {
    if (!selectedFile) return

    setUploading(true)
    const fileExt = selectedFile.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `avatars/${initialProfile.user_id}/${fileName}`

    try {
      // 1. Upload the file
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      // 3. Update the database profile
      const { error: updateError } = await supabase
        .from('buyer_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', initialProfile.user_id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setPreviewUrl(null)
      setSelectedFile(null)
      toast.success('Portrait reconfigured.', { description: 'Your visual identity has been updated.' })
      router.refresh()
    } catch (err: any) {
      toast.error('Upload failure.', { description: err.message || 'Transmission interrupted.' })
    } finally {
      setUploading(false)
    }
  }




  const handleDeleteAccount = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('buyer_profiles')
      .delete()
      .eq('user_id', initialProfile.user_id)

    if (!error) {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-20 lg:py-32 space-y-24 dark:bg-[#121212] transition-colors duration-500">

      {/* Cinematic Header */}
      <div className="space-y-6 animate-in fade-in slide-in-from-top-12 duration-1000">
        <div className="space-y-2">
          <span className="text-[11px] font-black text-green-700 dark:text-green-500 uppercase tracking-[0.4em] mb-4 block">
            Account Management
          </span>
          <h1 className="text-5xl lg:text-7xl font-sans font-black leading-[0.9] tracking-tight dark:text-white">
            Your <span className="text-green-700 italic dark:text-green-500">Account</span> Settings
          </h1>
        </div>
        <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 max-w-xl font-medium leading-relaxed">
          Update your personal info, change your password, and manage your account settings here.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="rounded-[3rem] p-12 border-none shadow-[0_30px_100px_-20px_rgba(0,0,0,0.05)] dark:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.4)] dark:bg-[#1e1e1e]/60 backdrop-blur-3xl overflow-hidden relative group">
        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-44 h-44 rounded-[4rem] overflow-hidden ring-[12px] ring-green-50 dark:ring-green-950/20 shadow-2xl relative bg-white flex items-center justify-center">
              {previewUrl || avatarUrl ? (
                <Image src={previewUrl || avatarUrl} alt="Profile" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 text-5xl font-black">
                  {initialProfile.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            {previewUrl ? (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30 animate-in fade-in slide-in-from-bottom-4 duration-500 w-max">
                <Button
                  onClick={handleSaveAvatar}
                  disabled={uploading}
                  className="h-12 px-6 bg-[#1b6b3e] hover:bg-green-800 text-white rounded-2xl shadow-2xl transition-all border-none font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save Portrait</>}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelUpload}
                  disabled={uploading}
                  className="h-12 px-6 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border-red-200 dark:border-red-900/30 rounded-2xl shadow-xl transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Cancel
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -left-2 w-12 h-12 bg-green-700 hover:bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all outline-none border-4 border-white dark:border-[#1e1e1e]"
              >
                <Edit2 className="w-5 h-5" />
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


          <div className="text-center md:text-left space-y-6 flex-1">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase">
                {initialProfile.full_name}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-none px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
                  Member since {new Date(initialProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Badge>
                <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-none px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
                  Buyer Account
                </Badge>
              </div>
            </div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Click the edit button to upload a new profile picture.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Personal Information */}
        <Card className="rounded-3xl p-8 lg:p-10 border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] dark:bg-[#1e1e1e] group overflow-hidden relative">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-700 dark:text-green-500 group-hover:rotate-12 transition-transform duration-500">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">Your Details</h3>
          </div>

          <form id="buyer-profile-form" onSubmit={handleSubmit(onUpdateProfile)} className="space-y-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Full Name</label>
              <Input
                {...register('full_name')}
                disabled={!isEditing}
                className={cn(
                  "h-16 rounded-2xl border-none font-bold transition-all px-8 dark:text-white",
                  isEditing ? "bg-white dark:bg-black/40 ring-4 ring-green-100 dark:ring-green-900/20" : "bg-gray-50 dark:bg-black/20 opacity-70"
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Email Address</label>
              <Input
                value={userEmail}
                disabled
                className="h-16 rounded-2xl bg-gray-50/50 dark:bg-black/10 border-none font-bold text-gray-400 px-8 cursor-not-allowed opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Mobile</label>
                <Input
                  {...register('contact_number')}
                  disabled={!isEditing}
                  className={cn(
                    "h-14 rounded-xl border-none font-bold transition-all px-6 dark:text-white",
                    isEditing ? "bg-white dark:bg-black/40 ring-4 ring-green-100 dark:ring-green-900/20" : "bg-gray-50 dark:bg-black/20 opacity-70"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Barangay</label>
                <Input
                  {...register('barangay')}
                  disabled={!isEditing}
                  className={cn(
                    "h-14 rounded-xl border-none font-bold transition-all px-6 dark:text-white",
                    isEditing ? "bg-white dark:bg-black/40 ring-4 ring-green-100 dark:ring-green-900/20" : "bg-gray-50 dark:bg-black/20 opacity-70"
                  )}
                />
              </div>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-6 pt-10">
            {!isEditing ? (
              <Button
                type="button"
                onClick={handleStartEdit}
                className="h-14 px-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
            ) : (
              <>
                <Button
                  form="buyer-profile-form"
                  type="submit"
                  disabled={loading}
                  className="h-14 px-12 bg-green-700 hover:bg-green-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-900/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>Save Changes</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-14 px-10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-95"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Security Section */}
        <Card className="rounded-3xl p-8 lg:p-10 border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] dark:bg-[#1e1e1e] group overflow-hidden relative">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:-rotate-12 transition-transform duration-500">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">Security</h3>
          </div>

          <div className="space-y-10">
            <PasswordOverrideFlow email={userEmail} />
          </div>

        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="rounded-[2.5rem] p-12 border-2 border-red-50 dark:border-red-900/30 bg-red-50/20 dark:bg-red-900/10 overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3 text-red-700 dark:text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Danger Zone</h3>
            </div>
            <p className="text-sm text-red-600/70 dark:text-red-400/70 font-bold leading-relaxed max-w-xl">
              Deleting your account is permanent. All your canvass lists, message history, and saved vendor data will be removed from the Butuan City Market database.
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-16 px-12 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shrink-0 shadow-xl shadow-red-500/10">
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-none shadow-2xl p-10 max-w-lg dark:bg-[#1e1e1e]">
              <DialogHeader className="space-y-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-red-600 dark:text-red-500 mb-2 mx-auto">
                  <Trash2 className="w-10 h-10" />
                </div>
                <DialogTitle className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight text-center">Are you sure?</DialogTitle>
                <DialogDescription className="text-base text-gray-500 dark:text-gray-400 font-bold leading-relaxed text-center">
                  This action cannot be undone. You will lose all your saved comparisons and messaging history with vendors across all markets.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-10">
                <Button variant="ghost" className="flex-1 rounded-2xl font-black uppercase text-[11px] tracking-widest text-gray-400 dark:text-gray-600">Keep account</Button>
                <Button variant="destructive" disabled={loading} className="flex-1 h-16 rounded-2xl font-black uppercase text-[11px] tracking-widest bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all active:scale-95" onClick={handleDeleteAccount}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete Permanently'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

    </div>
  )
}

function PasswordOverrideFlow({ email }: { email: string }) {
  const [stage, setStage] = useState<'idle' | 'otp' | 'password'>('idle')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleInitiate() {
    setLoading(true)
    const res = await initiatePasswordReset(email)
    setLoading(false)
    if (res.error) {
      toast.error('Failed to send code', { description: res.error })
    } else {
      setStage('otp')
      toast.success('Verification code sent', { description: 'Please check your Gmail inbox.' })
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (token.length < 6) return
    setStage('password')
    toast.success('Code verified', { description: 'You can now set your new password.' })
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match', { description: 'Please re-type your password.' })
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password too short', { description: 'Must be at least 8 characters.' })
      return
    }

    setLoading(true)
    const res = await verifyOtpAndChangePassword({ email, token, newPassword })
    setLoading(false)

    if (res.error) {
      toast.error('Update failed', { description: res.error })
    } else {
      toast.success('Password updated successfully', { description: 'You can now use your new password to sign in.' })
      setStage('idle')
      setToken('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="space-y-8 py-2">
      <div className="flex -space-x-2 pb-2">
        <div className={cn("h-1 w-12 rounded-full transition-all duration-700", stage === 'idle' ? "bg-amber-500" : "bg-green-500")} />
        <div className={cn("h-1 w-12 rounded-full transition-all duration-700 ml-2", stage === 'otp' ? "bg-amber-500" : stage === 'password' ? "bg-green-500" : "bg-gray-100 dark:bg-white/5")} />
        <div className={cn("h-1 w-12 rounded-full transition-all duration-700 ml-2", stage === 'password' ? "bg-amber-500" : "bg-gray-100 dark:bg-white/5")} />
      </div>

      {stage === 'idle' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed">
            We will send a verification code to <span className="text-gray-900 dark:text-gray-200">{email}</span> to confirm it's really you.
          </p>
          <Button
            onClick={handleInitiate}
            disabled={loading}
            className="w-full h-16 rounded-2xl bg-black dark:bg-white dark:text-black font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>Get Verification Code</span>
                <Mail className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {stage === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Enter 6-Digit Code</label>
            <div className="relative">
              <Input
                required
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="000000"
                className="h-16 rounded-2xl bg-gray-50 dark:bg-black/20 border-none font-black text-center text-lg tracking-[0.5em] px-8 focus:bg-white dark:focus:bg-black/40 transition-all placeholder:tracking-normal"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full h-16 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-[11px] transition-all shadow-xl active:scale-95"
            >
              Verify Code
            </Button>
            <button 
              type="button" 
              onClick={() => setStage('idle')}
              className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {stage === 'password' && (
        <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">New Password</label>
              <div className="relative group">
                <Lock className={cn("absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", showPass ? "text-green-500" : "text-gray-300 dark:text-gray-700")} />
                <Input
                  type={showPass ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="h-16 rounded-2xl bg-gray-50 dark:bg-black/20 border-none font-bold px-14 focus:bg-white dark:focus:bg-black/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-800 hover:text-green-500 transition-colors"
                >
                  <ShieldCheck className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Confirm Password</label>
              <div className="relative">
                <Check className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-700" />
                <Input
                  type={showPass ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="h-16 rounded-2xl bg-gray-50 dark:bg-black/20 border-none font-bold px-14 focus:bg-white dark:focus:bg-black/40 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-black uppercase tracking-widest text-[11px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>Change Password</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </Button>
            <button 
              type="button" 
              onClick={() => setStage('idle')}
              className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
