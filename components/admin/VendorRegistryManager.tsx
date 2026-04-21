'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  MoreVertical, 
  Store, 
  User, 
  MapPin, 
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Vendor {
  id: string
  business_name: string
  owner_name: string
  stall_number: string
  contact_number: string
  is_approved: boolean
  is_active: boolean
  created_at: string
  market_name: string
}

export default function VendorRegistryManager() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          markets (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedVendors = data.map((v: any) => ({
        ...v,
        market_name: v.markets?.name || 'N/A'
      }))

      setVendors(formattedVendors)
    } catch (error: any) {
      console.error('Error fetching vendors:', error.message)
      toast.error('Failed to load vendor registry')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleApproval = async (vendorId: string, currentStatus: boolean) => {
    setActionLoading(vendorId)
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_approved: !currentStatus })
        .eq('id', vendorId)

      if (error) throw error

      setVendors(prev => prev.map(v => 
        v.id === vendorId ? { ...v, is_approved: !currentStatus } : v
      ))
      
      toast.success(currentStatus ? 'Vendor approval revoked' : 'Vendor approved successfully')
    } catch (error: any) {
      console.error('Error updating vendor:', error.message)
      toast.error('Failed to update vendor status')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = 
      v.business_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.stall_number.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'pending' && !v.is_approved) || 
      (filterStatus === 'approved' && v.is_approved)

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2 italic serif">
            Vendor <span className="text-green-700 underline decoration-green-100 underline-offset-8">Registry</span>
          </h1>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-[0.2em] px-1">
            Manage Stall Approvals & Status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-10 px-4 rounded-xl border-gray-100 bg-white/50 dark:bg-white/5 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-gray-500">
            {vendors.length} Total Vendors
          </Badge>
          <Badge variant="outline" className="h-10 px-4 rounded-xl border-green-100 bg-green-50/50 dark:bg-green-500/5 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-green-700">
            {vendors.filter(v => !v.is_approved).length} Pending
          </Badge>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-[2rem] p-4 lg:p-6 shadow-xl shadow-gray-100/50 dark:shadow-none flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-green-700 transition-colors" />
          <Input 
            placeholder="Search business name, owner, or stall..."
            className="h-14 pl-14 pr-6 rounded-2xl bg-gray-50/50 dark:bg-white/[0.03] border-none focus-visible:ring-2 focus-visible:ring-green-700/20 text-sm font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          {(['all', 'pending', 'approved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterStatus === status 
                ? 'bg-green-700 text-white shadow-lg shadow-green-700/20' 
                : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Registry Table */}
      <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-2xl shadow-gray-200/40 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Business & Owner</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Location</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Joined</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-10 h-24">
                      <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-2/3"></div>
                    </td>
                  </tr>
                ))
              ) : filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-700 shrink-0 shadow-inner">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 dark:text-white text-sm tracking-tight mb-0.5">{vendor.business_name}</p>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <User className="w-3 h-3" />
                            <p className="text-[11px] font-bold uppercase tracking-wider">{vendor.owner_name}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-0.5 capitalize">{vendor.market_name}</p>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <MapPin className="w-3 h-3" />
                        <p className="text-[11px] font-bold uppercase tracking-wider">Stall #{vendor.stall_number}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {vendor.is_approved ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-500/10 px-3 py-1.5 rounded-full w-fit">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-full w-fit">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(vendor.created_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Button
                        onClick={() => handleToggleApproval(vendor.id, vendor.is_approved)}
                        disabled={actionLoading === vendor.id}
                        className={`h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                          vendor.is_approved 
                          ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-none' 
                          : 'bg-green-700 hover:bg-green-800 text-white shadow-lg shadow-green-700/20'
                        }`}
                      >
                        {actionLoading === vendor.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : vendor.is_approved ? 'Revoke Approval' : 'Approve Stall'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Store className="w-12 h-12 text-gray-400" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">No vendors found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-8 py-4 opacity-30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-700" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Secure Database Access</span>
        </div>
        <div className="w-1 h-1 bg-gray-300 rounded-full" />
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Real-time Sync</span>
        </div>
      </div>
    </div>
  )
}
