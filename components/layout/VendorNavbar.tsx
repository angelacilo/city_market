'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Store, LogOut, UserCircle, Settings, Moon, Sun, MonitorSmartphone, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { useState, useTransition } from 'react'
import { updateVendorProfile } from '@/lib/actions/vendor'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const vendorLinks = [
  { name: 'Overview', href: '/vendor/dashboard' },
  { name: 'My Products', href: '/vendor/products' },
  { name: 'Inquiries', href: '/vendor/inquiries' },
  { name: 'My Profile', href: '/vendor/profile' },
]

interface VendorNavbarProps {
  vendor: {
    id: string;
    business_name: string;
    owner_name: string;
    stall_number: string | null;
    is_active: boolean;
  }
}

export default function VendorNavbar({ vendor }: VendorNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [isActive, setIsActive] = useState(vendor.is_active)
  const [isPending, startTransition] = useTransition()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const toggleActiveStatus = async (e: React.MouseEvent) => {
    e.preventDefault() // prevent dropdown close
    const newStatus = !isActive
    setIsActive(newStatus)
    startTransition(async () => {
      await updateVendorProfile(vendor.id, { is_active: newStatus })
    })
  }

  return (
    <header className="sticky top-0 z-50 h-16 bg-white border-none shadow-none flex-shrink-0">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
        {/* Brand Name */}
        <Link href="/vendor/dashboard" className="font-serif text-xl font-bold text-green-800">
          Butuan City Market
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

        {/* Profile Dropdown */}
        <div className="hidden items-center gap-4 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full px-4 py-2 hover:bg-gray-100 transition-colors focus:outline-none">
              <div className="relative">
                <UserCircle className="h-6 w-6 text-green-700" />
                <div className={cn(
                  "absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-white",
                  isActive ? "bg-green-500" : "bg-gray-400"
                )} />
              </div>
              <span className="text-sm font-bold text-gray-700">Account</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
              <DropdownMenuLabel className="mb-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-base font-bold text-gray-900 leading-none">{vendor.business_name}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-green-700">Vendor Account</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Active Status */}
              <DropdownMenuItem 
                 className="flex items-center justify-between cursor-pointer py-3 rounded-xl focus:bg-gray-50"
                 onClick={toggleActiveStatus}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
                  <span className="text-sm font-semibold">Active Status</span>
                </div>
                <div className={cn(
                  "relative w-10 h-5 rounded-full transition-colors",
                  isActive ? "bg-green-600" : "bg-gray-300"
                )}>
                  <div className={cn("absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform", isActive ? "translate-x-5" : "")} />
                </div>
              </DropdownMenuItem>

              {/* My Stall Link */}
              <DropdownMenuItem 
                 className="flex items-center gap-3 cursor-pointer py-3 rounded-xl focus:bg-gray-50"
                 onClick={() => router.push(`/stall/${vendor.id}`)}
              >
                <Store className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">My Public Stall</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Theme Toggle */}
              <DropdownMenuItem 
                 className="flex items-center gap-3 cursor-pointer py-3 rounded-xl focus:bg-gray-50"
                 onClick={(e) => {
                   e.preventDefault()
                   setTheme(theme === 'dark' ? 'light' : 'dark')
                 }}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span className="text-sm font-semibold text-gray-700">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />

              {/* Sign Out */}
              <DropdownMenuItem 
                 className="flex items-center gap-3 cursor-pointer py-3 rounded-xl focus:bg-red-50 text-red-600 focus:text-red-700"
                 onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-semibold">Sign Out from Session</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
