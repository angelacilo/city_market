'use client'
 
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, TrendingUp, Save, Loader2 } from 'lucide-react'
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
    <div className="space-y-8 max-w-4xl">
      {/* Success/Error Banners */}
      <div className="grid gap-4">
        {success && failedNames.length === 0 && (
          <div className="flex items-center gap-4 bg-[#f0f7f0] dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-[2rem] px-8 py-6 shadow-xl shadow-green-900/5 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#121212] flex items-center justify-center text-[#1b6b3e] dark:text-green-500 shadow-sm border border-green-50 dark:border-white/5">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
               <p className="text-base font-black text-gray-900 dark:text-white leading-none font-serif italic tracking-tight">System Synchronized</p>
               <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em] mt-2">Price updates live {savedAt ? `at ${savedAt}` : ''}</p>
            </div>
          </div>
        )}
 
        {failedNames.length > 0 && (
          <div className="flex items-start gap-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-[2rem] px-8 py-6 shadow-xl shadow-red-900/5 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#121212] flex items-center justify-center text-red-600 shadow-sm mt-1 border border-red-50 dark:border-white/5">
               <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-black text-gray-900 dark:text-white leading-none mb-3 font-serif italic tracking-tight">Sync Obstruction Detected</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 list-none text-[11px] text-red-600 dark:text-red-400 font-bold uppercase tracking-widest">
                {failedNames.map((name) => <li key={name} className="flex items-center gap-2">
                   <div className="w-1 h-1 bg-red-400 rounded-full" />
                   {name}
                </li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
 
      {listings.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0f0a] rounded-[3rem] border border-gray-100 dark:border-white/5 p-20 text-center shadow-2xl transition-colors">
           <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-10 border border-gray-100 dark:border-white/5">
              <TrendingUp className="w-12 h-12 text-gray-200 dark:text-gray-800" />
           </div>
           <p className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] max-w-[280px] mx-auto leading-[2] font-serif italic">Null data detected <br /> for price matrix.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0a0f0a] rounded-[3rem] border border-gray-100 dark:border-white/10 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden p-4 transition-all">
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {listings.map((listing) => {
              const hasChanged = Math.abs(parseFloat(currentPrices[listing.id] || '0') - originalPrices[listing.id]) > 0.001
              return (
                <div
                  key={listing.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-6 px-10 py-10 transition-all rounded-[2.5rem] group",
                    hasChanged 
                      ? "bg-[#f0f7f0] dark:bg-green-500/5 shadow-inner" 
                      : "hover:bg-gray-50/50 dark:hover:bg-white/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                        "text-lg font-black font-serif italic transition-colors tracking-tight", 
                        hasChanged ? "text-[#1b6b3e] dark:text-green-500" : "text-gray-900 dark:text-white"
                    )}>
                      {listing.products?.name ?? '—'}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                         <div className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                             {listing.products?.categories?.name ?? 'Unverified'}
                         </div>
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-300 dark:text-gray-800 uppercase tracking-tighter transition-colors">
                            <Dot className="w-4 h-4" />
                            Per {listing.products?.unit ?? 'unit'}
                         </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={cn(
                        "flex items-center bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 px-6 h-16 transition-all group-hover:border-gray-200 dark:group-hover:border-white/10 overflow-hidden",
                        hasChanged && "bg-white dark:bg-black/40 border-[#1b6b3e] dark:border-green-500 shadow-xl shadow-green-700/5 ring-4 ring-green-700/5"
                    )}>
                        <span className={cn("text-sm font-black transition-colors mr-3 font-serif", hasChanged ? "text-[#1b6b3e] dark:text-green-500" : "text-gray-300 dark:text-gray-700")}>₱</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={currentPrices[listing.id] ?? ''}
                            onChange={(e) =>
                                setCurrentPrices((prev) => ({ ...prev, [listing.id]: e.target.value }))
                            }
                            className="bg-transparent border-0 focus:outline-none focus:ring-0 text-base font-black text-right w-24 p-0 tabular-nums dark:text-white"
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
        <div className="flex justify-end pt-4 pb-10">
             <Button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                className={cn(
                    "rounded-2xl h-16 px-12 text-[11px] font-black uppercase tracking-[0.2em] transition-all gap-4 shadow-2xl active:scale-95",
                    hasUnsavedChanges 
                        ? "bg-[#1b6b3e] hover:bg-[#155430] text-white shadow-green-900/30" 
                        : "bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-800 shadow-none cursor-not-allowed"
                )}
            >
                {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-4" />
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        Commit Price Changes
                    </>
                )}
            </Button>
        </div>
      )}
    </div>
  )
}
 
function Dot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}
