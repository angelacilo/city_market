import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Store, ExternalLink } from "lucide-react"

interface PriceListing {
  id: string
  price: number
  is_available: boolean
  last_updated: string
  products: { name: string; unit: string }
  vendors: { business_name: string; stall_number: string; contact_number: string }
  markets: { name: string; barangay: string }
}

interface PriceCompareTableProps {
  listings: PriceListing[]
}

export function PriceCompareTable({ listings }: PriceCompareTableProps) {
  if (!listings || listings.length === 0) {
    return (
      <div className="p-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 font-medium text-gray-400">
         No prices found for this product. 
      </div>
    )
  }

  const sorted = [...listings].sort((a, b) => a.price - b.price)
  const lowestPrice = sorted[0].price
  const highestPrice = sorted[sorted.length - 1].price

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-2xl bg-white shadow-green-50 animate-fade-in">
      <Table className="border-collapse">
        <TableHeader className="bg-gray-900 border-none">
          <TableRow className="border-none hover:bg-gray-900">
            <TableHead className="text-white h-16 font-black uppercase text-xs tracking-widest pl-8">Market</TableHead>
            <TableHead className="text-white h-16 font-black uppercase text-xs tracking-widest">Vendor / Stall</TableHead>
            <TableHead className="text-white h-16 font-black uppercase text-xs tracking-widest text-right px-8">Price</TableHead>
            <TableHead className="text-white h-16 font-black uppercase text-xs tracking-widest">Availability</TableHead>
            <TableHead className="text-white h-16 font-black uppercase text-xs tracking-widest">Contact</TableHead>
            <TableHead className="text-white h-16 font-black uppercase text-xs tracking-widest pr-8 text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((listing) => {
            const isLowest = listing.price === lowestPrice
            const isHighest = listing.price === highestPrice && listing.price !== lowestPrice
            
            return (
              <TableRow 
                key={listing.id} 
                className={`h-24 transition-colors group ${isLowest ? 'bg-green-50/50 hover:bg-green-100/50 font-medium' : isHighest ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50'}`}
              >
                <TableCell className="pl-8">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isLowest ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-400'}`}>
                        <Store className="w-6 h-6" />
                     </div>
                     <div>
                        <div className="text-sm font-black text-gray-900 leading-none mb-1 group-hover:text-green-600 transition-colors uppercase">{listing.markets.name}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                           {listing.markets.barangay}
                        </div>
                     </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-700 leading-tight uppercase truncate max-w-[150px]">{listing.vendors.business_name}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Stall #{listing.vendors.stall_number}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right px-8 relative">
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-black tabular-nums transition-all ${isLowest ? 'text-green-600' : isHighest ? 'text-red-600' : 'text-gray-900 group-hover:scale-110'}`}>
                        ₱{listing.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase">/ {listing.products.unit}</span>
                    </div>
                    {isLowest && (
                      <Badge className="bg-green-600 text-white border-green-700 animate-pulse text-[8px] px-2 py-0.5 mt-1 font-black uppercase tracking-[0.2em] rounded-sm">
                        Best Deal
                      </Badge>
                    )}
                    {isHighest && (
                       <Badge className="bg-red-50 text-red-600 border-none shadow-none text-[8px] px-2 py-0.5 mt-1 font-black uppercase tracking-[0.2em] rounded-sm">
                          Highest Price
                       </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {listing.is_available ? (
                      <div className="flex items-center gap-1.5 text-green-600 text-xs font-black uppercase tracking-tighter">
                        <CheckCircle2 className="w-4 h-4 fill-green-600 text-white" />
                        In Stock
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-400 text-xs font-black uppercase tracking-tighter line-through opacity-50">
                        <XCircle className="w-4 h-4 fill-red-400 text-white" />
                        Out of Stock
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-bold text-gray-500 tabular-nums bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 group-hover:border-green-100 group-hover:bg-white transition-all underline decoration-green-200 decoration-2 underline-offset-4">
                    {listing.vendors.contact_number}
                  </span>
                </TableCell>
                <TableCell className="pr-8 text-center flex items-center justify-center h-24">
                  <Button className="h-10 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-100 transition-all active:scale-95 flex items-center gap-2 group/btn shrink-0">
                    Ask Vendor
                    <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
