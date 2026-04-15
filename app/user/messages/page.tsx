'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
   ShoppingBag,
   Store,
   Loader2,
   Inbox,
   Clock,
   ArrowLeft,
   Check,
   CheckCheck,
   MoreVertical,
   AlertCircle,
   ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const MessageStatusIndicator = ({ status, avatarUrl }: { status: string, avatarUrl?: string }) => {
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
      <div className="flex items-center gap-1">
        {avatarUrl ? (
          <div className="relative w-4 h-4 rounded-full overflow-hidden border border-green-500/20">
             <Image src={avatarUrl} alt="" fill className="object-cover" />
          </div>
        ) : (
          <div className="text-green-500">
            <CheckCheck className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    )
  }
  return null
}


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
            "px-5 py-3.5 my-[1px] text-[15px] font-medium leading-normal transition-all whitespace-pre-wrap shadow-sm",
            isMe
               ? "bg-[#1b6b3e] text-white rounded-[1.75rem] rounded-tr-none shadow-green-900/10"
               : "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-[1.75rem] rounded-tl-none border border-transparent dark:border-white/5"
         )}>
            {text}
         </div>
      </div>
   )
}

function MessagesContent() {
   const router = useRouter()
   const searchParams = useSearchParams()
   const conversationParam = searchParams.get('conversation')

   const [conversations, setConversations] = useState<any[]>([])
   const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationParam)
   const [messages, setMessages] = useState<any[]>([])
   const [reply, setReply] = useState('')
   const [loading, setLoading] = useState(true)
   const [loadingMessages, setLoadingMessages] = useState(false)
   const [sending, setSending] = useState(false)
   const [userId, setUserId] = useState<string | null>(null)
   const [vendorOnlineStatuses, setVendorOnlineStatuses] = useState<Record<string, { is_online: boolean, last_seen_at: string }>>({})
   const [searchQuery, setSearchQuery] = useState('')

   const supabase = createClient()
   const messagesEndRef = useRef<HTMLDivElement>(null)

   const activeConversation = conversations.find(c => c.id === activeConversationId)

   const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
      messagesEndRef.current?.scrollIntoView({ behavior })
   }

   // Fetch vendor online statuses in batch
   useEffect(() => {
      if (conversations.length === 0) return

      async function fetchVendorStatuses() {
         const vendorIds = conversations.map(c => c.vendor_id)
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
      const interval = setInterval(fetchVendorStatuses, 30000)
      return () => clearInterval(interval)
   }, [conversations, supabase])

   // 1. Initial Auth & Conv fetch
   useEffect(() => {
      async function init() {
         const { data: { user } } = await supabase.auth.getUser()
         if (!user?.id) {
            router.push('/login?redirect=/user/messages')
            return
         }
         setUserId(user.id)

         const { data } = await supabase
            .from('conversations')
            .select('*, vendors:vendor_id(avatar_url)')
            .eq('buyer_id', user.id)
            .order('last_message_at', { ascending: false })


         setConversations(data || [])
         setLoading(false)
      }
      init()
   }, [supabase, router])

   // 2. Realtime Subscriptions
   useEffect(() => {
      if (!userId) return

      const convChan = supabase
         .channel('buyer_conversations_channel')
         .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `buyer_id=eq.${userId}`
         }, (payload) => {
            if (payload.eventType === 'INSERT') {
               supabase
                  .from('conversations')
                  .select('*, vendors:vendor_id(avatar_url)')
                  .eq('id', payload.new.id)
                  .single()
                  .then(({ data }) => {
                     if (data) setConversations(prev => [data, ...prev])
                  })
            }
 else if (payload.eventType === 'UPDATE') {
               setConversations(prev => {
                  const idx = prev.findIndex(c => c.id === payload.new.id)
                  if (idx === -1) return [payload.new, ...prev]
                  const arr = [...prev]
                  arr[idx] = { ...prev[idx], ...payload.new }
                  return arr.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
               })
            }
         })
         .subscribe()

      const msgChan = supabase
         .channel('buyer_messages_channel')
         .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'messages',
         }, async (payload) => {
            const newMsg = payload.new as any
            if (!newMsg) return

            // Check if this message belongs to one of our conversations
            const belongsToUs = conversations.some(c => c.id === newMsg.conversation_id)
            if (!belongsToUs) return

            if (payload.eventType === 'INSERT') {
               if (newMsg.conversation_id === activeConversationId) {
                  setMessages(prev => {
                     if (prev.find(m => m.id === newMsg.id)) return prev
                     return [...prev, newMsg]
                  })
                  if (newMsg.sender_type === 'vendor' && newMsg.status === 'sent') {
                     await markMessagesDelivered(newMsg.conversation_id, 'vendor')
                  }
                  setTimeout(() => scrollToBottom('smooth'), 100)
               }

               setConversations(prev => {
                  const idx = prev.findIndex(c => c.id === newMsg.conversation_id)
                  if (idx === -1) return prev
                  const arr = [...prev]
                  arr[idx] = { 
                     ...arr[idx], 
                     last_message_content: newMsg.content,
                     last_message_at: newMsg.created_at,
                     last_sender_type: newMsg.sender_type,
                     buyer_unread_count: (newMsg.conversation_id !== activeConversationId && newMsg.sender_type === 'vendor')
                        ? (arr[idx].buyer_unread_count || 0) + 1
                        : arr[idx].buyer_unread_count
                  }
                  return arr.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
               })
            } else if (payload.eventType === 'UPDATE') {
               if (newMsg.conversation_id === activeConversationId) {
                  setMessages(prev => prev.map(m => m.id === newMsg.id ? newMsg : m))
               }
            }
         })
         .subscribe()

      return () => {
         supabase.removeChannel(convChan)
         supabase.removeChannel(msgChan)
      }
   }, [userId, activeConversationId, conversations, supabase])

   // 3. Load messages when active conversation changes
   useEffect(() => {
      if (!activeConversationId || !userId) return

      async function loadMessages() {
         setLoadingMessages(true)
         try {
            await markConversationRead(activeConversationId!, 'buyer')

            setConversations(prev => prev.map(c =>
               c.id === activeConversationId ? { ...c, buyer_unread_count: 0 } : c
            ))

            const { data } = await supabase
               .from('messages')
               .select('*')
               .eq('conversation_id', activeConversationId)
               .order('created_at', { ascending: true })

            setMessages(data || [])

            // Mark vendor messages as seen if they're delivered
            const deliveredFromVendor = (data || [])
               .filter(m => m.sender_type === 'vendor' && m.status !== 'seen')
               .map(m => m.id)

            if (deliveredFromVendor.length > 0) {
               await markMessagesSeen(deliveredFromVendor)
            }

            setTimeout(() => scrollToBottom('auto'), 50)
         } catch (err) {
            console.error(err)
         } finally {
            setLoadingMessages(false)
         }
      }

      loadMessages()
   }, [activeConversationId, userId, supabase])

   const handleSend = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!reply.trim() || !activeConversationId) return

      setSending(true)
      const content = reply
      setReply('')

      try {
         await sendMessage({
            conversationId: activeConversationId,
            senderType: 'buyer',
            content
         })
      } catch (error) {
         console.error(error)
         setReply(content)
      } finally {
         setSending(false)
      }
   }

   const filteredConversations = conversations.filter(c =>
      (c.vendor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.product_name || '').toLowerCase().includes(searchQuery.toLowerCase())
   )

   if (loading) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
            <div className="flex flex-col items-center gap-8 text-center">
               <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center border border-green-500/20">
                  <Loader2 className="w-10 h-10 text-green-700 dark:text-green-500 animate-spin" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-green-800 dark:text-green-500/50 animate-pulse">Establishing Node Connection</p>
            </div>
         </div>
      )
   }

   return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0a] p-6 lg:p-14 transition-colors duration-500">
         <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-140px)]">

            <div className="flex flex-col gap-3 mb-12">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#1b6b3e] dark:bg-green-600 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1b6b3e] dark:text-green-500">Procurement Module</span>
               </div>
               <h1 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none italic font-serif">Market <span className="text-[#1b6b3e] dark:text-green-500 underline decoration-green-100 dark:decoration-green-900/30 underline-offset-8 decoration-8">Terminal</span></h1>
               <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-lg mt-2">Authenticated bridge to Butuan City stall operators and commercial entities.</p>
            </div>

            <div className="flex-1 bg-white dark:bg-[#111111]/80 backdrop-blur-2xl rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.1)] dark:shadow-none flex overflow-hidden relative">

               {/* Sidebar List */}
               <div className="w-80 border-r border-gray-100 dark:border-white/5 flex flex-col bg-white dark:bg-black/20">
                  <div className="p-6">
                     <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight italic font-serif">Transmissions</h1>
                        <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer transition-colors border border-gray-100 dark:border-white/5">
                           <MoreVertical className="w-4 h-4 text-gray-400" />
                        </div>
                     </div>
                     <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 transition-colors group-focus-within:text-green-600" />
                        <input
                           type="text"
                           placeholder="Filter sources..."
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           className="w-full h-11 bg-gray-50 dark:bg-white/5 border-none rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-green-700/20 placeholder:text-gray-500 dark:text-white font-medium"
                        />
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
                     {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-in fade-in duration-700">
                           <Inbox className="w-16 h-16 text-gray-200 dark:text-white/5 mb-6" />
                           <p className="text-[10px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.3em] leading-loose italic">No active <br /> streams found</p>
                        </div>
                     ) : (
                        filteredConversations.map(c => {
                           const isActive = c.id === activeConversationId
                           const vendorStatus = vendorOnlineStatuses[c.vendor_id]
                           const hasUnread = c.buyer_unread_count > 0

                           return (
                              <button
                                 key={c.id}
                                 onClick={() => {
                                    setActiveConversationId(c.id)
                                    router.push(`/user/messages?conversation=${c.id}`, { scroll: false })
                                 }}
                                 className={cn(
                                    "w-full text-left p-5 rounded-[2rem] transition-all relative group flex items-center gap-4 border border-transparent",
                                    isActive ? "bg-white dark:bg-white/10 shadow-xl shadow-green-900/5 border-gray-100 dark:border-white/5" : "hover:bg-gray-50 dark:hover:bg-white/5"
                                 )}
                              >
                                 <div className="relative shrink-0">
                                    <div className={cn(
                                       "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-base shadow-sm border border-gray-100 dark:border-white/5 transition-all overflow-hidden relative",
                                       hasUnread ? "bg-green-700 text-white" : "bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-600"
                                    )}>
                                       {c.vendors?.avatar_url ? (
                                           <Image src={c.vendors.avatar_url} alt="" fill className="object-cover" />
                                        ) : (
                                           <span className="uppercase">{c.vendor_name[0]}</span>
                                        )}

                                    </div>
                                    <div className={cn(
                                       "absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-[#111111] transition-colors",
                                       vendorStatus?.is_online ? "bg-green-500 animate-pulse" : "bg-gray-300 dark:bg-gray-800"
                                    )} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                       <h4 className={cn("text-[14px] truncate tracking-tight", hasUnread ? "font-black text-gray-900 dark:text-white" : "font-bold text-gray-700 dark:text-gray-300")}>
                                          {c.vendor_name}
                                       </h4>
                                       {hasUnread && <div className="w-2.5 h-2.5 bg-[#1b6b3e] dark:bg-green-500 rounded-full shrink-0 shadow-[0_0_12px_rgba(27,107,62,0.4)]" />}
                                    </div>
                                    <p className={cn(
                                       "text-[13px] truncate mb-2 leading-tight",
                                       hasUnread ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-500 dark:text-gray-600"
                                    )}>
                                       {c.last_sender_type === 'buyer' && <span className="text-[#1b6b3e] dark:text-green-500 font-black mr-1 uppercase text-[9px]">Me:</span>}
                                       {(() => {
                                          if (!c.last_message_content) return c.product_name
                                          try {
                                             const data = JSON.parse(c.last_message_content)
                                             if (data.type === 'product_inquiry') return data.text
                                             return c.last_message_content
                                          } catch (e) {
                                             return c.last_message_content
                                          }
                                       })()}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest">
                                       <Clock className="w-2.5 h-2.5 opacity-40" />
                                       {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true }).replace('about ', '')}
                                    </div>
                                 </div>
                              </button>
                           )
                        })
                     )}
                  </div>
               </div>

               {/* Chat Console */}
               <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f140f]/30 relative transition-colors duration-500">
                  {!activeConversationId ? (
                     <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-transparent text-center animate-in fade-in zoom-in duration-1000">
                        <div className="w-28 h-28 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-8 border border-gray-100 dark:border-white/5 shadow-inner">
                           <MessageCircle className="w-12 h-12 text-gray-100 dark:text-white/10" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 font-serif italic tracking-tight">Access Signal Alpha</h2>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] max-w-xs font-black uppercase tracking-[0.5em] leading-relaxed">Select a commercial transmission source to initiate handshake.</p>
                     </div>
                  ) : (
                     <>
                        {/* Chat Header */}
                        <div className="h-24 px-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/90 dark:bg-black/60 backdrop-blur-2xl shrink-0 z-10 transition-colors">
                           <div className="flex items-center gap-5">
                              <Button variant="ghost" size="icon" className="lg:hidden rounded-2xl w-12 h-12 text-[#1b6b3e] border border-gray-100 dark:border-white/5" onClick={() => { setActiveConversationId(null); router.push('/user/messages', { scroll: false }) }}>
                                 <ArrowLeft className="w-6 h-6" />
                              </Button>
                              <div className="relative shrink-0">
                                 <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/10 flex items-center justify-center font-black text-xl text-[#1b6b3e] dark:text-green-500 border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden relative">
                                    {activeConversation?.vendors?.avatar_url ? (
                                        <Image src={activeConversation.vendors.avatar_url} alt="" fill className="object-cover" />
                                     ) : (
                                        <span className="uppercase">{activeConversation?.vendor_name[0]}</span>
                                     )}

                                 </div>
                                 <div className={cn(
                                    "absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-[#111111] shadow-sm",
                                    vendorOnlineStatuses[activeConversation?.vendor_id]?.is_online ? "bg-green-500 animate-pulse" : "bg-gray-400"
                                 )} />
                              </div>
                              <div className="flex flex-col">
                                 <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight tracking-tight italic font-serif uppercase">
                                    {activeConversation?.vendor_name}
                                 </h4>
                                 <div className="flex items-center gap-2">
                                    <p className={cn(
                                       "text-[10px] font-black uppercase tracking-[0.2em]",
                                       vendorOnlineStatuses[activeConversation?.vendor_id]?.is_online ? "text-green-600 dark:text-green-500" : "text-gray-400 dark:text-gray-600"
                                    )}>
                                       {vendorOnlineStatuses[activeConversation?.vendor_id]?.is_online 
                                          ? 'Terminal Online' 
                                          : `Last transmission: ${vendorOnlineStatuses[activeConversation?.vendor_id]?.last_seen_at ? formatDistanceToNow(new Date(vendorOnlineStatuses[activeConversation?.vendor_id].last_seen_at), { addSuffix: true }).replace('about ', '') : 'unknown'}`}
                                    </p>
                                 </div>
                              </div>
                           </div>

                           <div className="flex items-center gap-3">
                              <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl text-gray-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-white/10 transition-all border border-transparent hover:border-green-100 dark:hover:border-white/5">
                                 <MoreVertical className="w-5 h-5" />
                              </Button>
                           </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gray-50/10 dark:bg-transparent">
                           {loadingMessages ? (
                              <div className="flex items-center justify-center h-full">
                                 <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-10 h-10 text-green-700 animate-spin" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Deciphering Content</span>
                                 </div>
                              </div>
                           ) : (
                              <div className="flex flex-col space-y-2">
                                 {messages.map((m, idx) => {
                                    const isMe = m.sender_type === 'buyer'
                                    const showTime = idx === 0 || (new Date(m.created_at).getTime() - new Date(messages[idx - 1].created_at).getTime() > 1000 * 60 * 30)

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
                                                      <MessageStatusIndicator status={m.status || 'sent'} avatarUrl={activeConversation?.vendors?.avatar_url} />
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

                        {/* Control Panel */}
                        <div className="p-6 bg-white dark:bg-black/40 backdrop-blur-2xl border-t border-gray-100 dark:border-white/5 shrink-0 transition-colors">
                           <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-4">
                              <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex flex-col p-2 border border-gray-100 dark:border-white/10 focus-within:border-green-700/30 dark:focus-within:border-green-500/30 transition-all shadow-inner">
                                 <Textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                    placeholder="Enter encrypted signal..."
                                    className="flex-1 border-none bg-transparent resize-none focus-visible:ring-0 text-[15px] dark:text-white px-5 py-4 min-h-[56px] max-h-40 scrollbar-hide font-medium tracking-tight"
                                 />
                              </div>

                              <button
                                 type="submit"
                                 disabled={sending || !reply.trim()}
                                 className={cn(
                                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-2xl active:scale-95 group",
                                    reply.trim() && !sending
                                       ? "bg-[#1b6b3e] text-white shadow-[#1b6b3e]/40"
                                       : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/5 shadow-none cursor-not-allowed"
                                 )}
                              >
                                 {sending ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                 ) : (
                                    <Send className={cn("w-6 h-6 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", reply.trim() ? "opacity-100" : "opacity-20")} />
                                 )}
                              </button>
                           </form>
                           <div className="mt-4 text-center">
                              <div className="flex items-center justify-center gap-3 opacity-30">
                                 <ShieldCheck className="w-3.5 h-3.5" />
                                 <p className="text-[9px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.5em]">End-to-End Enterprise Encryption Active</p>
                              </div>
                           </div>
                        </div>
                     </>
                  )}
               </div>
            </div>
         </div>
      </div>
   )
}

export default function UserMessagesPage() {
   return (
      <Suspense fallback={
         <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
            <div className="flex flex-col items-center gap-8 text-center">
               <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center border border-green-500/20">
                  <Loader2 className="w-10 h-10 text-green-700 animate-spin" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-green-800 animate-pulse">Establishing Node Connection</p>
            </div>
         </div>
      }>
         <MessagesContent />
      </Suspense>
   )
}
