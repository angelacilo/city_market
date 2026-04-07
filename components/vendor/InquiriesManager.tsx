'use client'
 
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, markConversationRead } from '@/lib/actions/messenger'
import { 
  MessageCircle, 
  Search, 
  Send, 
  ShoppingBag, 
  Store, 
  MapPin, 
  Loader2,
  Inbox,
  Clock,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Check,
  CheckCheck,
  Eye,
  Circle,
  Dot,
  Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
 
interface InquiriesManagerProps {
  initialConversations: any[]
  vendorId: string
}
 
export default function InquiriesManager({ initialConversations, vendorId }: InquiriesManagerProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [reply, setReply] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
 
  const activeConversation = conversations.find(c => c.id === activeConversationId)
 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
 
  // 1. Presence & Realtime
  useEffect(() => {
    if (!vendorId) return
 
    const presenceChannel = supabase.channel('presence_vendor')
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const online = new Set<string>()
        Object.keys(state).forEach(key => online.add(key))
        setOnlineUsers(online)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => new Set(prev).add(key))
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: vendorId, online_at: new Date().toISOString() })
        }
      })
 
    return () => { supabase.removeChannel(presenceChannel) }
  }, [vendorId, supabase])
 
  // 2. Fetch messages & Mark read
  useEffect(() => {
    if (!activeConversationId) return
 
    async function selectConv() {
      setLoadingMessages(true)
      await markConversationRead(activeConversationId!, 'vendor')
      
      setConversations(prev => prev.map(c => 
        c.id === activeConversationId ? { ...c, vendor_unread_count: 0 } : c
      ))
 
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true })
 
      setMessages(data || [])
      setLoadingMessages(false)
      setTimeout(scrollToBottom, 100)
    }
 
    selectConv()
 
    const channel = supabase
      .channel(`active_conv_${activeConversationId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${activeConversationId}` 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
           setMessages(prev => {
             if (prev.find(m => m.id === payload.new.id)) return prev
             return [...prev, payload.new]
           })
           setTimeout(scrollToBottom, 50)
        } else if (payload.eventType === 'UPDATE') {
           setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
        }
      })
      .subscribe()
 
    return () => { supabase.removeChannel(channel) }
  }, [activeConversationId, supabase])
 
  // 3. Conversation list updates
  useEffect(() => {
    const convChannel = supabase
      .channel('vendor_conversations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations', 
        filter: `vendor_id=eq.${vendorId}` 
      }, (payload) => {
         if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new, ...prev])
         } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => {
               const idx = prev.findIndex(c => c.id === payload.new.id)
               if (idx === -1) return [payload.new, ...prev]
               const newArr = [...prev]
               newArr[idx] = payload.new
               return newArr.sort((a,b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
            })
         }
      })
      .subscribe()
    return () => { supabase.removeChannel(convChannel) }
  }, [vendorId, supabase])
 
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || !activeConversationId) return
    
    setSending(true)
    const content = reply
    setReply('')
    
    try {
      await sendMessage({
        conversationId: activeConversationId,
        senderType: 'vendor',
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
     c.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (c.buyer_profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )
 
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden flex h-[720px] relative">
      
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-100 flex flex-col h-full bg-white">
        <div className="p-5">
           <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chats</h1>
              <div className="flex gap-2">
                 <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                 </div>
              </div>
           </div>
           
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                 type="text" 
                 placeholder="Search Messenger"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-9 bg-gray-100 border-none rounded-full pl-10 pr-4 text-sm focus:outline-none focus:ring-0 placeholder:text-gray-500"
              />
           </div>
        </div>
 
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
               <Inbox className="w-10 h-10 text-gray-200 mb-4" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">No inquiries <br /> detected.</p>
            </div>
          ) : (
            filteredConversations.map(c => {
               const isActive = c.id === activeConversationId
               const hasUnread = c.vendor_unread_count > 0
               const isOnline = onlineUsers.has(c.buyer_id)
 
               return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    className={cn(
                       "w-full text-left p-5 rounded-3xl transition-all relative group",
                       isActive ? "bg-white shadow-xl shadow-green-900/5 ring-1 ring-gray-100/50" : "hover:bg-white/60"
                    )}
                  >
                    {isActive && <div className="absolute left-0 top-6 bottom-6 w-1 bg-[#1b6b3e] rounded-r-full" />}
                    
                    <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                           <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm border border-gray-100",
                              hasUnread ? "bg-[#1b6b3e] text-white" : "bg-white text-gray-400"
                           )}>
                              {c.buyer_profiles?.avatar_url ? (
                                <Image src={c.buyer_profiles.avatar_url} alt="" fill className="object-cover" />
                              ) : (
                                (c.buyer_profiles?.full_name || 'B')[0]
                              )}
                           </div>
                           {isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-gray-50 shadow-sm">
                                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              </div>
                           )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between gap-1 mb-1">
                              <h3 className={cn(
                                 "text-sm font-black tracking-tight truncate",
                                 isActive ? "text-gray-900" : "text-gray-700"
                              )}>
                                 {c.buyer_profiles?.full_name || 'Anonymous Buyer'}
                              </h3>
                              {hasUnread && <div className="w-2 h-2 bg-[#1b6b3e] rounded-full shrink-0 animate-bounce" />}
                           </div>
                           
                           {/* Product Pinned Below Name */}
                           <div className="px-2 py-0.5 bg-gray-100 rounded-lg inline-block mb-3 border border-gray-100">
                             <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">
                                {c.product_name}
                             </p>
                           </div>
 
                           <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                              <Clock className="w-2.5 h-2.5 text-[#1b6b3e]/30" />
                              {formatDistanceToNow(new Date(c.last_message_at))}
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
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {!activeConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-10 h-10 text-gray-200" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a chat</h2>
            <p className="text-gray-500 text-sm">Choose from your existing inquiries to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-16 px-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
               <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                     <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 overflow-hidden relative">
                        {activeConversation?.buyer_profiles?.avatar_url ? (
                          <Image 
                            src={activeConversation.buyer_profiles.avatar_url}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          (activeConversation?.buyer_profiles?.full_name || 'B')[0]
                        )}
                     </div>
                     {onlineUsers.has(activeConversation?.buyer_id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                     )}
                  </div>
                  <div className="flex flex-col">
                     <h4 className="text-sm font-bold text-gray-900 leading-tight">
                        {activeConversation?.buyer_profiles?.full_name || 'Anonymous Buyer'}
                     </h4>
                     <p className="text-[11px] text-gray-500 font-medium">
                        {onlineUsers.has(activeConversation?.buyer_id) ? 'Active now' : 'Offline'}
                     </p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                     <svg className="w-5 h-5 text-[#1b6b3e]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  </div>
                  <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                     <svg className="w-5 h-5 text-[#1b6b3e]" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                  </div>
                  <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                     <Dot className="w-6 h-6 text-[#1b6b3e]" />
                  </div>
               </div>
            </div>
 
            {/* Pinned Product Bar */}
            <div className="px-5 py-2 bg-white/80 backdrop-blur-sm border-b border-gray-50 flex items-center gap-3 shrink-0">
               <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/></svg>
               </div>
               <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                  <span className="text-gray-900">{activeConversation?.product_name}</span>
                  <span className="text-gray-300">•</span>
                  <span>₱{activeConversation?.price}/{activeConversation?.unit}</span>
               </div>
            </div>
 
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {loadingMessages ? (
                 <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-[#1b6b3e] animate-spin" />
                 </div>
               ) : (
                 <div className="flex flex-col space-y-1">
                  {messages.map((m, idx) => {
                    const isMe = m.sender_type === 'vendor'
                    const isLast = idx === messages.length - 1
                    const showTime = idx === 0 || (new Date(m.created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 1000 * 60 * 30)
 
                    return (
                      <div key={m.id} className="flex flex-col w-full">
                        {showTime && (
                          <div className="w-full text-center py-6">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                               {format(new Date(m.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        )}
                        <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[70%] group", isMe ? "items-end" : "items-start")}>
                            <div className={cn(
                              "px-4 py-2 my-[1px] text-[15px] font-medium leading-normal shadow-none transition-all",
                              isMe 
                                ? "bg-[#1b6b3e] text-white rounded-[1.25rem] rounded-tr-none" 
                                : "bg-[#f0f0f0] text-gray-900 rounded-[1.25rem] rounded-tl-none"
                            )}>
                              {m.content}
                            </div>
                            
                            {isMe && isLast && (
                              <div className="relative h-4 mt-0.5">
                                 <p className="absolute right-1 text-[10px] font-bold text-gray-400">
                                   {m.read_at ? 'Seen' : 'Delivered'}
                                 </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                 </div>
               )}
               <div ref={messagesEndRef} />
            </div>
 
            <div className="p-3 bg-white shrink-0">
               <form onSubmit={handleSend} className="flex items-center gap-2">
                  <div className="flex gap-2 text-[#1b6b3e] px-1">
                     <div className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                     </div>
                     <div className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c0 1.1.9-2 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                     </div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-1.5">
                     <Textarea 
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                        placeholder="Aa"
                        className="flex-1 border-none bg-transparent resize-none focus-visible:ring-0 text-[15px] p-1 min-h-[32px] max-h-32 scrollbar-hide"
                     />
                     <div className="text-[#1b6b3e] hover:bg-gray-200 rounded-full p-1 cursor-pointer">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                     </div>
                  </div>
                  <button type="submit" className="p-2 text-[#1b6b3e] transition-transform active:scale-90 disabled:opacity-30">
                     {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                     ) : !reply.trim() ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2 13c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2v2H2v-2zM20 13c0-1.1-.9-2-2-2h-1c-1.1 0-2 .9-2 2v2h5v-2zM12 2c-4.41 0-8 3.59-8 8v1h16v-1c0-4.41-3.59-8-8-8zM12 14c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2s2-.9 2-2v-4c0-1.1-.9-2-2-2z"/></svg> 
                     ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                     )}
                  </button>
               </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
