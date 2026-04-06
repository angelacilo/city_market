'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, MessageSquareText, LogOut, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { ThemeToggle } from './ThemeToggle'

const navLinks = [
  { name: 'Market Prices', href: '/' },
  { name: 'Vendors', href: '/markets' },
  { name: 'Price Compare', href: '/compare' },
  { name: 'About Us', href: '/about' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<'buyer' | 'vendor' | 'admin' | null>(null)

  const supabase = createClient()

  const fetchUnreadCount = useCallback(async (userId: string) => {
    // 1. Fetch role if not already known
    let role = userRole
    if (!role) {
      // Check admin
      const { data: admin } = await supabase.from('admin_users').select('id').eq('user_id', userId).single()
      if (admin) role = 'admin'
      else {
        // Check vendor
        const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', userId).single()
        if (vendor) role = 'vendor'
        else role = 'buyer'
      }
      setUserRole(role)
    }

    // 2. Fetch conversations and sum unread
    if (role === 'admin') return // Admins don't have personal conversations yet

    const { data: convs } = await supabase
      .from('conversations')
      .select('buyer_id, vendor_id, buyer_unread_count, vendor_unread_count')
      .or(`buyer_id.eq.${userId},vendor_id.in.(select id from vendors where user_id = '${userId}')`)

    if (convs) {
      const total = convs.reduce((acc, c) => {
        if (c.buyer_id === userId) return acc + (c.buyer_unread_count || 0)
        return acc + (c.vendor_unread_count || 0)
      }, 0)
      setUnreadCount(total)
    }
  }, [supabase, userRole])

  useEffect(() => {
    async function initAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        fetchUnreadCount(user.id)

        // Subscribe to conversation updates
        const channel = supabase
          .channel('navbar-realtime')
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations'
          }, () => {
            fetchUnreadCount(user.id)
          })
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }
    initAuth()

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetchUnreadCount(session.user.id)
      } else {
        setUnreadCount(0)
        setUserRole(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUnreadCount])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (pathname.startsWith('/vendor') || pathname === '/login' || pathname === '/register') {
    return null
  }

  const dashboardHref = userRole === 'admin' ? '/admin/dashboard' : userRole === 'vendor' ? '/vendor/dashboard' : '/user/messages'

  return (
    <header className="sticky top-0 z-50 h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-colors">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8 relative">
        {/* Brand Name */}
        <Link href="/" className="font-serif text-2xl font-black text-[#1b6b3e] tracking-tight shrink-0">
          Butuan City Market
        </Link>
 
        {/* Desktop Navigation - Centered */}
        <nav className="hidden items-center gap-10 lg:flex absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors duration-300',
                  active
                    ? 'text-[#1b6b3e] border-b-2 border-[#1b6b3e] pb-1'
                    : 'text-gray-500 hover:text-[#1b6b3e]'
                )}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>
 
        {/* Desktop Actions */}
        <div className="hidden items-center gap-8 lg:flex shrink-0">
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                href={dashboardHref}
                className="text-sm font-bold text-gray-700 hover:text-[#1b6b3e] transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <Link href="/register" className="bg-[#007e41] hover:bg-[#006b37] text-white px-8 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-green-900/10 active:scale-95 leading-none">
                Register
              </Link>
              <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-[#1b6b3e] transition-colors">
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          {user && (
            <Link
              href={userRole === 'vendor' ? '/vendor/inquiries' : '/user/messages'}
              className="relative p-2 text-gray-600"
            >
              <MessageSquareText className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-green-800" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80">
              <VisuallyHidden.Root>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden.Root>
              <div className="mt-12 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={cn(
                        'text-lg font-black uppercase tracking-widest py-2',
                        pathname === link.href ? 'text-green-700' : 'text-gray-900'
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                  {user && (
                    <Link
                      href={dashboardHref}
                      className="text-lg font-black uppercase tracking-widest py-2 text-gray-900"
                    >
                      Dashboard
                    </Link>
                  )}
                </div>
                <div className="flex flex-col gap-4 pt-4 border-t">
                  {!user ? (
                    <>
                      <Button asChild className="w-full rounded-full bg-green-700 text-white py-6 font-black uppercase tracking-widest">
                        <Link href="/register">Create Account</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full rounded-full border-gray-200 py-6 font-black uppercase tracking-widest">
                        <Link href="/login">Sign In</Link>
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleLogout} variant="destructive" className="w-full rounded-full py-6 font-black uppercase tracking-widest">
                      Sign Out
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
