'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Phone, ArrowLeft, Check } from 'lucide-react'
import { markInquiryRead } from '@/lib/actions/vendor'

interface Inquiry {
  id: string
  buyer_name: string
  buyer_contact: string
  message: string
  created_at: string
  is_read: boolean
  listing_id: string | null
  price_listings: {
    id: string
    price: number
    products: { name: string; unit: string } | null
  } | null
}

interface Props {
  inquiries: Inquiry[]
  marketName: string
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  if (Math.floor(h / 24) === 1) return 'yesterday'
  return `${Math.floor(h / 24)}d ago`
}

function fullDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Manila',
  })
}

export default function InquiriesManager({ inquiries: initialInquiries, marketName }: Props) {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const [mobileDetail, setMobileDetail] = useState(false)

  const unreadCount = inquiries.filter((i) => !i.is_read).length

  const filtered = inquiries.filter((i) => {
    if (filter === 'unread') return !i.is_read
    return true
  })

  const selected = inquiries.find((i) => i.id === selectedId) ?? null

  async function handleSelect(inq: Inquiry) {
    setSelectedId(inq.id)
    setMobileDetail(true)

    if (!inq.is_read) {
      setInquiries((prev) =>
        prev.map((i) => i.id === inq.id ? { ...i, is_read: true } : i)
      )
      await markInquiryRead(inq.id)
      router.refresh()
    }
  }

  function handleBack() {
    setMobileDetail(false)
  }

  function handleMarkResolved(id: string) {
    setResolved((prev) => new Set([...prev, id]))
  }

  // ── List panel ─────────────────────────────────────────────────────
  const listPanel = (
    <div className="flex flex-col h-full">
      {/* Heading + filter */}
      <div className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-base font-black text-gray-900">Inquiries</h1>
          {unreadCount > 0 && (
            <Badge className="bg-amber-500 text-white border-0 text-[10px] font-black px-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`h-7 px-3 rounded-full text-xs font-bold border transition-all ${
              filter === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`h-7 px-3 rounded-full text-xs font-bold border transition-all ${
              filter === 'unread'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">
              {filter === 'unread' ? 'No unread inquiries.' : 'No inquiries yet. Buyers will contact you here.'}
            </p>
          </div>
        ) : (
          filtered.map((inq) => {
            const isRes = resolved.has(inq.id)
            const isActive = selectedId === inq.id
            const preview = inq.message.length > 60 ? inq.message.slice(0, 60) + '…' : inq.message
            const productName = inq.price_listings?.products?.name ?? 'Product'

            return (
              <button
                key={inq.id}
                onClick={() => handleSelect(inq)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all ${
                  isActive ? 'bg-green-50' : !inq.is_read ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'
                } ${isRes ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {!inq.is_read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  )}
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-600 flex-shrink-0">
                    {(inq.buyer_name as string).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${!inq.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {inq.buyer_name}
                      </p>
                      <p className="text-[10px] text-gray-400 flex-shrink-0">{relativeTime(inq.created_at)}</p>
                    </div>
                    <p className="text-xs text-green-600 font-medium">{productName}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{preview}</p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  // ── Detail panel ───────────────────────────────────────────────────
  const detailPanel = selected ? (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      {/* Mobile back button */}
      <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={handleBack} className="h-9 gap-1.5 text-xs font-bold">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="p-6 flex-1">
        {/* Buyer heading */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-black text-gray-600">
            {selected.buyer_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900">{selected.buyer_name}</h2>
            <p className="text-xs text-gray-400">
              {selected.price_listings?.products?.name ?? 'Product'}
              {marketName ? ` · ${marketName}` : ''}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-gray-50 rounded-xl p-5 mb-5">
          <p className="text-sm text-gray-700 leading-relaxed">{selected.message}</p>
        </div>

        {/* Contact number */}
        <a
          href={`tel:${selected.buyer_contact}`}
          className="flex items-center gap-2 text-sm font-bold text-green-700 hover:underline mb-2"
        >
          <Phone className="w-4 h-4" />
          {selected.buyer_contact}
        </a>

        {/* Timestamp */}
        <p className="text-xs text-gray-400 mb-6">{fullDateTime(selected.created_at)}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button asChild className="h-11 flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-sm gap-2">
            <a href={`tel:${selected.buyer_contact}`}>
              <Phone className="w-4 h-4" />
              Call buyer
            </a>
          </Button>
          <Button
            variant="outline"
            className="h-11 flex-1 text-sm font-bold gap-2"
            onClick={() => handleMarkResolved(selected.id)}
            disabled={resolved.has(selected.id)}
          >
            <Check className="w-4 h-4" />
            {resolved.has(selected.id) ? 'Resolved' : 'Mark as resolved'}
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <div className="hidden md:flex flex-1 items-center justify-center flex-col text-center px-4">
      <MessageSquare className="w-12 h-12 text-gray-200 mb-4" />
      <p className="text-sm text-gray-400 font-medium">Select an inquiry to read it.</p>
    </div>
  )

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 flex h-[calc(100vh-56px-48px)] md:h-[calc(100vh-56px)] overflow-hidden">
      {/* List column */}
      <div
        className={`w-full md:w-80 md:flex flex-col border-r border-gray-100 bg-white flex-shrink-0 overflow-hidden ${
          mobileDetail ? 'hidden' : 'flex'
        }`}
      >
        {listPanel}
      </div>

      {/* Detail column */}
      <div
        className={`w-full md:flex flex-1 bg-white overflow-hidden ${
          mobileDetail ? 'flex' : 'hidden md:flex'
        }`}
      >
        {detailPanel}
      </div>
    </div>
  )
}
