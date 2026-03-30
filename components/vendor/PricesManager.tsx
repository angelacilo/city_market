'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, TrendingUp, Save } from 'lucide-react'
import { bulkUpdatePrices } from '@/lib/actions/vendor'
import { cn } from '@/lib/utils'

interface Listing {
  id: string
  price: number
  product_id: string
  products: { name: string; unit: string; categories: { name: string } | null } | null
}

interface Props {
  listings: Listing[]
}

export default function PricesManager({ listings }: Props) {
  const [originalPrices, setOriginalPrices] = useState<Record<string, number>>(
    Object.fromEntries(listings.map((l) => [l.id, l.price]))
  )
  const [currentPrices, setCurrentPrices] = useState<Record<string, string>>(
    Object.fromEntries(listings.map((l) => [l.id, l.price.toFixed(2)]))
  )
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [savedAt, setSavedAt] = useState('')
  const [failedNames, setFailedNames] = useState<string[]>([])

  async function handleSave() {
    setSaving(true)
    setSuccess(false)
    setFailedNames([])

    const updates: { listingId: string; newPrice: number }[] = []

    for (const listing of listings) {
      const rawVal = currentPrices[listing.id] ?? ''
      const newPrice = parseFloat(rawVal)
      if (isNaN(newPrice) || newPrice <= 0) continue
      if (Math.abs(newPrice - originalPrices[listing.id]) < 0.001) continue
      updates.push({ listingId: listing.id, newPrice })
    }

    if (updates.length === 0) {
      setSaving(false)
      setSuccess(true)
      setSavedAt(new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }))
      return
    }

    const result = await bulkUpdatePrices(updates)
    setSaving(false)

    if (result.failed.length > 0) {
      const failedListingIds = new Set(result.failed)
      const names = listings
        .filter((l) => failedListingIds.has(l.id))
        .map((l) => l.products?.name ?? l.id)
      setFailedNames(names)
    }

    setOriginalPrices((prev) => {
      const next = { ...prev }
      for (const { listingId, newPrice } of updates) {
        if (!result.failed.includes(listingId)) {
          next[listingId] = newPrice
        }
      }
      return next
    })

    setSuccess(true)
    setSavedAt(new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }))
  }

  const hasUnsavedChanges = listings.some(l => 
    Math.abs(parseFloat(currentPrices[l.id] || '0') - originalPrices[l.id]) > 0.001
  )

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Success/Error Banners */}
      <div className="space-y-4">
        {success && failedNames.length === 0 && (
          <div className="flex items-center gap-4 bg-[#f0f7f0] border border-green-100/50 rounded-2xl px-6 py-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-700 shadow-sm">
               <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
               <p className="text-sm font-black text-green-900 leading-none">Prices Synchronized</p>
               <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">Updated successfully {savedAt ? `at ${savedAt}` : ''}</p>
            </div>
          </div>
        )}

        {failedNames.length > 0 && (
          <div className="flex items-start gap-4 bg-red-50 border border-red-100 rounded-2xl px-6 py-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-600 shadow-sm mt-1">
               <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-red-900 leading-none mb-2">Sync Connection Error</p>
              <ul className="list-disc list-inside text-xs text-red-600 font-medium space-y-1">
                {failedNames.map((name) => <li key={name}>{name}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-16 text-center shadow-sm">
           <TrendingUp className="w-12 h-12 text-gray-100 mx-auto mb-4" />
           <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No listings available for pricing.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-2">
          <div className="divide-y divide-gray-50">
            {listings.map((listing) => {
              const hasChanged = Math.abs(parseFloat(currentPrices[listing.id] || '0') - originalPrices[listing.id]) > 0.001
              return (
                <div
                  key={listing.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-4 px-8 py-6 transition-all rounded-[1.8rem]",
                    hasChanged ? "bg-[#f0f7f0]/40" : "hover:bg-gray-50/50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-base font-black italic font-serif transition-colors", hasChanged ? "text-green-900" : "text-gray-900")}>
                      {listing.products?.name ?? '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                         <Badge className="bg-gray-50 text-gray-400 border-0 text-[9px] font-black uppercase tracking-widest px-2 h-4.5">
                             {listing.products?.categories?.name ?? ''}
                         </Badge>
                         <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                            Per {listing.products?.unit ?? 'unit'}
                         </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={cn(
                        "flex items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 h-12 transition-all group",
                        hasChanged && "bg-white border-green-700 shadow-sm shadow-green-700/5 ring-4 ring-green-700/10"
                    )}>
                        <span className={cn("text-xs font-black transition-colors mr-2", hasChanged ? "text-green-700" : "text-gray-400")}>₱</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={currentPrices[listing.id] ?? ''}
                            onChange={(e) =>
                                setCurrentPrices((prev) => ({ ...prev, [listing.id]: e.target.value }))
                            }
                            className="bg-transparent border-0 focus:outline-none focus:ring-0 text-sm font-black text-right w-24 p-0 tabular-nums"
                        />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {listings.length > 0 && (
        <div className="flex justify-end pt-4">
             <Button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                className={cn(
                    "rounded-full h-14 px-10 text-sm font-black uppercase tracking-widest transition-all gap-3 shadow-xl",
                    hasUnsavedChanges 
                        ? "bg-green-700 hover:bg-green-800 text-white shadow-green-700/30" 
                        : "bg-gray-100 text-gray-300 shadow-none cursor-not-allowed"
                )}
            >
                {saving ? (
                    'Saving Updates...'
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        Save Price Updates
                    </>
                )}
            </Button>
        </div>
      )}
    </div>
  )
}
