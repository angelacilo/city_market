'use client'
 
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Tag,
  MessageSquare,
  User,
  LogOut,
  Store,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
 
interface VendorInfo {
  id: string
  business_name: string
  owner_name: string | null
  stall_number: string | null
  contact_number: string | null
  market_id: string
  market_name: string
}
 
interface Props {
  vendor: VendorInfo
  unreadCount: number
  userId: string
  mobileOnly?: boolean
}
 
const mainNavItems = [
  { name: 'Overview', href: '/vendor/dashboard', icon: LayoutDashboard },
  { name: 'My Products', href: '/vendor/products', icon: Package },
  { name: 'Inquiries', href: '/vendor/inquiries', icon: MessageSquare },
]
const accountNavItems = [
  { name: 'My Profile', href: '/vendor/profile', icon: User },
]
 
function NavContent({
  vendor,
  unreadCount,
  onNavigate,
}: {
  vendor: VendorInfo
  unreadCount: number
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
 
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }
 
  function NavLink({
    href,
    icon: Icon,
    name,
    badge,
  }: {
    href: string
    icon: React.ElementType
    name: string
    badge?: number
  }) {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all relative',
          isActive
            ? 'text-green-700 dark:text-green-500 bg-green-50 dark:bg-green-500/10 border-l-2 border-green-600 pl-[10px]'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 border-l-2 border-transparent pl-[10px]'
        )}
      >
        <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-green-600 dark:text-green-500' : 'text-gray-400 dark:text-gray-600')} />
        <span>{name}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white px-1 shadow-lg shadow-red-500/20">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    )
  }
 
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0f0a] transition-colors duration-500">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-white/5">
        <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
          <div className="relative">
            <div className="bg-[#1b6b3e] dark:bg-green-600 p-1.5 rounded-xl shadow-lg shadow-green-900/10 rotate-3 group-hover:rotate-0 transition-all duration-500">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white dark:bg-[#0a0f0a] border-2 border-[#1b6b3e] rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-gray-900 dark:text-white leading-none tracking-tight font-serif italic">
              BUTUAN MARKET
            </span>
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-[#1b6b3e] dark:text-green-500 mt-1 opacity-70">
              Vendor Dashboard
            </span>
          </div>
        </Link>
      </div>
 
      {/* Vendor Profile Summary (Mini) */}
      <div className="p-6">
        <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100/50 dark:border-white/5 shadow-sm dark:shadow-[0_0_20px_rgba(27,107,62,0.1)] transition-all">
           <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">Store Status</p>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#121212] border border-gray-100 dark:border-white/5 flex items-center justify-center shadow-sm">
                <Store className="w-5 h-5 text-[#1b6b3e] dark:text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-gray-900 dark:text-white truncate">{vendor.business_name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 truncate uppercase tracking-tighter">{vendor.market_name}</p>
                </div>
              </div>
           </div>
        </div>
      </div>
 
      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 mb-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Menu</p>
        </div>
        {mainNavItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            name={item.name}
            badge={item.href === '/vendor/inquiries' ? unreadCount : undefined}
          />
        ))}

        <NavLink
          href={`/stalls/${vendor.id}`}
          icon={Store}
          name="Public Stall"
        />
 
        <div className="px-3 mt-8 mb-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Settings</p>
        </div>
        {accountNavItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon} name={item.name} />
        ))}
      </nav>
 
      {/* Session Controls */}
      <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-500/30 transition-colors">
            <LogOut className="w-4 h-4 shadow-sm" />
          </div>
          Sign Out
        </button>
      </div>
    </div>
  )
}
 
export default function VendorSidebarNav({ vendor, unreadCount, userId, mobileOnly }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
 
  // Desktop sidebar — rendered inside the <aside> by the layout
  if (!mobileOnly) {
    return (
      <NavContent vendor={vendor} unreadCount={unreadCount} />
    )
  }
 
  // Mobile header + Sheet
  return (
    <div className="md:hidden flex items-center justify-between px-4 h-14 bg-white dark:bg-[#0a0f0a] border-b border-gray-200 dark:border-white/5 flex-shrink-0 sticky top-0 z-10 transition-colors">
      <p className="text-sm font-black text-gray-900 dark:text-white truncate">{vendor.business_name}</p>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-white/5">
            <Menu className="w-5 h-5 dark:text-white" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85%] sm:w-80 p-0 border-none bg-white dark:bg-[#0a0f0a]" showCloseButton={false}>
          <NavContent
            vendor={vendor}
            unreadCount={unreadCount}
            onNavigate={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
