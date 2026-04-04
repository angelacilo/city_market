'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './ThemeToggle'

const vendorLinks = [
  { name: 'Overview', href: '/vendor/dashboard' },
  { name: 'My Products', href: '/vendor/products' },
  { name: 'Update Prices', href: '/vendor/prices' },
  { name: 'Inquiries', href: '/vendor/inquiries' },
  { name: 'My Profile', href: '/vendor/profile' },
]

interface VendorNavbarProps {
  businessName: string
}

export default function VendorNavbar({ businessName }: VendorNavbarProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 h-16 bg-white border-none shadow-none flex-shrink-0">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
        {/* Brand Name */}
        <Link href="/" className="font-serif text-xl font-bold text-green-800">
          Butuan Market
        </Link>

        {/* Vendor Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {vendorLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-green-800',
                  active
                    ? 'border-b-2 border-green-700 pb-0.5 font-semibold text-green-700'
                    : 'text-gray-700'
                )}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Vendor Info and Sign Out */}
        <div className="hidden items-center gap-6 md:flex">
          <ThemeToggle />
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Store className="h-4 w-4 text-green-700" />
            {businessName}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
