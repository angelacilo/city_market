'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
   Store,
   Search,
   Menu,
   User,
   MessageCircle,
   ChevronDown,
   LogOut,
   Settings,
   ShoppingBag,
   Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function Navbar() {
   const pathname = usePathname()
   const [user, setUser] = useState<any>(null)
   const [role, setRole] = useState<'buyer' | 'vendor' | 'admin' | null>(null)
   const [unreadCount, setUnreadCount] = useState(0)
   const supabase = createClient()

   useEffect(() => {
      async function getUser() {
         const { data: { session } } = await supabase.auth.getSession()
         if (session?.user) {
            setUser(session.user)

            // Parallel role checks
            const [adminRes, vendorRes, buyerRes] = await Promise.all([
               supabase.from('profiles').select('role').eq('id', session.user.id).single(),
               supabase.from('vendors').select('id').eq('user_id', session.user.id).single(),
               supabase.from('buyer_profiles').select('id').eq('user_id', session.user.id).single()
            ])

            if (adminRes.data?.role === 'admin') setRole('admin')
            else if (vendorRes.data) setRole('vendor')
            else if (buyerRes.data) setRole('buyer')

            // Fetch initial unread count
            fetchUnreadCount(session.user.id)
         }
      }

      getUser()

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
         if (session) {
            setUser(session.user)
            // Refresh role and count
            getUser()
         } else {
            setUser(null)
            setRole(null)
            setUnreadCount(0)
         }
      })

      return () => {
         authListener.subscription.unsubscribe()
      }
   }, [supabase])

   const fetchUnreadCount = async (uid: string) => {
      // For buyers
      const { data: buyerConvs } = await supabase
         .from('conversations')
         .select('buyer_unread_count')
         .eq('buyer_id', uid)

      const bTotal = buyerConvs?.reduce((acc, curr) => acc + (curr.buyer_unread_count || 0), 0) || 0

      // For vendors
      const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', uid).single()
      let vTotal = 0
      if (vendor) {
         const { data: vendorConvs } = await supabase
            .from('conversations')
            .select('vendor_unread_count')
            .eq('vendor_id', vendor.id)
         vTotal = vendorConvs?.reduce((acc, curr) => acc + (curr.vendor_unread_count || 0), 0) || 0
      }

      setUnreadCount(bTotal + vTotal)
   }

   // Realtime unread count update
   useEffect(() => {
      if (!user) return

      const channel = supabase
         .channel('nav_unreads')
         .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations'
         }, () => {
            fetchUnreadCount(user.id)
         })
         .subscribe()

      return () => { supabase.removeChannel(channel) }
   }, [user, supabase])

   const handleLogout = async () => {
      await supabase.auth.signOut()
      window.location.href = '/'
   }

   const navLinks = [
      { name: 'Markets', href: '/markets' },
      { name: 'Categories', href: '/categories' },
      { name: 'Comparison', href: '/compare' },
   ]

   return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#050a05]/90 backdrop-blur-3xl border-b border-gray-100/50 dark:border-white/5 shadow-sm dark:shadow-[0_0_30px_rgba(27,107,62,0.15)] transition-all duration-500">
         <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="flex justify-between items-center h-20">

               {/* Logo Section */}
               <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
                  <div className="relative">
                     <div className="bg-[#1b6b3e] p-2 rounded-2xl shadow-lg shadow-green-900/10 rotate-3 group-hover:rotate-0 transition-all duration-500">
                        <Store className="w-6 h-6 text-white" />
                     </div>
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-white dark:bg-[#050a05] border-2 border-[#1b6b3e] rounded-full animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-lg font-black text-gray-900 dark:text-white leading-none tracking-tight">
                        BUTUAN MARKET
                     </span>
                     <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1b6b3e] dark:text-green-500 mt-1 opacity-70">
                        Secure Network
                     </span>
                  </div>
               </Link>

               {/* Desktop Navigation */}
               <div className="hidden lg:flex items-center gap-10">
                  {navLinks.map((link) => (
                     <Link
                        key={link.name}
                        href={link.href}
                        className={cn(
                           "text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2",
                           pathname === link.href ? "text-[#1b6b3e] dark:text-green-500" : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                     >
                        {link.name}
                        {pathname === link.href && (
                           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#1b6b3e] dark:bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        )}
                     </Link>
                  ))}
               </div>

               {/* Dynamic Actions */}
               <div className="flex items-center gap-6">

                  {user && (
                     <div className="hidden sm:flex items-center gap-4 border-r border-gray-100 dark:border-white/10 pr-4 mr-0">
                        {/* Notifications */}
                        <Link href="/user/notifications" className="relative group">
                           <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center border border-gray-100 dark:border-white/10 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:shadow-xl dark:group-hover:shadow-green-500/10 transition-all duration-300">
                              <Bell className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-[#1b6b3e] dark:group-hover:text-green-500 transition-colors" />
                              {/* Placeholder for notification bubble */}
                           </div>
                        </Link>

                        {/* Messages */}
                        <Link href={role === 'vendor' ? '/vendor/inquiries' : '/user/messages'} className="relative group">
                           <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center border border-gray-100 dark:border-white/10 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:shadow-xl dark:group-hover:shadow-green-500/10 transition-all duration-300">
                              <MessageCircle className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-[#1b6b3e] dark:group-hover:text-green-500 transition-colors" />
                              {unreadCount > 0 && (
                                 <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 bg-[#1b6b3e] dark:bg-green-600 rounded-full border-2 border-white dark:border-[#050a05] flex items-center justify-center px-1">
                                    <span className="text-[8px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                 </div>
                              )}
                           </div>
                        </Link>
                     </div>
                  )}

                  {!user ? (
                     <div className="flex items-center gap-3">
                        <Link href="/login" className="hidden sm:block">
                           <Button variant="ghost" className="h-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-[#1b6b3e] dark:hover:text-green-500 hover:bg-[#1b6b3e]/5 dark:hover:bg-green-500/10 transition-all">
                              Sign In
                           </Button>
                        </Link>
                        <Link href="/register">
                           <Button className="h-11 px-8 rounded-2xl bg-[#1b6b3e] dark:bg-[#1b6b3e] hover:bg-[#155430] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/10 transition-all active:scale-95">
                              Get Started
                           </Button>
                        </Link>
                     </div>
                  ) : (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <button className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none pl-2 border-l border-gray-100 dark:border-white/10">
                              <div className="w-11 h-11 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-white/10 shadow-sm font-black text-[#1b6b3e] dark:text-green-500">
                                 {user.email?.[0].toUpperCase()}
                              </div>
                              <div className="hidden md:flex flex-col items-start">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">
                                    My Account
                                 </span>
                                 <span className="text-[9px] font-bold uppercase tracking-widest text-[#1b6b3e] dark:text-green-500 opacity-60">
                                    {role || 'System'}
                                 </span>
                              </div>
                              <ChevronDown className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-1" />
                           </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-4 border-gray-100 dark:border-white/10 dark:bg-[#0a0f0a] backdrop-blur-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(27,107,62,0.2)] mt-4">
                           <DropdownMenuLabel className="px-4 py-3">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">Session Protocol</p>
                              <p className="text-xs font-black text-gray-900 dark:text-white truncate">{user.email}</p>
                           </DropdownMenuLabel>
                           <DropdownMenuSeparator className="bg-gray-50 dark:bg-white/5 my-2 mx-4" />

                           {role === 'vendor' && (
                              <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-green-50 dark:focus:bg-green-950/20 transition-colors">
                                 <Link href="/vendor/dashboard" className="flex items-center gap-3 w-full">
                                    <Store className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Vendor Dash</span>
                                 </Link>
                              </DropdownMenuItem>
                           )}

                           {role === 'admin' && (
                              <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-green-50 dark:focus:bg-green-950/20 transition-colors">
                                 <Link href="/admin/dashboard" className="flex items-center gap-3 w-full">
                                    <ShieldCheck className="w-4 h-4 text-[#1b6b3e] dark:text-green-500" />
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Admin Control</span>
                                 </Link>
                              </DropdownMenuItem>
                           )}

                           <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-green-50 dark:focus:bg-green-950/20 transition-colors">
                              <Link href="/user/notifications" className="flex items-center gap-3 w-full">
                                 <Bell className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                 <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Notifications</span>
                              </Link>
                           </DropdownMenuItem>

                           <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-green-50 dark:focus:bg-green-950/20 transition-colors">
                              <Link href="/user/messages" className="flex items-center gap-3 w-full">
                                 <MessageCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                 <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Messages</span>
                              </Link>
                           </DropdownMenuItem>

                           <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-green-50 dark:focus:bg-green-950/20 transition-colors">
                              <Link href={role === 'vendor' ? '/vendor/profile' : '/user/profile'} className="flex items-center gap-3 w-full">
                                 <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                 <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">My Profile</span>
                              </Link>
                           </DropdownMenuItem>

                           <DropdownMenuSeparator className="bg-gray-50 dark:bg-white/5 my-2 mx-4" />

                           <DropdownMenuItem
                              onClick={handleLogout}
                              className="rounded-xl p-3 focus:bg-red-50 dark:focus:bg-red-950/20 text-red-600 dark:text-red-500 transition-colors cursor-pointer"
                           >
                              <div className="flex items-center gap-3 w-full">
                                 <LogOut className="w-4 h-4" />
                                 <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
                              </div>
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  )}

                  {/* Mobile Menu Trigger */}
                  <Button variant="ghost" size="icon" className="lg:hidden rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                     <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </Button>
               </div>
            </div>
         </div>
      </nav>
   )
}

function ShieldCheck({ className }: any) {
   return (
      <div className={cn("bg-[#1b6b3e]/10 p-1 rounded-md", className)}>
         <User className="w-3 h-3 text-[#1b6b3e]" />
      </div>
   )
}
