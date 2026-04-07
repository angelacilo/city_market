'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  Briefcase
} from 'lucide-react'
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
  mobile_number: z.string().regex(/^09\d{9}$/, 'Must be a valid Philippine mobile (09XXXXXXXXX)').optional().or(z.literal('')),
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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialProfile.full_name || '',
      mobile_number: initialProfile.mobile_number || '',
      barangay: initialProfile.barangay || ''
    }
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${initialProfile.user_id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('buyer_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', initialProfile.user_id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setToast({ message: 'Profile picture updated!', type: 'success' })
    } catch (err: any) {
      setToast({ message: err.message || 'Upload failed', type: 'error' })
    } finally {
      setUploading(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  const onSubmitProfile = async (values: ProfileFormValues) => {
    setLoading(true)
    const { error } = await supabase
      .from('buyer_profiles')
      .update(values)
      .eq('user_id', initialProfile.user_id)

    if (error) {
      setToast({ message: 'Failed to update profile', type: 'error' })
    } else {
      setToast({ message: 'Profile updated successfully!', type: 'success' })
    }
    setLoading(false)
    setTimeout(() => setToast(null), 3000)
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
          <h1 className="text-5xl lg:text-7xl font-playfair leading-[0.9] tracking-tight dark:text-white">
            Manage your <span className="text-green-700 italic dark:text-green-500">market profile</span>
          </h1>
        </div>
        <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 max-w-xl font-medium leading-relaxed uppercase tracking-tight">
          Update your personal information, security settings, and communication preferences for the Butuan City digital marketplace.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="rounded-[3rem] p-12 border-none shadow-[0_30px_100px_-20px_rgba(0,0,0,0.05)] dark:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.4)] dark:bg-[#1e1e1e]/60 backdrop-blur-3xl overflow-hidden relative group">
        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-44 h-44 rounded-[4rem] overflow-hidden ring-[12px] ring-green-50 dark:ring-green-950/20 shadow-2xl relative">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 text-5xl font-black">
                  {initialProfile.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-700 hover:bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all outline-none border-4 border-white dark:border-[#1e1e1e]"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
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
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] max-w-sm leading-relaxed">
              Update your photo to personalize your vendor interactions.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Personal Information */}
        <Card className="rounded-[3rem] p-10 lg:p-14 border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] dark:bg-[#1e1e1e] group overflow-hidden relative">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-700 dark:text-green-500 group-hover:rotate-12 transition-transform duration-500">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">Personal Information</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Full Name</label>
              <Input
                {...register('full_name')}
                className="h-16 rounded-2xl bg-gray-50 dark:bg-black/20 border-gray-100 dark:border-gray-800 focus:bg-white dark:focus:bg-black/40 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/20 font-bold transition-all px-8 border-none dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Email Address</label>
              <Input
                value={userEmail}
                disabled
                className="h-16 rounded-2xl bg-gray-50/50 dark:bg-black/10 border-none font-bold text-gray-400 px-8 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Mobile</label>
                <Input
                  {...register('mobile_number')}
                  className="h-16 rounded-2xl bg-gray-50 dark:bg-black/20 border-none focus:bg-white dark:focus:bg-black/40 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/20 font-bold transition-all px-8 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Barangay</label>
                <Input
                  {...register('barangay')}
                  className="h-16 rounded-2xl bg-gray-50 dark:bg-black/20 border-none focus:bg-white dark:focus:bg-black/40 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/20 font-bold transition-all px-8 dark:text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto h-16 px-12 bg-green-700 hover:bg-green-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              <Check className="ml-3 w-4 h-4" />
            </Button>
          </form>
        </Card>

        {/* Security Section */}
        <Card className="rounded-[3rem] p-10 lg:p-14 border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] dark:bg-[#1e1e1e] group overflow-hidden relative">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:-rotate-12 transition-transform duration-500">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">Security Settings</h3>
          </div>

          <div className="space-y-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Current Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-16 rounded-2xl bg-gray-50 dark:bg-black/20 border-none font-bold px-8 dark:text-white hover:bg-white dark:hover:bg-black/40 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">New Password</label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                className="h-16 rounded-2xl bg-gray-50 dark:bg-black/20 border-none font-bold px-8 dark:text-white hover:bg-white dark:hover:bg-black/40 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">Confirm New Password</label>
              <Input
                type="password"
                placeholder="Repeat new password"
                className="h-16 rounded-2xl bg-gray-50 dark:bg-black/20 border-none font-bold px-8 dark:text-white hover:bg-white dark:hover:bg-black/40 transition-colors"
              />
            </div>

            <Button
              variant="outline"
              className="w-full md:w-auto h-16 px-12 border-gray-100 dark:border-gray-800 text-gray-400 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-green-700 hover:text-white transition-all shadow-lg active:scale-95"
            >
              Update Password
            </Button>
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

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className={cn(
            "px-10 py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center gap-4 backdrop-blur-3xl border border-white/20 dark:border-white/5",
            toast.type === 'success' ? "bg-green-700 text-white" : "bg-red-600 text-white"
          )}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
