'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Store, Search, BarChart2, LayoutDashboard, Package, Tag, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const publicItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Store, label: 'Markets', href: '/markets' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: BarChart2, label: 'Compare', href: '/compare' },
]

const vendorItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/vendor/dashboard' },
  { icon: Package, label: 'Products', href: '/vendor/products' },
  { icon: Tag, label: 'Prices', href: '/vendor/prices' },
  { icon: MessageSquare, label: 'Inquiries', href: '/vendor/inquiries' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const isVendorRoute = pathname?.startsWith('/vendor')
  const navItems = isVendorRoute ? vendorItems : publicItems

  return (
    <nav className="block md:hidden sticky bottom-0 z-50 bg-white border-t border-gray-100 safe-area-pb shadow-sm">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-1 transition-all",
                isActive ? "text-green-700" : "text-gray-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-tight uppercase">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
