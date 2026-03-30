import Link from 'next/link'
import { ShoppingCart, TrendingUp, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProductCardProps {
  id: string
  name: string
  price: number
  unit: string
  is_available: boolean
  vendor_name: string
  stall_number: string
  last_updated: string
  category?: string
}

export function ProductCard({ 
  id, 
  name, 
  price, 
  unit, 
  is_available, 
  vendor_name, 
  stall_number, 
  last_updated,
  category 
}: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(price)

  return (
    <Card className={`overflow-hidden border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl ${!is_available ? 'opacity-70 grayscale-[0.5]' : ''}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            {category && (
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full mb-1 inline-block">
                {category}
              </span>
            )}
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors uppercase leading-tight">
              {name}
            </h3>
          </div>
          <Badge variant={is_available ? "default" : "secondary"} className={`border-none shadow-sm h-6 text-[10px] font-bold font-sans uppercase tracking-tighter ${is_available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {is_available ? 'In Stock' : 'Out of Stock'}
          </Badge>
        </div>

        <div className="mb-6 flex items-baseline gap-1">
          <span className="text-2xl font-black text-gray-900 leading-none">{formattedPrice}</span>
          <span className="text-gray-400 text-xs font-bold uppercase tracking-tight">/ {unit}</span>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-50 mb-6">
           <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Vendor:</span>
              <span className="text-gray-700 font-bold max-w-[120px] truncate">{vendor_name}</span>
           </div>
           <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Stall:</span>
              <span className="text-gray-700 font-bold">#{stall_number}</span>
           </div>
           <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium italic">Updated:</span>
              <span className="text-gray-500 font-medium">{new Date(last_updated).toLocaleDateString()}</span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/compare?product=${encodeURIComponent(name)}`}>
            <Button variant="outline" className="w-full h-10 text-[10px] font-bold uppercase border-gray-100 hover:bg-green-50 hover:text-green-700 hover:border-green-100 transition-all rounded-xl">
              Compare
            </Button>
          </Link>
          <Button className="h-10 text-[10px] font-bold uppercase bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm transition-all shadow-green-100">
            Ask Vendor
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
