'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { bulkUpdatePrices } from '@/lib/actions/vendor'

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

    // Update original prices for those that succeeded
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

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900">Update prices</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Prices you update here are reflected immediately on the public site.
        </p>
      </div>

      {/* Success banner */}
      {success && failedNames.length === 0 && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-bold text-green-700">
            Prices updated successfully{savedAt ? ` at ${savedAt}` : ''}.
          </p>
        </div>
      )}

      {/* Partial failure banner */}
      {failedNames.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 mb-1">Some prices could not be updated:</p>
            <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
              {failedNames.map((name) => <li key={name}>{name}</li>)}
            </ul>
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">No listings to update.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {listings.map((listing) => {
              const hasChanged =
                parseFloat(currentPrices[listing.id] ?? '') !== originalPrices[listing.id]
              return (
                <div
                  key={listing.id}
                  className={`flex items-center gap-4 px-5 py-3 transition-colors ${hasChanged ? 'bg-green-50/40' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${hasChanged ? 'text-green-900' : 'text-gray-900'}`}>
                      {listing.products?.name ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {listing.products?.categories?.name ?? ''} · per {listing.products?.unit ?? 'unit'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-gray-400 text-sm font-bold">₱</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentPrices[listing.id] ?? ''}
                      onChange={(e) =>
                        setCurrentPrices((prev) => ({ ...prev, [listing.id]: e.target.value }))
                      }
                      className="h-10 w-28 text-sm font-bold text-right"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {listings.length > 0 && (
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-black text-sm"
        >
          {saving ? 'Saving…' : 'Save all changes'}
        </Button>
      )}
    </div>
  )
}
