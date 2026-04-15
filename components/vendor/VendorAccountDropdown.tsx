'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Store, LogOut, Moon, Sun, Activity } from 'lucide-react'
import NextImage from 'next/image'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { updateVendorProfile } from '@/lib/actions/vendor'
import { setUserOnlineStatus } from '@/lib/actions/messenger'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface VendorAccountDropdownProps {
  vendor: {
    id: string;
    business_name: string;
    is_active: boolean;
    owner_name?: string | null;
    avatar_url?: string;
  };
  trigger?: React.ReactNode;
}




export default function VendorAccountDropdown({ vendor, trigger }: VendorAccountDropdownProps) {

  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [isActive, setIsActive] = useState(vendor.is_active)
  const [isOnline, setIsOnline] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [, startTransition] = useTransition()
  const [isTogglingOnline, setIsTogglingOnline] = useState(false)

  // Initialize user and fetch online status
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('is_online')
          .eq('user_id', user.id)
          .single()
        
        if (vendorData) {
          setIsOnline(vendorData.is_online)
          localStorage.setItem('bcmis_vendor_online', vendorData.is_online ? 'true' : 'false')
        }
      }
    }
    init()
  }, [supabase])

  // Setup beforeunload listener for automatic offline detection
  useEffect(() => {
    if (!user) return

    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/set-offline', JSON.stringify({
        userId: user.id,
        type: 'vendor'
      }))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const toggleActiveStatus = async (e: React.MouseEvent) => {
    e.preventDefault()
    const newStatus = !isActive
    setIsActive(newStatus)
    startTransition(async () => {
      await updateVendorProfile(vendor.id, { is_active: newStatus })
    })
  }

  const handleOnlineStatusToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) return
    setIsTogglingOnline(true)
    try {
      const newStatus = !isOnline
      await setUserOnlineStatus(user.id, 'vendor', newStatus)
      setIsOnline(newStatus)
      localStorage.setItem('bcmis_vendor_online', newStatus ? 'true' : 'false')
    } catch (err) {
      console.error('Error updating online status:', err)
    } finally {
      setIsTogglingOnline(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ? (
          <button className="focus:outline-none">
            {trigger}
          </button>
        ) : (
          <button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none">
            <div className="relative">
              <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-green-100 dark:ring-green-900/40 shadow-xl relative bg-[#1b6b3e] flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                {vendor.avatar_url ? (
                  <NextImage src={vendor.avatar_url} alt="Profile" fill className="object-cover" />
                ) : (
                  <span className="text-sm font-black text-white uppercase tracking-tighter">
                      {((vendor.owner_name || vendor.business_name).split(' ').map(n => n[0]).join('').slice(0, 2))}
                  </span>
                )}
              </div>
              <div className={cn(
                "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0a0f0a]",
                isActive ? "bg-green-500" : "bg-gray-400"
              )} />
            </div>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 rounded-[2rem] p-3 shadow-2xl dark:shadow-[0_0_50px_rgba(27,107,62,0.2)] border-gray-100 dark:border-white/10 dark:bg-[#0a0f0a]">
        <DropdownMenuLabel className="px-3 py-4">
          <div className="flex flex-col space-y-1">
            <p className="text-lg font-black text-gray-900 dark:text-white leading-tight font-serif italic tracking-tight">{vendor.business_name}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1b6b3e] dark:text-green-500 opacity-60">Store Status</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-50 dark:bg-white/5" />

        {/* Market Status (is_active) */}
        <DropdownMenuItem
          className="flex items-center justify-between cursor-pointer py-4 px-4 rounded-2xl focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
          onClick={toggleActiveStatus}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
            <span className="text-sm font-black uppercase tracking-widest text-[11px] text-gray-700 dark:text-gray-300">Market Status</span>
          </div>
          <div className={cn(
            "relative w-12 h-6 rounded-full transition-all duration-300 shadow-inner",
            isActive ? "bg-[#1b6b3e] shadow-green-900/20" : "bg-gray-200 dark:bg-gray-800"
          )}>
            <div className={cn(
              "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
              isActive ? "translate-x-6" : ""
            )} />
          </div>
        </DropdownMenuItem>

        {/* Online Status (is_online) */}
        <DropdownMenuItem
          className="flex items-center justify-between cursor-pointer py-4 px-4 rounded-2xl focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
          onClick={handleOnlineStatusToggle}
        >
          <div className="flex items-center gap-3">
            <Activity className={cn("w-4 h-4 transition-colors", isOnline ? "text-green-500" : "text-gray-300")} />
            <span className="text-sm font-black uppercase tracking-widest text-[11px] text-gray-700 dark:text-gray-300">Online Status</span>
          </div>
          <div className={cn(
            "relative w-12 h-6 rounded-full transition-all duration-300 shadow-inner cursor-pointer",
            isOnline ? "bg-[#1b6b3e] shadow-green-900/20" : "bg-gray-200 dark:bg-gray-800",
            isTogglingOnline && "opacity-50"
          )}>
            <div className={cn(
              "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
              isOnline ? "translate-x-6" : ""
            )} />
          </div>
        </DropdownMenuItem>

        {/* My Stall Link */}
        <DropdownMenuItem
          className="flex items-center gap-4 cursor-pointer py-4 px-4 rounded-2xl focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
          onClick={() => router.push(`/stalls/${vendor.id}`)}
        >
          <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
            <Store className="w-4 h-4 text-[#1b6b3e] dark:text-green-500" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-[11px] text-gray-700 dark:text-gray-300">Public Stall</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-50 dark:bg-white/5" />

        {/* Theme Toggle */}
        <DropdownMenuItem
          className="flex items-center gap-4 cursor-pointer py-4 px-4 rounded-2xl focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            setTheme(theme === 'dark' ? 'light' : 'dark')
          }}
        >
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
            theme === 'dark' ? "bg-amber-500/10" : "bg-indigo-50"
          )}>
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-[11px] text-gray-700 dark:text-gray-300">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-50 dark:bg-white/5" />

        {/* Sign Out */}
        <DropdownMenuItem
          className="flex items-center gap-4 cursor-pointer py-4 px-4 rounded-2xl focus:bg-red-50 dark:focus:bg-red-500/10 text-red-600 focus:text-red-700 transition-colors"
          onClick={handleSignOut}
        >
          <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-[11px]">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
