'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, CheckCircle2, User, Phone, MapPin, Store } from 'lucide-react'
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
    <div className="max-w-4xl space-y-8">
      {/* Success notification */}
      {saved && (
        <div className="flex items-center gap-4 bg-[#f0f7f0] border border-green-100/50 rounded-2xl px-6 py-4 shadow-sm animate-in fade-in slide-in-from-top-2">
           <CheckCircle2 className="w-5 h-5 text-green-700" />
           <p className="text-sm font-black text-green-900 font-serif">Your profile has been synchronized successfully.</p>
        </div>
      )}

      {serverError && (
        <div className="p-4 bg-red-50 text-red-600 font-bold text-xs rounded-2xl border border-red-100">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Info Section */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 space-y-8">
           <div className="flex items-center gap-3 border-b border-gray-50 pb-6 mb-2">
                <Store className="w-5 h-5 text-green-700" />
                <h3 className="text-xl font-black text-gray-900 font-serif leading-none">Business Profile</h3>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Business Name</label>
                <Input
                  {...register('business_name')}
                  placeholder="Juan's Fresh Produce"
                  className={cn(
                    "rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-12 px-5 font-bold text-sm",
                    errors.business_name && "border-red-400 focus:border-red-400"
                  )}
                />
                {errors.business_name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.business_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Authorized Owner</label>
                <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                      {...register('owner_name')}
                      placeholder="Full Name"
                      className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-12 pl-12 pr-5 font-bold text-sm"
                    />
                </div>
              </div>
           </div>
        </div>

        {/* Operational Info Section */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 space-y-8">
           <div className="flex items-center gap-3 border-b border-gray-50 pb-6 mb-2">
                <MapPin className="w-5 h-5 text-green-700" />
                <h3 className="text-xl font-black text-gray-900 font-serif leading-none">Location & Contact</h3>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Stall Number</label>
                <Input
                  {...register('stall_number')}
                  placeholder="e.g. A-12"
                  className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-12 px-5 font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Phone Number</label>
                <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                      {...register('contact_number')}
                      placeholder="09XXXXXXXXX"
                      className={cn(
                        "rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-12 pl-12 pr-5 font-bold text-sm font-mono tracking-widest",
                        errors.contact_number && "border-red-400 focus:border-red-400"
                      )}
                    />
                </div>
                {errors.contact_number && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.contact_number.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Opening Time</label>
                    <Input
                      {...register('opening_time')}
                      type="time"
                      className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-12 px-5 font-bold text-sm"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Closing Time</label>
                    <Input
                      {...register('closing_time')}
                      type="time"
                      className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white h-12 px-5 font-bold text-sm"
                    />
                 </div>
              </div>

              {/* Immutable Market Info */}
              <div className="space-y-2 opacity-60">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Assigned Market</label>
                <div className="flex items-center gap-3 h-12 px-5 bg-gray-100/50 border border-gray-200 rounded-2xl cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-black text-gray-500 font-serif">{marketName}</span>
                </div>
              </div>
           </div>
        </div>

        <div className="md:col-span-2 flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-green-700 hover:bg-green-800 text-white h-14 px-12 text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-green-700/20"
          >
            {isSubmitting ? 'Synchronizing...' : 'Save Profile Details'}
          </Button>
        </div>
      </form>
    </div>
  )
}
