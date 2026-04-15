'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'

import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  Search,
  MessageCircle,
  LogOut,
  User as UserIcon,
  ShoppingBasket,
  Store,
  Bell,
  Check,
  ChevronDown,
  Settings,
  Moon,
  Sun,
  Activity
} from 'lucide-react'


import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { setUserOnlineStatus } from '@/lib/actions/messenger'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { ThemeToggle } from './ThemeToggle'
import CanvassSheet from '../public/CanvassSheet'
import VendorAccountDropdown from '../vendor/VendorAccountDropdown'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navLinks = [
  { name: 'Market Prices', href: '/' },
  { name: 'Vendors', href: '/markets' },
  { name: 'Price Compare', href: '/compare' },
  { name: 'About Us', href: '/about' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  
  // -- State Management --
  const [unreadCount, setUnreadCount] = useState(0) // Tracks notification counts for messages
  const [canvassCount, setCanvassCount] = useState(0) // Tracks items in the buyer's canvass list
  const [user, setUser] = useState<any>(null) // Current auth user from Supabase
  const [userType, setUserType] = useState<'buyer' | 'vendor' | 'admin' | null>(null) // Role-based type
  const [profile, setProfile] = useState<any>(null) // Detailed profile data from respective tables
  const [isCanvassOpen, setIsCanvassOpen] = useState(false) // Toggle for the canvass side sheet
  const [loading, setLoading] = useState(true) // Initial identity resolution loading state
  const [isActive, setIsActive] = useState(false) // Online/Offline status for buyers
  const [isTogglingActive, setIsTogglingActive] = useState(false) // Loading state during status update
  const { theme, setTheme } = useTheme()

  const supabase = createClient()

  // Handle active status toggle - connect to database
  /**
   * Toggles the buyer's online status in the database.
   * Persists the choice to localStorage for cross-session consistency.
   */
  const handleActiveStatusToggle = async (newStatus: boolean) => {
    if (!user) return
    setIsTogglingActive(true)
    try {
      await setUserOnlineStatus(user.id, 'buyer', newStatus)
      setIsActive(newStatus)
      // Store in localStorage for persistence
      localStorage.setItem('bcmis_buyer_active', newStatus ? 'true' : 'false')
    } catch (err) {
      console.error('Error updating online status:', err)
    } finally {
      setIsTogglingActive(false)
    }
  }

  /**
   * Cleanup effect to mark user offline if the browser tab is closed.
   * Uses navigator.sendBeacon for reliable execution during unload.
   */
  useEffect(() => {
    if (userType !== 'buyer' || !user) return

    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/set-offline', JSON.stringify({
        userId: user.id,
        type: 'buyer'
      }))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [user, userType])

  /**
   * Fetches counts for unread messages and canvass items.
   * Automatically creates a default canvass list for new buyers.
   */
  const fetchStats = useCallback(async (resolvedId: string, type: 'buyer' | 'vendor' | 'admin') => {
    if (!resolvedId) return

    if (type === 'buyer') {
      // Unread messages - buyer_id in conversations is the profile ID
      const { data: convs } = await supabase
        .from('conversations')
        .select('buyer_unread_count')
        .eq('buyer_id', resolvedId)

      const unread = convs?.reduce((acc, c) => acc + (c.buyer_unread_count || 0), 0) || 0
      setUnreadCount(unread)

      // Canvass items - buyer_id in canvass_lists is the profile ID
      let { data: list } = await supabase
        .from('canvass_lists')
        .select('id')
        .eq('buyer_id', resolvedId)
        .maybeSingle()

      if (!list) {
        // Try creating one if it doesn't exist
        const { data: newList } = await supabase
          .from('canvass_lists')
          .insert({ buyer_id: resolvedId, name: 'My Canvass List' })
          .select('id')
          .maybeSingle()
        list = newList
      }

      if (list) {
        const { count } = await supabase
          .from('canvass_items')
          .select('*', { count: 'exact', head: true })
          .eq('canvass_list_id', list.id)
        setCanvassCount(count || 0)
      }
    } else if (type === 'vendor') {
      const { data: convs } = await supabase
        .from('conversations')
        .select('vendor_unread_count')
        .eq('vendor_id', resolvedId)

      const unread = convs?.reduce((acc, c) => acc + (c.vendor_unread_count || 0), 0) || 0
      setUnreadCount(unread)
    }
  }, [supabase])


  /**
   * Multi-table identity resolution flow.
   * Sequentially checks roles (Vendor -> Buyer -> Profile/Admin)
   * to determine navigation options and UI context.
   */
  const identifyUser = useCallback(async (userId: string) => {
    if (!userId) {
      setLoading(false)
      return
    }

    // 1. Try to identify as Vendor first
    const { data: vProfile } = await supabase
      .from('vendors')
      .select('*, markets(id, name)')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (vProfile) {
      setUserType('vendor')
      setProfile(vProfile)
      fetchStats(vProfile.id, 'vendor')
      setLoading(false)
      return
    }

    // 2. Try to identify as Buyer
    const { data: bProfile } = await supabase
      .from('buyer_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (bProfile) {
      setUserType('buyer')
      setProfile(bProfile)
      fetchStats(bProfile.id, 'buyer')
      
      // Load active status
      const savedStatus = localStorage.getItem('bcmis_buyer_active')
      if (savedStatus !== null) {
        setIsActive(savedStatus === 'true')
      } else {
        const isOnline = (bProfile as any).is_online
        if (isOnline !== undefined) {
          setIsActive(isOnline)
          localStorage.setItem('bcmis_buyer_active', isOnline ? 'true' : 'false')
        }
      }
      setLoading(false)
      return
    }

    // 3. Fallback to profiles (for admins or untyped users)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', userId)
      .maybeSingle()

    if (profileData?.role === 'admin') {
      setUserType('admin')
      setProfile(profileData)
      fetchStats(userId, 'admin')
    } else {
      setUserType('buyer') // Safe default
    }
    
    setLoading(false)
  }, [supabase, fetchStats])

  useEffect(() => {
    const handleOpenCanvass = () => setIsCanvassOpen(true)
    window.addEventListener('open-canvass', handleOpenCanvass)

    // Re-fetch canvass count badge when any component adds/removes an item
    const handleCanvassUpdated = () => {
      if (profile?.id && userType === 'buyer') {
        fetchStats(profile.id, 'buyer')
      }
    }
    window.addEventListener('canvass:updated', handleCanvassUpdated)

    return () => {
      window.removeEventListener('open-canvass', handleOpenCanvass)
      window.removeEventListener('canvass:updated', handleCanvassUpdated)
    }
  }, [profile, userType, fetchStats])

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        identifyUser(user.id)
      } else {
        setLoading(false)
      }
    }
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        identifyUser(session.user.id)
      } else {
        setUserType(null)
        setProfile(null)
        setUnreadCount(0)
        setCanvassCount(0)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, identifyUser])

  // Realtime subscription for unread messages and canvass updates
  useEffect(() => {
    if (!profile?.id || !userType) return

    const channel = supabase
      .channel('navbar_stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: userType === 'buyer' ? `buyer_id=eq.${profile.user_id}` : `vendor_id=eq.${profile.id}`
      }, () => {
        // Re-fetch counts when conversations change
        fetchStats(profile.id, userType)
      })
      .subscribe()

    // Also listen for message inserts to be safe
    const msgChannel = supabase
      .channel('navbar_msgs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchStats(profile.id, userType)
      })
      .subscribe()

    // Canvass updates real-time
    let canvassChannel: any = null
    if (userType === 'buyer') {
      canvassChannel = supabase
        .channel('navbar_canvass')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'canvass_items',
          filter: `buyer_id=eq.${profile.id}`
        }, () => {
          fetchStats(profile.id, 'buyer')
        })
        .subscribe()
    }

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(msgChannel)
      if (canvassChannel) supabase.removeChannel(canvassChannel)
    }
  }, [profile?.id, profile?.user_id, userType, supabase, fetchStats])


  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  if (pathname.startsWith('/vendor') || pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <>
      <header className="sticky top-0 z-50 h-20 bg-white/95 dark:bg-[#050a05]/95 backdrop-blur-3xl border-b border-gray-100 dark:border-white/5 shadow-sm dark:shadow-[0_0_30px_rgba(27,107,62,0.15)] transition-all duration-500">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8 relative">
          {/* Brand Name */}
          <Link 
            href={userType === 'vendor' ? '/vendor/dashboard' : '/'} 
            className="font-serif text-2xl font-black text-[#1b6b3e] dark:text-green-500 tracking-tight shrink-0 italic hover:opacity-80 transition-opacity"
          >
            Butuan City Market
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-10 lg:flex absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              const isActiveLink = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'text-[10px] font-black transition-all duration-300 uppercase tracking-[0.2em]',
                    isActiveLink 
                      ? 'text-[#1b6b3e] dark:text-green-500 translate-y-[-2px]' 
                      : 'text-gray-400 dark:text-gray-500 hover:text-[#1b6b3e] dark:hover:text-green-500'
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-8 lg:flex shrink-0">
            {userType === 'buyer' && profile ? (
              <div className="flex items-center gap-6">
                {/* Messages Icon */}
                <div 
                  className="relative cursor-pointer group p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all" 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                >
                  <MessageCircle className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#050a05] shadow-lg shadow-red-900/20 px-1">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* Canvass Icon */}
                <div 
                  className="relative cursor-pointer group p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all" 
                  onClick={() => setIsCanvassOpen(true)}
                >
                  <ShoppingBasket className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors" />
                  {canvassCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-700 dark:bg-green-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#050a05] shadow-lg shadow-green-900/20">
                      {canvassCount}
                    </span>
                  )}
                </div>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer group pl-4 border-l border-gray-100 dark:border-white/10">
                      <div className="w-10 h-10 rounded-2xl bg-[#1b6b3e] dark:bg-green-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-green-900/20 active:scale-95 transition-all group-hover:rotate-3">
                        {getInitials(profile.full_name)}
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-300 dark:text-gray-600 transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-2 rounded-[2rem] border-gray-100 dark:border-white/10 bg-white dark:bg-[#0a0f0a] backdrop-blur-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(27,107,62,0.2)] mt-4" align="end">
                    <DropdownMenuLabel className="p-4 bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5 mb-2">
                      <p className="text-xs font-black text-gray-900 dark:text-white leading-none mb-1">{profile.full_name}</p>
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] truncate mb-2">{user.email}</p>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20">
                        <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-black text-green-700 dark:text-green-500 uppercase tracking-widest">Verified Buyer</span>
                      </div>
                    </DropdownMenuLabel>

                    <div className="space-y-1">
                      <Link href="/user/profile">
                        <DropdownMenuItem className="rounded-xl h-11 px-3 cursor-pointer group hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors">
                          <UserIcon className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500 group-hover:text-[#1b6b3e] dark:group-hover:text-green-500 transition-colors" />
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Profile Settings</span>
                        </DropdownMenuItem>
                      </Link>
                      
                      <DropdownMenuSeparator className="my-2 bg-gray-50 dark:bg-white/5" />
                      
                      {/* Sub-items for dark mode status */}
                      <DropdownMenuItem 
                        className="rounded-xl h-11 px-3 cursor-pointer group flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center">
                          <Activity className={cn("w-4 h-4 mr-3 transition-colors", isActive ? "text-green-500" : "text-gray-400 dark:text-gray-600")} />
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Active Status</span>
                        </div>
                        <div 
                          onClick={() => !isTogglingActive && handleActiveStatusToggle(!isActive)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-all relative border cursor-pointer shadow-inner",
                            isActive ? "bg-green-600 border-green-700" : "bg-gray-200 dark:bg-white/5 border-gray-300 dark:border-white/10",
                            isTogglingActive && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all shadow-sm",
                            isActive ? "right-0.5" : "left-0.5"
                          )} />
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        className="rounded-xl h-11 px-3 cursor-pointer group flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        onSelect={(e) => {
                          e.preventDefault()
                          setTheme(theme === 'dark' ? 'light' : 'dark')
                        }}
                      >
                        <div className="flex items-center">
                          {theme === 'dark' ? (
                            <Moon className="w-4 h-4 mr-3 text-amber-500" />
                          ) : (
                            <Sun className="w-4 h-4 mr-3 text-indigo-500" />
                          )}
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                        </div>
                        <div 
                          className={cn(
                            "w-8 h-4 rounded-full transition-all relative border cursor-pointer shadow-inner",
                            theme === 'dark' ? "bg-[#1b6b3e] border-[#1b6b3e]" : "bg-gray-200 dark:bg-white/5 border-gray-300 dark:border-white/10"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all shadow-sm",
                            theme === 'dark' ? "right-0.5" : "left-0.5"
                          )} />
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-2 bg-gray-50 dark:bg-white/5" />

                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="rounded-xl h-11 px-3 cursor-pointer group focus:bg-red-50 dark:focus:bg-red-950/20 text-red-600 dark:text-red-500 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : userType === 'vendor' ? (
              <div className="flex items-center gap-6">
                {/* Vendor Dashboard Link */}
                <Link 
                  href="/vendor/dashboard" 
                  className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all group cursor-pointer"
                  title="Vendor Dashboard"
                >
                  <Store className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors" />
                </Link>

                <VendorAccountDropdown 
                  vendor={profile} 
                  trigger={
                    <div className="flex items-center gap-3 group pl-4 border-l border-gray-100 dark:border-white/10 cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-[#1b6b3e] dark:bg-green-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-green-900/10 active:scale-95 transition-all group-hover:rotate-3 overflow-hidden relative">
                        {profile?.avatar_url ? (
                          <NextImage src={profile.avatar_url} alt="Profile" fill className="object-cover" />
                        ) : (
                          getInitials(profile?.owner_name || 'Vendor')
                        )}
                      </div>
                    </div>
                  }
                />

              </div>
            ) : !loading && (
              <div className="flex items-center gap-3">
                <Button asChild variant="ghost" className="h-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-[#1b6b3e] dark:hover:text-green-500 hover:bg-[#1b6b3e]/5 dark:hover:bg-green-500/10 transition-all">
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="h-11 px-8 rounded-2xl bg-[#1b6b3e] dark:bg-[#1b6b3e] hover:bg-[#155430] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/10 transition-all active:scale-95">
                  <Link href="/register">
                    Join Network
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <Menu className="w-5 h-5 text-[#1b6b3e] dark:text-green-500" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] sm:w-80 border-none bg-white dark:bg-[#050a05] p-0">
                <VisuallyHidden.Root>
                  <SheetTitle>Mobile Menu</SheetTitle>
                  <SheetDescription>Main navigation links for Butuan City Market.</SheetDescription>
                </VisuallyHidden.Root>
                <div className="p-8 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 rounded-xl bg-[#1b6b3e] flex items-center justify-center shadow-lg shadow-green-900/20">
                      <ShoppingBasket className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-serif text-xl font-black text-[#1b6b3e] italic">Butuan Market</span>
                  </div>

                  <nav className="flex flex-col gap-4 flex-1">
                    {navLinks.map(link => (
                      <Link 
                        key={link.name} 
                        href={link.href} 
                        className={cn(
                          "flex items-center justify-between py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                          pathname === link.href 
                            ? "bg-green-50 dark:bg-green-500/10 text-[#1b6b3e] dark:text-green-500" 
                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-auto pt-8 border-t border-gray-100 dark:border-white/5">
                    {!user ? (
                      <div className="flex flex-col gap-3">
                        <Button asChild variant="outline" className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest border-gray-100 dark:border-white/10 dark:text-white">
                          <Link href="/login" className="w-full">
                            Sign In
                          </Link>
                        </Button>
                        <Button asChild className="w-full h-14 rounded-2xl bg-[#1b6b3e] text-white text-xs font-black uppercase tracking-widest">
                          <Link href="/register" className="w-full">
                            Join Network
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <Button asChild className="w-full h-14 rounded-2xl bg-[#1b6b3e] text-white text-xs font-black uppercase tracking-widest">
                          <Link href={userType === 'vendor' ? '/vendor/dashboard' : '/user/profile'} className="w-full">
                            Dashboard
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={handleLogout} 
                          className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Canvass Sheet */}
      {!loading && user && userType === 'buyer' && (
        <CanvassSheet open={isCanvassOpen} onOpenChange={setIsCanvassOpen} />
      )}
    </>
  )
}
