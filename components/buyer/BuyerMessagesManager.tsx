'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, ArrowLeft, Store, MessageCircle } from 'lucide-react'
import { markConversationRead } from '@/lib/actions/messenger'
import { cn } from '@/lib/utils'
import InquiryChat from '../shared/InquiryChat'

interface Conversation {
  id: string
  buyer_id: string
  vendor_id: string
  listing_id: string | null
  product_name: string
  vendor_name: string
  market_name: string
  price: number | null
  unit: string | null
  status: 'open' | 'closed'
  created_at: string
  last_message_at: string
  buyer_unread_count: number
  vendor_unread_count: number
}

interface Props {
  conversations: Conversation[]
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

export default function BuyerMessagesManager({ conversations: initialConversations }: Props) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id || null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [mobileDetail, setMobileDetail] = useState(false)

  const unreadCount = conversations.filter((c) => (c.buyer_unread_count || 0) > 0).length

  const filtered = conversations.filter((c) => {
    if (filter === 'unread') return (c.buyer_unread_count || 0) > 0
    return true
  })

  const selected = conversations.find((c) => c.id === selectedId) ?? null

  async function handleSelect(conv: Conversation) {
    setSelectedId(conv.id)
    setMobileDetail(true)

    if ((conv.buyer_unread_count || 0) > 0) {
      setConversations((prev) =>
        prev.map((c) => c.id === conv.id ? { ...c, buyer_unread_count: 0 } : c)
      )
      await markConversationRead(conv.id, 'buyer')
      router.refresh()
    }
  }

  return (
    <div className="flex bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-[650px]">
      {/* Sidebar List */}
      <div className={cn(
        "w-full md:w-[380px] border-r border-gray-100 flex flex-col bg-white overflow-hidden",
        mobileDetail ? "hidden md:flex" : "flex"
      )}>
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 font-serif">My Messages</h3>
              {unreadCount > 0 && (
                <Badge className="bg-green-700 text-white rounded-full px-2 h-5 text-[10px] font-black animate-pulse">
                  {unreadCount} NEW
                </Badge>
              )}
            </div>
            <div className="flex gap-4 mt-5">
              <button
                onClick={() => setFilter('all')}
                className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", filter === 'all' ? "text-green-700 underline underline-offset-4" : "text-gray-400 hover:text-gray-600")}
              >
                Inbox
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", filter === 'unread' ? "text-green-700 underline underline-offset-4" : "text-gray-400 hover:text-gray-600")}
              >
                Unread
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-10">
              <MessageSquare className="w-12 h-12 text-gray-50 mb-4" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No active messages</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelect(conv)}
                className={cn(
                  "w-full text-left p-8 border-b border-gray-50 transition-all relative group",
                  selectedId === conv.id ? "bg-[#f0f7f0]/50" : "hover:bg-gray-50/50"
                )}
              >
                {conv.buyer_unread_count > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-700" />
                )}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                    <Store className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className={cn("text-sm truncate", conv.buyer_unread_count > 0 ? "font-black text-gray-900" : "font-bold text-gray-600")}>
                        {conv.vendor_name}
                      </p>
                      <span className="text-[9px] font-black text-gray-400 whitespace-nowrap ml-2 uppercase tracking-tight">
                        {relativeTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-[#1d631d] border-[#1d631d]/20">
                        {conv.product_name}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 truncate line-clamp-1 italic">
                      Tap to view latest message...
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
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white z-10 shadow-sm shadow-gray-50">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileDetail(false)}
                  className="md:hidden w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h4 className="text-xl font-black text-gray-900 font-serif leading-none">{selected.vendor_name}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    {selected.market_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Message Body - Chat Interface */}
            <div className="flex-1 overflow-hidden">
              <InquiryChat
                conversationId={selected.id}
                role="buyer"
                vendorName={selected.vendor_name}
                buyerName="You"
              />
            </div>

            {/* Footer with product details */}
            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center border border-gray-100">
                  <MessageSquare className="w-4 h-4 text-green-700 opacity-50" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Product Details</p>
                  <p className="text-sm font-black text-gray-900 leading-none">
                    {selected.product_name}
                  </p>
                </div>
              </div>
              {selected.price && (
                <div className="ml-auto text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Reported Price</p>
                  <p className="text-sm font-black text-green-700">
                    ₱{Number(selected.price).toFixed(2)} / {selected.unit}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-24">
            <div className="w-24 h-24 bg-[#f0f7f0] rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-green-700/20" />
            </div>
            <h4 className="text-2xl font-black text-gray-900 font-serif">Select a conversation</h4>
            <p className="text-sm text-gray-400 max-w-xs mt-3 leading-relaxed font-medium">Choose a connection from your inbox to view your conversation history with vendors.</p>
          </div>
        )}
      </div>
    </div>
  )
}
