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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [canvassCount, setCanvassCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [userType, setUserType] = useState<'buyer' | 'vendor' | 'admin' | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isCanvassOpen, setIsCanvassOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [isTogglingActive, setIsTogglingActive] = useState(false)
  const { theme, setTheme } = useTheme()

  const supabase = createClient()

  // Handle active status toggle - connect to database
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

  // Setup beforeunload listener for automatic offline detection
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

  const fetchStats = useCallback(async (userId: string, type: 'buyer' | 'vendor' | 'admin') => {
    if (type === 'buyer') {
      // Unread messages
      const { data: convs } = await supabase
        .from('conversations')
        .select('buyer_unread_count')
        .eq('buyer_id', userId)

      const unread = convs?.reduce((acc, c) => acc + (c.buyer_unread_count || 0), 0) || 0
      setUnreadCount(unread)

      // Canvass items
      const { data: list } = await supabase
        .from('canvass_lists')
        .select('id')
        .eq('buyer_id', userId)
        .single()

      if (list) {
        const { count } = await supabase
          .from('canvass_items')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id)
        setCanvassCount(count || 0)
      }
    } else if (type === 'vendor') {
      const { data: convs } = await supabase
        .from('conversations')
        .select('vendor_unread_count')
        .filter('vendor_id', 'in', `(select id from vendors where user_id = '${userId}')`)

      const unread = convs?.reduce((acc, c) => acc + (c.vendor_unread_count || 0), 0) || 0
      setUnreadCount(unread)
    }
  }, [supabase])

  const identifyUser = useCallback(async (userId: string) => {
    // Parallel queries to check user type
    const [buyerRes, vendorRes, adminRes] = await Promise.all([
      supabase.from('buyer_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('vendors').select('*').eq('user_id', userId).single(),
      supabase.from('admin_users').select('*').eq('user_id', userId).single()
    ])

    if (adminRes.data) {
      setUserType('admin')
      setProfile(adminRes.data)
      fetchStats(userId, 'admin')
    } else if (vendorRes.data) {
      setUserType('vendor')
      setProfile(vendorRes.data)
      fetchStats(userId, 'vendor')
    } else if (buyerRes.data) {
      setUserType('buyer')
      setProfile(buyerRes.data)
      fetchStats(userId, 'buyer')
      
      // Load active status from localStorage or database
      const savedStatus = localStorage.getItem('bcmis_buyer_active')
      if (savedStatus !== null) {
        setIsActive(savedStatus === 'true')
      } else if (buyerRes.data.is_online !== undefined) {
        setIsActive(buyerRes.data.is_online)
        localStorage.setItem('bcmis_buyer_active', buyerRes.data.is_online ? 'true' : 'false')
      }
    }
    setLoading(false)
  }, [supabase, fetchStats])

  useEffect(() => {
    const handleOpenCanvass = () => setIsCanvassOpen(true)
    window.addEventListener('open-canvass', handleOpenCanvass)
    return () => window.removeEventListener('open-canvass', handleOpenCanvass)
  }, [])

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
          <Link href="/" className="font-serif text-2xl font-black text-[#1b6b3e] dark:text-green-500 tracking-tight shrink-0 italic hover:opacity-80 transition-opacity">
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
                        <span className="text-[8px] font-black text-green-700 dark:text-green-500 uppercase tracking-widest">Buyer Node</span>
                      </div>
                    </DropdownMenuLabel>

                    <div className="space-y-1">
                      <Link href="/user/profile">
                        <DropdownMenuItem className="rounded-xl h-11 px-3 cursor-pointer group hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors">
                          <UserIcon className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500 group-hover:text-[#1b6b3e] dark:group-hover:text-green-500 transition-colors" />
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Personal Control</span>
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
                <Link href="/login">
                  <Button variant="ghost" className="h-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-[#1b6b3e] dark:hover:text-green-500 hover:bg-[#1b6b3e]/5 dark:hover:bg-green-500/10 transition-all">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="h-11 px-8 rounded-2xl bg-[#1b6b3e] dark:bg-[#1b6b3e] hover:bg-[#155430] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/10 transition-all active:scale-95">
                    Join Network
                  </Button>
                </Link>
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
                <VisuallyHidden.Root><SheetTitle>Mobile Menu</SheetTitle></VisuallyHidden.Root>
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
                        <Link href="/login" className="w-full">
                          <Button variant="outline" className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest border-gray-100 dark:border-white/10 dark:text-white">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/register" className="w-full">
                          <Button className="w-full h-14 rounded-2xl bg-[#1b6b3e] text-white text-xs font-black uppercase tracking-widest">
                            Join Network
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <Link href={userType === 'vendor' ? '/vendor/dashboard' : '/user/profile'} className="w-full">
                          <Button className="w-full h-14 rounded-2xl bg-[#1b6b3e] text-white text-xs font-black uppercase tracking-widest">
                            Command Center
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          onClick={handleLogout} 
                          className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Terminate Session
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
      <CanvassSheet open={isCanvassOpen} onOpenChange={setIsCanvassOpen} />
    </>
  )
}
