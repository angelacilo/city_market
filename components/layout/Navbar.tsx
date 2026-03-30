'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navLinks = [
  { name: 'Market Prices', href: '/' },
  { name: 'Vendors', href: '/markets' },
  { name: 'Logistics', href: '/logistics' },
  { name: 'About Us', href: '/about' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    setSheetOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 h-14 bg-white">
      <div className="mx-auto grid h-full max-w-6xl grid-cols-2 items-center px-4 md:grid-cols-3 md:px-6">
        <Link href="/" className="text-base font-semibold text-gray-900 justify-self-start">
          Butuan City Market
        </Link>

        <nav className="hidden items-center justify-center gap-8 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'border-b-2 border-transparent pb-0.5 text-sm text-gray-600 transition-colors hover:text-gray-900',
                  active && 'border-green-700 text-gray-900'
                )}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center justify-end gap-4 md:flex">
          <Button asChild className="rounded-full bg-green-700 px-4 py-1.5 text-sm text-white hover:bg-green-800 h-auto">
            <Link href="/register">Register as Vendor</Link>
          </Button>
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Login
          </Link>
        </div>

        <div className="justify-self-end md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-base text-gray-700 hover:text-gray-900"
                  >
                    {link.name}
                  </Link>
                ))}
                <Button asChild className="mt-4 w-full rounded-full bg-green-700 text-white">
                  <Link href="/register">Register as Vendor</Link>
                </Button>
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                  Login
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
