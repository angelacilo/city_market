'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Store, Search, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Store, label: 'Markets', href: '/markets' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: BarChart2, label: 'Compare', href: '/compare' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="block md:hidden sticky bottom-0 z-50 bg-white border-t border-gray-100 safe-area-pb shadow-lg">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all active:scale-95",
                isActive ? "text-green-600" : "text-gray-500 hover:text-green-600"
              )}
            >
              <item.icon 
                className={cn(
                  "w-5 h-5 transition-all",
                  isActive && "fill-green-100 stroke-green-600"
                )} 
              />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
