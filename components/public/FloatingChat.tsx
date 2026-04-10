'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  sendMessage, 
  markConversationRead,
  markMessagesDelivered,
  markMessagesSeen 
} from '@/lib/actions/messenger'
import {
  MessageCircle,
  Search,
  Send,
  X,
  ChevronDown,
  ShoppingBag,
  Loader2,
  Plus,
  Store,
  Clock,
  ArrowLeft,
  Minimize2,
  Maximize2,
  AlertCircle,
  Smile,
  Image,
  Video,
  FileText,
  Package,
  Printer,
  Check,
  CheckCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const ProductInquiryCard = ({ product, text, isMe }: { product: any, text: string, isMe: boolean }) => {
  return (
    <div className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
      <div className="bg-white dark:bg-white/5 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/10 p-4 mb-2 max-w-[320px] animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 dark:bg-black/20 flex-shrink-0 border border-gray-50 dark:border-white/5">
            {product.image ? (
              <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-gray-200 dark:text-gray-700" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
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
        "px-4 py-2 my-[1px] text-[13px] font-medium leading-normal shadow-none transition-all whitespace-pre-wrap",
        isMe
          ? "bg-[#1b6b3e] text-white rounded-[1.25rem] rounded-tr-none shadow-[#16502e]/5"
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
      <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
        <CheckCheck className="w-3.5 h-3.5" />
      </div>
    )
  }
  return null
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'chat'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [vendorOnlineStatuses, setVendorOnlineStatuses] = useState<Record<string, { is_online: boolean, last_seen_at: string }>>({})

  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Auth & Init
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      fetchConversations(session.user.id)
    }
    init()
  }, [])

  async function fetchConversations(uid: string) {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('buyer_id', uid)
      .order('last_message_at', { ascending: false })
    setConversations(data || [])
    return data || []
  }

  // Fetch vendor online statuses in batch & subscribe to changes
  useEffect(() => {
    if (conversations.length === 0) return

    const vendorIds = [...new Set(conversations.map(c => c.vendor_id))]

    async function fetchVendorStatuses() {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, is_online, last_seen_at')
        .in('id', vendorIds)

      if (!error && data) {
        const statusMap = data.reduce((acc: any, vendor: any) => {
          acc[vendor.id] = {
            is_online: vendor.is_online,
            last_seen_at: vendor.last_seen_at
          }
          return acc
        }, {})
        setVendorOnlineStatuses(statusMap)
      }
    }

    fetchVendorStatuses()

    // Realtime subscription for vendor presence
    const presenceChannel = supabase
      .channel('vendor-presence')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vendors',
        },
        (payload) => {
          const updated = payload.new as any
          if (vendorIds.includes(updated.id)) {
            setVendorOnlineStatuses(prev => ({
              ...prev,
              [updated.id]: {
                is_online: updated.is_online,
                last_seen_at: updated.last_seen_at
              }
            }))
          }
        }
      )
      .subscribe()

    // Refresh vendor statuses every 30 seconds
    const interval = setInterval(fetchVendorStatuses, 30000)
    
    return () => {
      supabase.removeChannel(presenceChannel)
      clearInterval(interval)
    }
  }, [conversations, supabase])

  // Subscribe to RT updates for conversations
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('floating_convs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `buyer_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setConversations(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setConversations(prev => {
            const index = prev.findIndex(c => c.id === payload.new.id)
            if (index === -1) return [payload.new, ...prev]
            const copy = [...prev]
            copy[index] = payload.new
            return copy.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
          })

          // Sync active if matches
          if (activeConversation?.id === payload.new.id) {
            setActiveConversation(payload.new)
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, activeConversation?.id])

  // Custom event listener to open from outside
  useEffect(() => {
    const handler = (e: any) => {
      setIsOpen(true)
      setIsMinimized(false)
      if (e.detail?.conversationId) {
        const conv = conversations.find(c => c.id === e.detail.conversationId)
        if (conv) {
          handleSelectConversation(conv)
        } else {
          fetchConversations(userId!).then(updatedConvs => {
            const fresh = updatedConvs?.find((c: any) => c.id === e.detail.conversationId)
            if (fresh) handleSelectConversation(fresh)
          })
        }
      }
    }
    window.addEventListener('open-chat', handler)
    window.addEventListener('open-conversation', handler)
    return () => {
      window.removeEventListener('open-chat', handler)
      window.removeEventListener('open-conversation', handler)
    }
  }, [userId, conversations])

  // Message Fetch & Subscription
  useEffect(() => {
    if (!activeConversation || !userId) return

    async function loadMessages() {
      setLoading(true)
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true })

      setMessages(data || [])
      setLoading(false)
      setTimeout(scrollToBottom, 50)

      // Mark vendor messages as delivered
      const vendorSentMessages = (data || [])
        .filter(m => m.sender_type === 'vendor' && m.status === 'sent')

      if (vendorSentMessages.length > 0) {
        await markMessagesDelivered(activeConversation.id, 'vendor')
      }

      // Mark conversation as read
      await markConversationRead(activeConversation.id, 'buyer')

      // Mark delivered vendor messages as seen
      const deliveredMessages = (data || [])
        .filter(m => m.sender_type === 'vendor' && m.status === 'delivered')
        .map(m => m.id)

      if (deliveredMessages.length > 0) {
        await markMessagesSeen(deliveredMessages)
      }
    }

    loadMessages()

    const channel = supabase
      .channel(`floating_chat_${activeConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversation.id}`
      }, async (payload) => {
        const newMsg = payload.new as any
        
        // Add message to local state first for instant UI response
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })

        // Receiver-side logic: Mark incoming vendor messages as seen immediately
        if (newMsg.sender_type === 'vendor') {
           await markMessagesSeen([newMsg.id])
           // Delivered status is redundant if we're marking as seen, 
           // but we can call it just in case non-seen status is needed elsewhere
           if (newMsg.status === 'sent') {
              await markMessagesDelivered(activeConversation.id, 'vendor')
           }
        }
        
        setTimeout(scrollToBottom, 50)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversation.id}`
      }, (payload) => {
        // Update message status when vendor updates it
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeConversation?.id, userId, supabase])

  const handleSelectConversation = (conv: any) => {
    setActiveConversation(conv)
    setView('chat')
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || !activeConversation || sending) return

    setSending(true)
    const content = reply
    setReply('')

    try {
      await sendMessage({
        conversationId: activeConversation.id,
        senderType: 'buyer',
        content: content
      })
    } catch (err) {
      console.error(err)
      setReply(content)
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeConversation || !userId) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
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
      await sendMessage({
        conversationId: activeConversation.id,
        senderType: 'buyer',
        content: JSON.stringify({
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: publicUrl,
          name: file.name,
          size: file.size
        })
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
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(c =>
      c.vendor_name.toLowerCase().includes(q) ||
      c.product_name.toLowerCase().includes(q)
    )
  }, [conversations, searchQuery])

  const filteredMessages = messages

  if (!userId) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">

      {isOpen && (
        <div className={cn(
          "bg-white rounded-[2rem] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 pointer-events-auto",
          isMinimized ? "h-16 w-16 rounded-full" : "h-[620px]",
          !isMinimized && (isExpanded ? "w-[95vw] sm:w-[820px]" : "w-[95vw] sm:w-[420px]")
        )}>

          {isMinimized ? (
            <button
              onClick={() => setIsMinimized(false)}
              className="w-full h-full flex items-center justify-center bg-[#1b6b3e] text-white rounded-full hover:bg-[#1b6b3e] transition-colors"
            >
              <div className="relative">
                <MessageCircle className="w-7 h-7" />
                {conversations.some(c => c.buyer_unread_count > 0) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                )}
              </div>
            </button>
          ) : (
            <>
              {/* Header */}
              <div className="h-12 bg-white border-b border-gray-100 px-4 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[#1b6b3e] font-bold text-lg whitespace-nowrap">Chat</span>
                  <span className="text-[#1b6b3e] text-sm hidden sm:inline">({conversations.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors hidden sm:flex"
                    title={isExpanded ? "Show chat list only" : "Show whole window"}
                  >
                    {isExpanded ? (
                      <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M1.5 1h13a.5.5 0 01.5.5v13a.5.5 0 01-.5.5h-13a.5.5 0 01-.5-.5v-13a.5.5 0 01.5-.5zM2 14h12V2H2v12zm8-11h3v3h-1V4h-2V3zM3 10h1v2h2v1H3v-3z"/></svg>
                    ) : (
                      <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M1.5 1h13a.5.5 0 01.5.5v13a.5.5 0 01-.5.5h-13a.5.5 0 01-.5-.5v-13a.5.5 0 01.5-.5zM2 14h12V2H2v12zm10-10h-2V3h3v3h-1V4zM4 12h2v1H3v-3h1v2z"/></svg>
                    )}
                  </button>
                  <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                    <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M1.5 1h13a.5.5 0 01.5.5v13a.5.5 0 01-.5.5h-13a.5.5 0 01-.5-.5v-13a.5.5 0 01.5-.5zM2 14h12V2H2v12zm2-2h8v-1H4v1z"/></svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 flex overflow-hidden bg-white">
                {/* Always show list in expanded mode OR if view is list */}
                {(isExpanded || view === 'list') && (
                  <div className={cn(
                    "flex flex-col border-r border-gray-100 transition-all duration-300",
                    isExpanded ? "w-[320px] shrink-0" : "w-full"
                  )}>
                    <div className="p-3 bg-white border-b border-gray-50 flex items-center gap-2">
                      <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search name"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-8 bg-gray-50 border border-gray-100 rounded-md pl-8 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                        />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-100 rounded-md cursor-pointer hover:bg-gray-50">
                        <span className="text-[10px] font-medium text-gray-600">All</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {filteredConversations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                          <MessageCircle className="w-8 h-8 mb-4 text-gray-300" />
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No messages</p>
                        </div>
                      ) : filteredConversations.map(conv => (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv)}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-2xl transition-all relative overflow-hidden border-b border-gray-50",
                            activeConversation?.id === conv.id ? "bg-gray-100" : "hover:bg-gray-50",
                            "group"
                          )}
                        >
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-[#1b6b3e] font-bold text-sm">
                              {conv.vendor_name.charAt(0)}
                            </div>
                            {vendorOnlineStatuses[conv.vendor_id]?.is_online && (
                              <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-28 relative">
                            <h3 className="text-[13px] font-black text-gray-900 tracking-tight">
                              {conv.vendor_name}
                            </h3>
                            <div className="flex flex-col">
                              <p className={cn(
                                "text-[9px] font-bold uppercase tracking-wider leading-tight",
                                vendorOnlineStatuses[conv.vendor_id]?.is_online ? "text-green-600" : "text-gray-400"
                              )}>
                                {vendorOnlineStatuses[conv.vendor_id]?.is_online 
                                  ? 'Active now' 
                                  : `Active ${vendorOnlineStatuses[conv.vendor_id]?.last_seen_at ? formatDistanceToNow(new Date(vendorOnlineStatuses[conv.vendor_id].last_seen_at), { addSuffix: true }).replace('about ', '') : 'Offline'}`}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5 font-medium">
                                {conv.product_name}
                              </p>
                            </div>
                          </div>
                          <div className="absolute right-3 top-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                            {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false }).replace('about ', '') : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show chat area if expanded or view is chat */}
                {(isExpanded || view === 'chat') && (
                  <div className="flex-1 flex flex-col bg-[#f5f5f5] relative">
                    {!activeConversation && isExpanded ? (
                       <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
                        <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Select a conversation to start chatting</p>
                      </div>
                    ) : (
                      <>
                        {/* Chat Header */}
                        <div className="h-10 bg-white border-b border-gray-100 flex items-center px-4 shrink-0">
                          <button onClick={() => !isExpanded && setView('list')} className="flex items-center gap-1 hover:bg-gray-50 px-1 rounded transition-colors group">
                            <span className="text-xs font-bold text-gray-800">{activeConversation?.vendor_name}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                          </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                          {loading ? (
                            <div className="h-full flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-[#1b6b3e] animate-spin" />
                            </div>
                          ) : filteredMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                              <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                Start the conversation
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-center my-4">
                                <span className="px-3 py-1 bg-gray-200/50 rounded-full text-[10px] text-gray-500 font-medium">{format(new Date(), 'd MMM')}</span>
                              </div>
                              
                              {filteredMessages.map((msg, i) => {
                                const isBuyer = msg.sender_type === 'buyer'
                                return (
                                  <div key={msg.id} className={cn(
                                    "flex flex-col mb-4",
                                    isBuyer ? "items-end" : "items-start"
                                  )}>
                                    <div className="flex items-end gap-2 max-w-[85%]">
                                      {!isBuyer && (
                                        <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-[#1b6b3e] font-bold text-[10px] shrink-0">
                                          {activeConversation?.vendor_name?.charAt(0)}
                                        </div>
                                      )}
                                      <div className="flex flex-col">
                                        <div className={cn(
                                          "px-3 py-2.5 text-[13px] leading-relaxed shadow-sm border",
                                          isBuyer
                                            ? "bg-[#eeffde] border-[#d8f0be] text-gray-800 rounded-xl rounded-tr-none"
                                            : "bg-white border-gray-100 text-gray-800 rounded-xl rounded-tl-none"
                                        )}>
                                          {(() => {
                                            try {
                                              const data = JSON.parse(msg.content)
                                              if (data.type === 'image') {
                                                return (
                                                  <div className="rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                                                    <img 
                                                      src={data.url} 
                                                      alt="Sent image" 
                                                      className="max-w-full h-auto max-h-[300px] object-contain cursor-zoom-in" 
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
                                                      "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left w-full",
                                                      isBuyer 
                                                        ? "bg-white border-[#1b6b3e]/20 text-[#1b6b3e] hover:bg-white/90" 
                                                        : "bg-white border-gray-100 text-gray-900 hover:bg-gray-50"
                                                    )}
                                                  >
                                                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                                                      <FileText className="w-5 h-5 text-[#1b6b3e]" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-[12px] font-black truncate max-w-[150px]">{data.name || 'Attachment'}</p>
                                                      <p className="text-[9px] opacity-60 uppercase font-black tracking-widest">{data.size ? (data.size / 1024).toFixed(1) + ' KB' : 'Download Attachment'}</p>
                                                    </div>
                                                  </button>
                                                )
                                              }
                                              if (data.type === 'product_inquiry') {
                                                return <ProductInquiryCard product={data.product} text={data.text} isMe={isBuyer} />
                                              }
                                            } catch (e) {}
                                            return msg.content
                                          })()}
                                        </div>
                                        <span className="text-[9px] text-gray-400 mt-1 font-medium px-1">
                                          {format(new Date(msg.created_at), 'HH:mm')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </>
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Safety Box & Input */}
                        <div className="bg-white border-t border-gray-100 p-2">
                          <div className="mx-2 mb-2 p-3 bg-green-50/50 border border-green-100 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-[10px] text-gray-600 leading-normal font-medium">
                                Safety tip: Always chat and complete transactions inside BCMIS to protect yourself from scams. Do not share your personal information.
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <button className="text-[10px] text-[#1b6b3e] font-bold hover:underline">Learn More</button>
                                <span className="text-gray-200 text-[10px]">|</span>
                                <button className="text-[10px] text-[#1b6b3e] font-bold hover:underline">Report User</button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white px-2 pt-2">
                             <form onSubmit={handleSend} className="relative group">
                              <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend(e)
                                  }
                                }}
                                placeholder="Type a message here"
                                className="w-full bg-white border-none text-[13px] placeholder:text-gray-400 focus:ring-0 resize-none min-h-[40px] max-h-32 scrollbar-hide py-1 px-1"
                              />
                              
                              <div className="flex items-center justify-between pb-1 pt-2 border-t border-gray-50">
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    onChange={handleImageUpload}
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className={cn("p-1.5 text-gray-400 hover:text-[#1b6b3e] transition-colors rounded-full hover:bg-gray-50", isUploading && "animate-pulse")}
                                    title="Send Image"
                                  >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 text-green-600" />}
                                  </button>
                                </div>
                                <button
                                  type="submit"
                                  disabled={!reply.trim() || sending}
                                  className="p-1.5 text-gray-300 disabled:opacity-30 hover:text-[#1b6b3e] transition-all"
                                >
                                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-5 h-5 transition-transform" />}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-16 h-16 rounded-full bg-green-700 shadow-2xl flex items-center justify-center group hover:scale-110 hover:-translate-y-1 active:scale-90 transition-all pointer-events-auto relative",
            conversations.some(c => c.buyer_unread_count > 0) && "ring-4 ring-green-100 ring-offset-0"
          )}
        >
          <div className="absolute top-0 right-0 w-5 h-5 bg-black rounded-full flex items-center justify-center text-[8px] font-black text-white translate-x-1 -translate-y-1 shadow-md">
            {conversations.length}
          </div>
          <MessageCircle className="w-7 h-7 text-white fill-current group-hover:scale-110 transition-transform" />

          {conversations.some(c => c.buyer_unread_count > 0) && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-green-700 rounded-full" />
          )}
        </button>
      )}
    </div>
  )
}
