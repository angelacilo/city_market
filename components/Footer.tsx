import Link from 'next/link'
import { Store, Globe, Share2, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Logo and About */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-green-600 p-1.5 rounded-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">Butuan City Market</span>
            </Link>
            <p className="text-gray-600 leading-relaxed text-sm">
              The Butuan City Market Information System brings real-time price comparisons and market updates to the residents of Butuan City.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-green-600 hover:border-green-600 transition-all shadow-sm">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-green-600 hover:border-green-600 transition-all shadow-sm">
                <Share2 className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-green-600 hover:border-green-600 transition-all shadow-sm">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-6">Market Information</h3>
            <ul className="space-y-4">
              <li><Link href="/markets" className="text-gray-600 hover:text-green-600 transition-colors text-sm">Browse Markets</Link></li>
              <li><Link href="/products" className="text-gray-600 hover:text-green-600 transition-colors text-sm">Product Price List</Link></li>
              <li><Link href="/compare" className="text-gray-600 hover:text-green-600 transition-colors text-sm">Price Comparison</Link></li>
              <li><Link href="/search" className="text-gray-600 hover:text-green-600 transition-colors text-sm">Search Market Goods</Link></li>
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-6">For Vendors</h3>
            <ul className="space-y-4">
              <li><Link href="/login" className="text-gray-600 hover:text-green-600 transition-colors text-sm">Vendor Login</Link></li>
              <li><Link href="/register" className="text-gray-600 hover:text-green-600 transition-colors text-sm">Register as Vendor</Link></li>
              <li><Link href="/vendor/guide" className="text-gray-600 hover:text-green-600 transition-colors text-sm">Vendor Dashboard Guide</Link></li>
              <li><Link href="/terms" className="text-gray-600 hover:text-green-600 transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-green-600 mr-3 shrink-0" />
                <span className="text-sm text-gray-600">City Hall Complex, Doongan Butuan City, Agusan del Norte, Philippines 8600</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-green-600 mr-3 shrink-0" />
                <span className="text-sm text-gray-600">(085) 341-2345</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 text-green-600 mr-3 shrink-0" />
                <span className="text-sm text-gray-600">contact@butuancitymarket.gov.ph</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 mt-8 text-center sm:flex sm:justify-between items-center px-4 sm:px-0">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Butuan City Market Information System. All rights reserved.</p>
          <p className="text-xs text-gray-400 mt-4 sm:mt-0 group hover:text-gray-500 cursor-default transition-colors">
            Designed for the welfare of Butuanon Buyers and Sellers.
          </p>
        </div>
      </div>
    </footer>
  )
}
