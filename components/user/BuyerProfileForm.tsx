'use client'
 
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  User, 
  Phone, 
  MapPin, 
  Save, 
  Loader2,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
 
interface BuyerProfileFormProps {
  userId: string
  initialData: {
    full_name: string
    contact_number: string
    barangay: string
  }
}
 
export default function BuyerProfileForm({ userId, initialData }: BuyerProfileFormProps) {
  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
 
    try {
      const { error } = await supabase
        .from('buyer_profiles')
        .upsert({
          user_id: userId,
          ...formData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
 
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Update profile error:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8">
         <div className="bg-white p-12 rounded-[3.5rem] border border-gray-50 shadow-2xl shadow-green-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-50/30 rounded-full blur-3xl -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="flex items-center gap-6 mb-12">
               <div className="w-16 h-16 bg-[#1b6b3e] rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-green-900/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <User className="w-8 h-8 text-white" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-gray-900 leading-none mb-1 tracking-tight">Personal Details</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1b6b3e] opacity-50">Identity & Communication</p>
               </div>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-2">Full Name</label>
                  <div className="relative group/input">
                     <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/input:text-[#1b6b3e] transition-colors" />
                     <Input
                        value={formData.full_name}
                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                        className="h-16 pl-14 pr-6 rounded-[1.5rem] border-gray-100 bg-gray-50/50 group-hover/input:bg-white focus:bg-white focus:ring-[#1b6b3e]/10 focus:border-[#1b6b3e]/30 transition-all font-black text-gray-900 placeholder:text-gray-300"
                        placeholder="Juana Dela Cruz"
                        required
                     />
                  </div>
               </div>
 
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-2">Phone Number</label>
                  <div className="relative group/input">
                     <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/input:text-[#1b6b3e] transition-colors" />
                     <Input
                        value={formData.contact_number}
                        onChange={e => setFormData({...formData, contact_number: e.target.value})}
                        className="h-16 pl-14 pr-6 rounded-[1.5rem] border-gray-100 bg-gray-50/50 group-hover/input:bg-white focus:bg-white focus:ring-[#1b6b3e]/10 focus:border-[#1b6b3e]/30 transition-all font-black text-gray-900 placeholder:text-gray-300"
                        placeholder="0912 345 6789"
                     />
                  </div>
               </div>
 
               <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-2">Barangay / Location</label>
                  <div className="relative group/input">
                     <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/input:text-[#1b6b3e] transition-colors" />
                     <Input
                        value={formData.barangay}
                        onChange={e => setFormData({...formData, barangay: e.target.value})}
                        className="h-16 pl-14 pr-6 rounded-[1.5rem] border-gray-100 bg-gray-50/50 group-hover/input:bg-white focus:bg-white focus:ring-[#1b6b3e]/10 focus:border-[#1b6b3e]/30 transition-all font-black text-gray-900 placeholder:text-gray-300 uppercase"
                        placeholder="E.g. Libertad, Butuan City"
                     />
                  </div>
               </div>
            </div>
         </div>
      </div>
 
      <div className="flex items-center justify-end">
         <Button 
            type="submit" 
            disabled={loading}
            className={cn(
               "h-16 px-12 rounded-[1.5rem] transition-all active:scale-95 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest",
               saved 
                 ? "bg-green-600 hover:bg-green-700 text-white shadow-2xl shadow-green-900/40" 
                 : "bg-gray-900 hover:bg-black text-white shadow-2xl shadow-gray-900/20"
            )}
         >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
               saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />
            )}
            {saved ? 'Changes Saved' : (loading ? 'Processing...' : 'Save Profile Details')}
         </Button>
      </div>
    </form>
  )
}
