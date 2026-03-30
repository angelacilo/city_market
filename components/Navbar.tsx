import Link from 'next/link'
import { Store, ShoppingBasket, Search, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-green-600 p-1.5 rounded-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              BCMIS
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/markets" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Markets
            </Link>
            <Link href="/search" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Products
            </Link>
            <Link href="/compare" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Compare Prices
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-600">
                <User className="w-4 h-4 mr-2" />
                Vendor Login
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" size="icon" className="md:hidden">
                <Search className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
