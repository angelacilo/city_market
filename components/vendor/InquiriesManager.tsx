'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  sendVendorMessage,
  markConversationRead,
  markMessagesDelivered,
  markMessagesSeen
} from '@/lib/actions/messenger'
import {
  MessageCircle,
  Search,
  Send,
  ShoppingBag,
  Loader2,
  Inbox,
  Clock,
  MoreVertical,
  Check,
  AlertCircle,
  CheckCheck,
  Image as ImageIcon,
  Plus,
  FileText
} from 'lucide-react'
import NextImage from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'

const ProductInquiryCard = ({ product, text, isMe }: { product: any, text: string, isMe: boolean }) => {
  return (
    <div className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
      <div className="bg-white dark:bg-white/5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/10 p-4 mb-2 max-w-[320px] animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50 dark:bg-black/20 flex-shrink-0 border border-gray-50 dark:border-white/5">
            {product.image ? (
              <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-gray-200 dark:text-gray-700" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] leading-none mb-1.5">Currently Discussing</p>
            <h4 className="text-[13px] font-black text-gray-900 dark:text-white truncate leading-tight uppercase mb-1">{product.name}</h4>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-black text-[#1b6b3e] dark:text-green-500">₱{product.price?.toFixed(2)} <span className="text-[9px] font-medium text-gray-400 dark:text-gray-600">/ {product.unit}</span></span>
              <div className="bg-gray-100 dark:bg-green-500/10 text-gray-500 dark:text-green-500 rounded-lg text-[8px] font-black uppercase tracking-tighter px-2 py-0.5">In Stock</div>
            </div>
          </div>
        </div>
      </div>
      <div className={cn(
        "px-4 py-2 my-[1px] text-[15px] font-medium leading-normal shadow-none transition-all whitespace-pre-wrap",
        isMe
          ? "bg-[#1b6b3e] text-white rounded-[1.25rem] rounded-tr-none shadow-green-900/5"
          : "bg-[#f0f0f0] dark:bg-white/10 text-gray-900 dark:text-white rounded-[1.25rem] rounded-tl-none"
      )}>
        {text}
      </div>
    </div>
  )
}

const MessageStatusIndicator = ({ status }: { status: string }) => {
  if (status === 'sent') {
    return (
      <div className="flex items-center gap-1 text-gray-400 dark:text-gray-600">
        <Check className="w-3.5 h-3.5" />
      </div>
    )
  } else if (status === 'delivered') {
    return (
      <div className="flex items-center gap-1 text-gray-400 dark:text-gray-600">
        <CheckCheck className="w-3.5 h-3.5" />
      </div>
    )
  } else if (status === 'seen') {
    return (
      <div className="flex items-center gap-1 text-green-500">
        <CheckCheck className="w-3.5 h-3.5" />
      </div>
    )
  }
  return null
}

export default function InquiriesManager({ initialConversations, vendorId: initialVendorId }: { initialConversations: any[], vendorId: string }) {
  const [vendorId, setVendorId] = useState<string>(initialVendorId)
  const [conversations, setConversations] = useState<any[]>(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [reply, setReply] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [buyerOnlineStatuses, setBuyerOnlineStatuses] = useState<Record<string, { is_online: boolean, last_seen_at: string }>>({})
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConversation = useMemo(() =>
    conversations.find(c => c.id === activeConversationId),
    [conversations, activeConversationId]
  )

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Effect to handle Realtime subscriptions
  useEffect(() => {
    if (!vendorId) return

    // 1. Subscribe to conversation updates (new conversations or header updates)
    const convChannel = supabase
      .channel(`vendor-conversations-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `vendor_id=eq.${vendorId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the full record with buyer profile
            const { data } = await supabase
              .from('conversations')
              .select('*, buyer_profiles:buyer_id(id, full_name, contact_number, barangay)')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setConversations(prev => [data, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => {
              const idx = prev.findIndex(c => c.id === payload.new.id)
              if (idx === -1) return [payload.new, ...prev]
              const newArr = [...prev]
              newArr[idx] = { ...prev[idx], ...payload.new }
              // Re-sort by last_message_at
              return newArr.sort((a, b) =>
                new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              )
            })
          }
        }
      )
      .subscribe()

    // 2. Subscribe to messages for the current vendor
    const messagesChannel = supabase
      .channel(`vendor-messages-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as any
          if (!newMsg) return

          // Only care about messages belonging to one of our conversations
          const conversationExists = conversations.some(c => c.id === newMsg.conversation_id)
          if (!conversationExists) return

          if (payload.eventType === 'INSERT') {
            // Update messages list if it's the active conversation
            if (newMsg.conversation_id === activeConversationId) {
              setMessages(prev => {
                const alreadyExists = prev.some(m => m.id === newMsg.id)
                if (alreadyExists) return prev
                return [...prev, newMsg]
              })

              // Mark as delivered/seen if from buyer
              if (newMsg.sender_type === 'buyer') {
                if (newMsg.status !== 'seen') {
                  markMessagesSeen([newMsg.id])
                } else if (newMsg.status === 'sent') {
                  markMessagesDelivered(newMsg.conversation_id, 'buyer')
                }
              }

              // Auto-scroll
              setTimeout(() => scrollToBottom('smooth'), 100)
            }
          } else if (payload.eventType === 'UPDATE') {
            if (newMsg.conversation_id === activeConversationId) {
              setMessages(prev => prev.map(m => m.id === newMsg.id ? newMsg : m))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(convChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [vendorId, activeConversationId, conversations, supabase])

  // Fetch buyer online statuses in batch & subscribe to changes
  useEffect(() => {
    if (conversations.length === 0) return

    const buyerIds = [...new Set(conversations.map(c => c.buyer_id))]

    async function fetchBuyerStatuses() {
      const { data, error } = await supabase
        .from('buyer_profiles')
        .select('user_id, is_online, last_seen_at')
        .in('user_id', buyerIds)

      if (!error && data) {
        const statusMap = data.reduce((acc: any, profile: any) => {
          acc[profile.user_id] = {
            is_online: profile.is_online,
            last_seen_at: profile.last_seen_at
          }
          return acc
        }, {})
        setBuyerOnlineStatuses(statusMap)
      }
    }

    fetchBuyerStatuses()

    // Realtime subscription for presence
    const presenceChannel = supabase
      .channel('buyer-presence')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'buyer_profiles',
        },
        (payload) => {
          const updated = payload.new as any
          if (buyerIds.includes(updated.user_id)) {
            setBuyerOnlineStatuses(prev => ({
              ...prev,
              [updated.user_id]: {
                is_online: updated.is_online,
                last_seen_at: updated.last_seen_at
              }
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [conversations, supabase])

  // Fetch messages when active conversation changes
  useEffect(() => {
    const convId = activeConversationId
    if (!convId) return

    // Capture in a non-nullable local for the async closure
    const currentConvId: string = convId

    async function loadMessages() {
      setLoadingMessages(true)
      try {
        // Mark conversation as read (on server)
        await markConversationRead(currentConvId, 'vendor')

        // Fetch messages
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', currentConvId)
          .order('created_at', { ascending: true })

        if (error) throw error
        setMessages(data || [])

        // Mark unread buyer messages as seen
        const deliveredMessagesFromBuyer = (data || [])
          .filter(m => m.sender_type === 'buyer' && m.status !== 'seen')
          .map(m => m.id)

        if (deliveredMessagesFromBuyer.length > 0) {
          await markMessagesSeen(deliveredMessagesFromBuyer)
        }

        setTimeout(() => scrollToBottom('auto'), 50)
      } catch (err) {
        console.error('Error loading messages:', err)
      } finally {
        setLoadingMessages(false)
      }
    }

    loadMessages()
  }, [activeConversationId, supabase])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const convId = activeConversationId
    if (!reply.trim() || !convId || !vendorId) return

    // Ensure non-null for TS
    const currentConvId: string = convId

    setSending(true)
    const content = reply
    setReply('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await sendVendorMessage({
        conversationId: currentConvId,
        content,
        vendorUserId: user.id
      })
    } catch (err) {
      console.error('Error sending message:', err)
      setReply(content)
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeConversation || !vendorId) return

    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `chat_attachments/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(filePath)

      // Send as structured message
      await sendVendorMessage({
        conversationId: activeConversation.id,
        content: JSON.stringify({
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: publicUrl,
          name: file.name,
          size: file.size
        }),
        vendorUserId: user.id
      })

    } catch (err: any) {
      console.error('Attachment upload failed:', err)
      alert(`Failed to upload attachment: ${err.message || 'Unknown error'}. Please ensure the bucket "chat_attachments" exists and is Public.`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return conversations
    return conversations.filter(c =>
      (c.product_name || '').toLowerCase().includes(q) ||
      (c.buyer_profiles?.full_name || '').toLowerCase().includes(q)
    )
  }, [conversations, searchQuery])

  const filteredMessages = messages

  if (error) {
    return (
      <div className="bg-white dark:bg-[#0a0f0a] rounded-none border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-gray-900 dark:text-white font-semibold mb-2">Protocol Error</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white dark:bg-[#0a0f0a] overflow-hidden animate-in fade-in duration-700">
      
      {/* Main Chat Interface */}
      <div className="flex h-full w-full relative transition-all duration-500 overflow-hidden">

      {/* Sidebar - Independent Scroll */}
      <div className="w-96 border-r border-gray-100 dark:border-white/5 flex flex-col h-full bg-white dark:bg-[#0a0f0a] shrink-0">
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none font-serif italic">Chats</h2>
            <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer transition-colors border border-gray-100 dark:border-white/5">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="relative group mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#1b6b3e] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-in fade-in duration-700">
              <Inbox className="w-16 h-16 text-gray-100 dark:text-white/5 mb-6" />
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.3em] leading-loose">No active <br /> communications</p>
            </div>
          ) : (
            filteredConversations.map(c => {
              const isActive = c.id === activeConversationId
              const hasUnread = c.vendor_unread_count > 0
              const buyerStatus = buyerOnlineStatuses[c.buyer_id]
              const isOnline = buyerStatus?.is_online

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConversationId(c.id)}
                  className={cn(
                    "w-full text-left p-5 rounded-[2rem] transition-all relative group overflow-hidden border border-transparent",
                    isActive
                      ? "bg-white dark:bg-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.06)] dark:shadow-none border-gray-100 dark:border-white/5"
                      : "hover:bg-gray-50 dark:hover:bg-white/5"
                  )}
                >
                  {isActive && <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-[#1b6b3e] rounded-r-full shadow-[0_0_12px_rgba(27,107,62,0.4)]" />}

                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-base shadow-sm border border-gray-100 dark:border-white/5 transition-all overflow-hidden",
                        hasUnread
                          ? "bg-green-700 text-white"
                          : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600"
                      )}>
                        {(c.buyer_profiles?.full_name || 'B')[0]}
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white dark:border-[#0a0f0a] transition-colors",
                        isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-gray-300 dark:bg-gray-800"
                      )} />
                    </div>

                    <div className="flex-1 min-w-0 pr-28 relative">
                      <div className="flex items-center gap-1 mb-1">
                        <h3 className={cn(
                          "text-[14px] font-black tracking-tight",
                          isActive ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                        )}>
                          {c.buyer_profiles?.full_name || 'Anonymous Buyer'}
                        </h3>
                        {hasUnread && <div className="w-2.5 h-2.5 bg-green-600 rounded-full shrink-0 shadow-[0_0_12px_rgba(22,163,74,0.4)]" />}
                      </div>

                      <div className="flex flex-col gap-0.5 mb-1.5">
                        <p className={cn(
                          "text-[9px] font-black uppercase tracking-[0.2em] leading-tight",
                          isOnline ? "text-green-600" : "text-gray-400 dark:text-gray-600"
                        )}>
                          {isOnline ? 'Active now' : `Active ${buyerStatus?.last_seen_at ? formatDistanceToNow(new Date(buyerStatus.last_seen_at), { addSuffix: true }).replace('about ', '') : 'Offline'}`}
                        </p>
                        <p className={cn(
                          "text-[11px] font-medium text-gray-500 dark:text-gray-600 truncate leading-tight",
                        )}>
                          {c.last_sender_type === 'vendor' && <span className="text-green-700 font-black mr-1 uppercase text-[8px]">Me:</span>}
                          {(() => {
                            if (!c.last_message_content) return 'Waiting for synchronization...'
                            try {
                              const data = JSON.parse(c.last_message_content)
                              if (data.type === 'product_inquiry') return data.text
                              if (data.type === 'image') return 'Sent an image'
                              if (data.type === 'file') return `Sent an attachment: ${data.name || ''}`
                              return c.last_message_content
                            } catch (e) {
                              return c.last_message_content
                            }
                          })()}
                        </p>
                      </div>

                      <div className="flex items-center text-[9px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest absolute right-0 top-1 whitespace-nowrap">
                        {c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false }).replace('about ', '') : ''}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f140f]/30 relative overflow-hidden transition-colors duration-500">
        {!activeConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-1000">
            <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-8 border border-gray-100 dark:border-white/5 shadow-inner">
              <MessageCircle className="w-8 h-8 text-gray-200 dark:text-white/10" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 font-serif italic tracking-tight">Select a conversation</h2>
            <p className="text-gray-400 dark:text-gray-500 text-xs max-w-xs font-medium leading-relaxed">Choose from your existing inquiries to start messaging and close deals.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-24 px-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/90 dark:bg-black/60 backdrop-blur-xl shrink-0 z-10">
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/10 flex items-center justify-center font-black text-gray-500 dark:text-gray-400 overflow-hidden relative shadow-sm border border-gray-100 dark:border-white/5">
                    {activeConversation?.buyer_profiles?.avatar_url ? (
                      <NextImage
                        src={activeConversation.buyer_profiles.avatar_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      (activeConversation?.buyer_profiles?.full_name || 'B')[0]
                    )}
                  </div>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-[#0a0f0a] shadow-sm",
                    buyerOnlineStatuses[activeConversation?.buyer_id]?.is_online ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  )} />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                    {activeConversation?.buyer_profiles?.full_name || 'Authenticated Buyer'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em]",
                      buyerOnlineStatuses[activeConversation?.buyer_id]?.is_online ? "text-green-600 dark:text-green-500" : "text-gray-400 dark:text-gray-600"
                    )}>
                      {buyerOnlineStatuses[activeConversation?.buyer_id]?.is_online 
                        ? 'Active Node Connection' 
                        : `Last active: ${activeConversation?.buyer_profiles?.last_seen_at ? formatDistanceToNow(new Date(activeConversation.buyer_profiles.last_seen_at), { addSuffix: true }) : 'Offline'}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl text-gray-400 hover:text-[#1b6b3e] hover:bg-green-50 dark:hover:bg-white/10 transition-all border border-transparent hover:border-green-100 dark:hover:border-white/5">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area - Independent Scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar bg-gray-50/10 dark:bg-black/20">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#1b6b3e] animate-spin" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Deciphering Content</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  {filteredMessages.map((m, idx) => {
                    const isMe = m.sender_type === 'vendor'
                    const showTime = idx === 0 || (new Date(m.created_at).getTime() - new Date(filteredMessages[idx - 1].created_at).getTime() > 1000 * 60 * 30)

                    return (
                      <div key={m.id} className="flex flex-col w-full">
                        {showTime && (
                          <div className="w-full text-center py-10">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em]">
                              --- {format(new Date(m.created_at), 'MMMM d, yyyy • h:mm a')} ---
                            </span>
                          </div>
                        )}
                        <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[80%]", isMe ? "items-end text-right" : "items-start text-left")}>
                            {(() => {
                              try {
                                const data = JSON.parse(m.content)
                                if (data.type === 'image') {
                                  return (
                                    <div className={cn(
                                      "rounded-2xl overflow-hidden border bg-white dark:bg-white/5 shadow-sm",
                                      isMe ? "border-green-100" : "border-gray-100 dark:border-white/5"
                                    )}>
                                      <img 
                                        src={data.url} 
                                        alt="Sent image" 
                                        className="max-w-full h-auto max-h-[400px] object-contain cursor-zoom-in hover:opacity-95 transition-opacity" 
                                        onClick={() => window.open(data.url, '_blank')}
                                      />
                                    </div>
                                  )
                                }
                                if (data.type === 'file') {
                                  return (
                                    <button 
                                      onClick={() => window.open(data.url, '_blank')}
                                      className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left",
                                        isMe 
                                          ? "bg-white/10 border-white/20 text-white hover:bg-white/20" 
                                          : "bg-white border-gray-100 text-gray-900 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white"
                                      )}
                                    >
                                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-[#1b6b3e]" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate max-w-[150px]">{data.name || 'Attachment'}</p>
                                        <p className="text-[9px] opacity-60 uppercase font-black tracking-widest">{data.size ? (data.size / 1024).toFixed(1) + ' KB' : 'File'}</p>
                                      </div>
                                    </button>
                                  )
                                }
                                if (data.type === 'product_inquiry') {
                                  return <ProductInquiryCard product={data.product} text={data.text} isMe={isMe} />
                                }
                              } catch (e) { }
                              return (
                                <div className={cn(
                                  "px-6 py-3.5 text-[15px] font-medium leading-relaxed transition-all whitespace-pre-wrap shadow-sm",
                                  isMe
                                    ? "bg-[#1b6b3e] text-white rounded-[1.75rem] rounded-tr-[0.5rem] shadow-xl shadow-green-900/10"
                                    : "bg-white dark:bg-white/10 text-gray-900 dark:text-white rounded-[1.75rem] rounded-tl-[0.5rem] border border-gray-100 dark:border-white/5"
                                )}>
                                  {m.content}
                                </div>
                              )
                            })()}

                            {isMe && (
                              <div className="flex justify-end mt-1.5 px-2">
                                <MessageStatusIndicator status={m.status || 'sent'} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-8 pb-10 bg-white dark:bg-black/40 backdrop-blur-md border-t border-gray-100 dark:border-white/5 shrink-0 z-10 transition-colors">
              <form onSubmit={handleSend} className="relative group">
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={handleImageUpload}
                  />
                  <div className="flex items-center gap-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={cn("w-9 h-9 rounded-xl text-gray-400 hover:text-[#1b6b3e] hover:bg-green-50", isUploading && "animate-pulse")}
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 text-green-600" />}
                    </Button>
                  </div>
                </div>
                
                <div className="relative">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Provide procurement signal response..."
                    className="w-full bg-gray-50/50 dark:bg-white/5 border-none rounded-3xl pl-6 pr-16 py-5 text-base font-medium focus:ring-2 focus:ring-[#1b6b3e]/10 transition-all resize-none min-h-[72px] max-h-48 scrollbar-hide dark:text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(e)
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={!reply.trim() || sending}
                    className="absolute right-3 bottom-2.5 w-12 h-12 bg-[#1b6b3e] hover:bg-green-800 text-white rounded-2xl shadow-xl shadow-green-900/20 transition-all group-focus-within:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  )
}
