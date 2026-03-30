'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Phone, ArrowLeft, Check, User } from 'lucide-react'
import { markInquiryRead } from '@/lib/actions/vendor'
import { cn } from '@/lib/utils'

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
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function fullDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function InquiriesManager({ inquiries: initialInquiries, marketName }: Props) {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries)
  const [selectedId, setSelectedId] = useState<string | null>(initialInquiries[0]?.id || null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
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

  return (
    <div className="flex bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-[600px]">
      {/* Sidebar List */}
      <div className={cn(
        "w-full md:w-[380px] border-r border-gray-100 flex flex-col bg-white overflow-hidden",
        mobileDetail ? "hidden md:flex" : "flex"
      )}>
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <h3 className="text-xl font-black italic text-gray-900 font-serif">Inbox</h3>
                {unreadCount > 0 && (
                    <Badge className="bg-green-700 text-white rounded-full px-2 h-5 text-[10px] font-black">
                        {unreadCount}
                    </Badge>
                )}
             </div>
             <div className="flex gap-4 mt-4">
                <button 
                    onClick={() => setFilter('all')}
                    className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", filter === 'all' ? "text-green-700 underline underline-offset-4" : "text-gray-400 hover:text-gray-600")}
                >
                    All Messages
                </button>
                <button 
                     onClick={() => setFilter('unread')}
                     className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", filter === 'unread' ? "text-green-700 underline underline-offset-4" : "text-gray-400 hover:text-gray-600")}
                >
                    Unread Only
                </button>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-10">
              <MessageSquare className="w-12 h-12 text-gray-100 mb-4" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No inquiries found</p>
            </div>
          ) : (
            filtered.map((inq) => (
              <button
                key={inq.id}
                onClick={() => handleSelect(inq)}
                className={cn(
                  "w-full text-left p-8 border-b border-gray-50 transition-all relative group",
                  selectedId === inq.id ? "bg-[#f0f7f0]/50" : "hover:bg-gray-50/50"
                )}
              >
                {!inq.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-700" />
                )}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className={cn("text-sm truncate", !inq.is_read ? "font-black text-gray-900" : "font-bold text-gray-600")}>
                        {inq.buyer_name}
                      </p>
                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-2">
                        {relativeTime(inq.created_at)}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-green-700/70 uppercase tracking-tight truncate mb-1">
                      {inq.price_listings?.products?.name ?? 'General Inquiry'}
                    </p>
                    <p className="text-xs text-gray-400 truncate line-clamp-1">
                      {inq.message}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Detail Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-white overflow-hidden",
        !mobileDetail ? "hidden md:flex" : "flex"
      )}>
        {selected ? (
          <div className="flex flex-col h-full">
             {/* Detail Header */}
             <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setMobileDetail(false)}
                        className="md:hidden w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h4 className="text-xl font-black italic text-gray-900 font-serif leading-none">{selected.buyer_name}</h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            {fullDateTime(selected.created_at)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button asChild className="rounded-full bg-green-700 hover:bg-green-800 text-white h-10 px-6 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-green-700/20">
                        <a href={`tel:${selected.buyer_contact}`}>
                            <Phone className="w-3.5 h-3.5 mr-2" />
                            Call Buyer
                        </a>
                    </Button>
                </div>
             </div>

             {/* Message Body */}
             <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
                <div className="flex flex-col gap-8 max-w-2xl">
                    <div className="bg-[#f0f7f0] rounded-[2rem] rounded-tl-none p-10 relative">
                        <p className="text-[13px] text-green-900 font-medium leading-relaxed">
                            {selected.message}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 border-t border-gray-50 pt-10">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 italic font-serif font-black text-gray-400">
                            P
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Inquiring About</p>
                            <p className="text-sm font-black text-gray-900 leading-none">
                                {selected.price_listings?.products?.name ?? '—'}
                            </p>
                        </div>
                        <div className="ml-auto text-right">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Price</p>
                             <p className="text-sm font-black text-green-700 font-serif italic">
                                ₱{Number(selected.price_listings?.price || 0).toFixed(2)}
                             </p>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-[2rem] p-10">
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Contact Information</h5>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-700 shadow-sm">
                                <Phone className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-black text-gray-900 font-mono tracking-wider">{selected.buyer_contact}</span>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                 <MessageSquare className="w-10 h-10 text-gray-200" />
            </div>
            <h4 className="text-xl font-black italic text-gray-900 font-serif">No Message Selected</h4>
            <p className="text-xs text-gray-400 max-w-xs mt-3 leading-relaxed">Choose an inquiry from the sidebar to view the details and contact information.</p>
          </div>
        )}
      </div>
    </div>
  )
}
