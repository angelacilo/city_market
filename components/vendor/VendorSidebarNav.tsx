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
            ? 'text-green-700 bg-green-50 border-l-2 border-green-600 pl-[10px]'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent pl-[10px]'
        )}
      >
        <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-green-600' : 'text-gray-400')} />
        <span>{name}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white px-1">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Vendor info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-gray-900 truncate">{vendor.business_name}</p>
            <p className="text-xs text-gray-400 truncate">{vendor.market_name}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main nav */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Menu</p>
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

        <div className="px-3 mt-4 mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account</p>
        </div>
        {accountNavItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon} name={item.name} />
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all min-h-[44px]"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
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
    <div className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200 flex-shrink-0 sticky top-0 z-10">
      <p className="text-sm font-black text-gray-900 truncate">{vendor.business_name}</p>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
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
