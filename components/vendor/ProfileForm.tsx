'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, CheckCircle2 } from 'lucide-react'
import { updateVendorProfile } from '@/lib/actions/vendor'

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
})

type ProfileForm = z.infer<typeof profileSchema>

interface Props {
  vendorId: string
  initialData: {
    business_name: string
    owner_name: string
    stall_number: string
    contact_number: string
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
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  })

  async function onSubmit(data: ProfileForm) {
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

  function Field({
    label,
    id,
    placeholder,
    registerKey,
    error,
    optional,
  }: {
    label: string
    id: string
    placeholder?: string
    registerKey: keyof ProfileForm
    error?: string
    optional?: boolean
  }) {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-xs font-bold text-gray-600 uppercase tracking-widest">
          {label}{optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
        </label>
        <Input
          id={id}
          placeholder={placeholder}
          {...register(registerKey)}
          className={`h-11 text-sm ${error ? 'border-red-400 focus-visible:border-red-400' : ''}`}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900">My Profile</h1>
        <p className="text-xs text-gray-400 mt-0.5">Update your stall information visible to buyers.</p>
      </div>

      {/* Success banner */}
      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-bold text-green-700">Profile saved successfully.</p>
        </div>
      )}

      {serverError && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg font-medium">{serverError}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field
          label="Business name"
          id="business_name"
          placeholder="e.g. Juan's Fresh Produce"
          registerKey="business_name"
          error={errors.business_name?.message}
        />
        <Field
          label="Owner name"
          id="owner_name"
          placeholder="e.g. Juan Dela Cruz"
          registerKey="owner_name"
          optional
          error={errors.owner_name?.message}
        />
        <Field
          label="Stall number"
          id="stall_number"
          placeholder="e.g. Stall A-12"
          registerKey="stall_number"
          optional
          error={errors.stall_number?.message}
        />
        <Field
          label="Contact number"
          id="contact_number"
          placeholder="e.g. 09123456789"
          registerKey="contact_number"
          error={errors.contact_number?.message}
        />

        {/* Read-only market */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Market</label>
          <div className="flex items-center gap-2 h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-500 flex-1">{marketName}</span>
          </div>
          <p className="text-xs text-gray-400">Market assignment can only be changed by an administrator.</p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-black text-sm"
        >
          {isSubmitting ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </div>
  )
}
