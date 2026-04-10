'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
      <header className="sticky top-0 z-50 h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8 relative">
          {/* Brand Name */}
          <Link href="/" className="font-serif text-2xl font-black text-[#1b6b3e] tracking-tight shrink-0">
            Butuan City Market
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-10 lg:flex absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'text-sm font-black transition-all duration-300 uppercase tracking-widest',
                  pathname === link.href ? 'text-[#1b6b3e] translate-y-[-2px]' : 'text-gray-400 hover:text-[#1b6b3e]'
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-8 lg:flex shrink-0">
            {userType === 'buyer' && profile ? (
              <div className="flex items-center gap-6">
                {/* Canvass Icon */}
                <div className="relative cursor-pointer group" onClick={() => setIsCanvassOpen(true)}>
                  <ShoppingBasket className="w-5 h-5 text-gray-400 group-hover:text-green-700 transition-colors" />
                  {canvassCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 min-w-[18px] bg-green-700 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {canvassCount}
                    </span>
                  )}
                </div>



                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer group">
                      <div className="w-9 h-9 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-green-900/10 active:scale-95 transition-all">
                        {getInitials(profile.full_name)}
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-700" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-0 rounded-2xl border-gray-100 shadow-2xl overflow-hidden mt-2" align="end">
                    <div className="p-5 bg-gray-50/50 border-b border-gray-100">
                      <p className="text-sm font-black text-gray-900 leading-none mb-1">{profile.full_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate mb-3">{user.email}</p>
                      <Badge className="bg-green-100 text-green-700 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                        Buyer Account
                      </Badge>
                    </div>
                    <div className="p-2 space-y-1">
                      <DropdownMenuLabel className="px-3 pt-3 pb-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">Profile</DropdownMenuLabel>
                      <Link href="/user/profile">
                        <DropdownMenuItem className="rounded-xl h-11 px-3 cursor-pointer group">
                          <UserIcon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-green-700 transition-colors" />
                          <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">My Account</span>
                        </DropdownMenuItem>
                      </Link>

                      <DropdownMenuSeparator className="my-2 bg-gray-50" />
                      <DropdownMenuLabel className="px-3 pt-1 pb-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">Settings</DropdownMenuLabel>
                      
                      <DropdownMenuItem 
                        className="rounded-xl h-11 px-3 cursor-pointer group flex items-center justify-between"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center">
                          <Activity className={cn("w-4 h-4 mr-3 transition-colors", isActive ? "text-green-500" : "text-gray-300")} />
                          <span className="text-xs font-bold text-gray-600">Active Status</span>
                        </div>
                        <div 
                          onClick={() => !isTogglingActive && handleActiveStatusToggle(!isActive)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-all relative border cursor-pointer",
                            isActive ? "bg-green-500 border-green-600" : "bg-gray-200 border-gray-300",
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
                        className="rounded-xl h-11 px-3 cursor-pointer group flex items-center justify-between"
                        onSelect={(e) => {
                          e.preventDefault()
                          setTheme(theme === 'dark' ? 'light' : 'dark')
                        }}
                      >
                        <div className="flex items-center">
                          {theme === 'dark' ? (
                            <Moon className="w-4 h-4 mr-3 text-blue-400" />
                          ) : (
                            <Sun className="w-4 h-4 mr-3 text-orange-400" />
                          )}
                          <span className="text-xs font-bold text-gray-600">Dark Mode</span>
                        </div>
                        <div 
                          className={cn(
                            "w-8 h-4 rounded-full transition-all relative border",
                            theme === 'dark' ? "bg-indigo-600 border-indigo-700" : "bg-gray-200 border-gray-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all shadow-sm",
                            theme === 'dark' ? "right-0.5" : "left-0.5"
                          )} />
                        </div>
                      </DropdownMenuItem>
                    </div>

                    <div className="p-2">
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="rounded-xl h-11 px-3 cursor-pointer group focus:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-3 text-red-400" />
                        <span className="text-xs font-bold text-red-600">Sign Out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : userType === 'vendor' ? (
              <div className="flex items-center gap-6">
                {/* Market Symbol (Dashboard) */}
                <Link href="/vendor/dashboard" className="relative group" title="Vendor Dashboard">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:bg-white group-hover:shadow-xl transition-all duration-300">
                    <Store className="w-5 h-5 text-gray-400 group-hover:text-[#1b6b3e] transition-colors" />
                  </div>
                </Link>

                {/* User Profile */}
                <Link href="/vendor/profile" className="flex items-center gap-2 group" title="My Profile">
                  <div className="w-9 h-9 rounded-full bg-[#1b6b3e] text-white flex items-center justify-center text-xs font-black shadow-lg shadow-green-900/10 active:scale-95 transition-all">
                    {getInitials(profile?.owner_name || 'Vendor')}
                  </div>
                </Link>

                {/* Logout Button */}
                <button 
                  onClick={handleLogout} 
                  className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 hover:bg-red-50 hover:border-red-100 group transition-all duration-300"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                </button>
              </div>
            ) : !loading && (
              <div className="flex items-center gap-10">
                <Link href="/login" className="text-xs font-black text-gray-400 hover:text-[#1b6b3e] transition-all uppercase tracking-widest">
                  Login
                </Link>
                <Link href="/register" className="bg-[#1b6b3e] hover:bg-[#155331] text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-green-900/10 active:scale-95 leading-none">
                  Join
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-green-800">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <VisuallyHidden.Root><SheetTitle>Mobile Menu</SheetTitle></VisuallyHidden.Root>
                <div className="mt-12 flex flex-col gap-6">
                  {navLinks.map(link => (
                    <Link key={link.name} href={link.href} className="text-xl font-black uppercase tracking-widest border-b border-gray-50 pb-2">
                      {link.name}
                    </Link>
                  ))}
                  {user && (
                    <div className="flex flex-col gap-4 pt-4">
                      <Link href={userType === 'vendor' ? '/vendor/dashboard' : '/user/profile'} className="text-xl font-black uppercase tracking-widest text-[#1b6b3e]">
                        My Account
                      </Link>
                      <button onClick={handleLogout} className="text-left text-xl font-black uppercase tracking-widest text-red-600">
                        Sign Out
                      </button>
                    </div>
                  )}
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
