'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  if (pathname.startsWith('/vendor') || pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <header className="sticky top-0 z-50 h-16 bg-[#f5faf5] dark:bg-[#0a140a]/90 backdrop-blur-md border-none shadow-none transition-colors">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
        {/* Brand Name */}
        <Link href="/" className="font-serif text-xl font-bold text-green-800 dark:text-green-500">
          Butuan City Market
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
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

        {/* Search and Action */}
        <div className="hidden items-center gap-4 md:flex">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-gray-500" />
            <Input
              type="text"
              placeholder="Search products or markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 rounded-full border border-gray-100 dark:border-green-900/30 bg-white dark:bg-[#1a2c1a] px-9 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-500 focus-visible:ring-green-700"
            />
          </form>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              className="rounded-full bg-green-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800"
            >
              <Link href="/register">Register as Vendor</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-full px-5 py-2 text-sm font-medium text-green-700 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/10"
            >
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
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
                <form onSubmit={handleSearch} className="relative w-full">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search products or markets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-gray-200 bg-white px-10 py-2.5 text-sm"
                  />
                </form>
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={cn(
                        'text-lg font-medium py-2',
                        pathname === link.href ? 'text-green-700' : 'text-gray-700'
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-4 pt-4 border-t">
                  <Button
                    asChild
                    className="w-full rounded-full bg-green-700 text-white py-6"
                  >
                    <Link href="/register">Register as Vendor</Link>
                  </Button>
                  <Link
                    href="/login"
                    className="text-center text-sm font-medium text-gray-600"
                  >
                    Vendor Login
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
