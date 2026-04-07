'use client'
 
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  ArrowLeft,
  Check,
  CheckCheck,
  Eye,
  Circle,
  Dot,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
 
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
  const [onlineVendors, setOnlineVendors] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
 
  const activeConversation = conversations.find(c => c.id === activeConversationId)
 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
 
  // 1. Initial Auth & Conv fetch
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=/user/messages')
        return
      }
      setUserId(session.user.id)
 
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('buyer_id', session.user.id)
        .order('last_message_at', { ascending: false })
 
      setConversations(data || [])
      setLoading(false)
 
      // Track Presence
      const presenceChannel = supabase.channel('presence_buyer', { config: { presence: { key: session.user.id } } })
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState()
          const online = new Set<string>()
          Object.keys(state).forEach(key => online.add(key))
          setOnlineVendors(online)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ user_id: session.user.id, online_at: new Date().toISOString() })
          }
        })
    }
    init()
  }, [supabase, router])
 
  // 2. Select convo logic
  useEffect(() => {
    if (!activeConversationId || !userId) return
 
    async function selectConv() {
      setLoadingMessages(true)
      
      // Mark as read
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
      setLoadingMessages(false)
      setTimeout(scrollToBottom, 100)
    }
 
    selectConv()
 
    const msgChan = supabase
      .channel(`buyer_conv_${activeConversationId}`)
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
 
    return () => { supabase.removeChannel(msgChan) }
  }, [activeConversationId, userId, supabase])
 
  // 3. RT conversation list subscription
  useEffect(() => {
    if (!userId) return
    const convChan = supabase
      .channel('buyer_conversations')
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
               const idx = prev.findIndex(c => c.id === payload.new.id)
               if (idx === -1) return [payload.new, ...prev]
               const arr = [...prev]
               arr[idx] = payload.new
               return arr.sort((a,b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
            })
         }
      })
      .subscribe()
    return () => { supabase.removeChannel(convChan) }
  }, [userId, supabase])
 
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
     c.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  )
 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafcfa]">
         <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-12 h-12 text-[#1b6b3e] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1b6b3e] animate-pulse">Syncing Hub…</p>
         </div>
      </div>
    )
  }
 
  return (
    <div className="min-h-screen bg-[#fafcfa] p-6 lg:p-14">
       <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-140px)]">
          
          <div className="flex flex-col gap-3 mb-12">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#1b6b3e] rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1b6b3e]">Personal Hub</span>
             </div>
             <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-loose italic font-serif uppercase">Your <span className="text-[#1b6b3e]">Messages</span></h1>
             <p className="text-sm font-medium text-gray-400 max-w-lg">Communicate directly with Butuan City vendors regarding your product inquiries.</p>
          </div>
 
          <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-2xl flex overflow-hidden relative">
             
             {/* Sidebar List */}
             <div className="w-80 border-r border-gray-100 flex flex-col bg-white">
                <div className="p-5">
                   <div className="flex items-center justify-between mb-4">
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chats</h1>
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors">
                         <MoreVertical className="w-4 h-4 text-gray-600" />
                      </div>
                   </div>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                         type="text" 
                         placeholder="Search Messenger"
                         value={searchQuery}
                         onChange={e => setSearchQuery(e.target.value)}
                         className="w-full h-9 bg-gray-100 border-none rounded-full pl-10 pr-4 text-sm focus:outline-none focus:ring-0 placeholder:text-gray-500"
                      />
                   </div>
                </div>
 
                <div className="flex-1 overflow-y-auto px-2 py-2">
                   {filteredConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                         <p className="text-sm font-medium text-gray-400">No chats found</p>
                      </div>
                   ) : (
                      filteredConversations.map(c => {
                         const isActive = c.id === activeConversationId
                         const isOnline = onlineVendors.has(c.vendor_id)
                         const hasUnread = c.buyer_unread_count > 0
 
                         return (
                            <button
                              key={c.id}
                              onClick={() => {
                                 setActiveConversationId(c.id)
                                 router.push(`/user/messages?conversation=${c.id}`, { scroll: false })
                              }}
                              className={cn(
                                 "w-full text-left p-3 rounded-xl transition-all relative group flex items-center gap-3",
                                 isActive ? "bg-gray-50" : "hover:bg-gray-50/50"
                              )}
                            >
                               <div className="relative shrink-0">
                                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 uppercase">
                                     {c.vendor_name[0]}
                                  </div>
                                  {isOnline && (
                                     <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                  )}
                               </div>
                               <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center justify-between">
                                     <h4 className={cn("text-sm truncate", hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-700")}>
                                        {c.vendor_name}
                                     </h4>
                                     {hasUnread && <div className="w-2.5 h-2.5 bg-[#1b6b3e] rounded-full shrink-0" />}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                                     <span className="truncate">{c.product_name}</span>
                                     <span>·</span>
                                     <span className="shrink-0">{formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false })}</span>
                                  </div>
                               </div>
                            </button>
                         )
                      })
                   )}
                </div>
             </div>
 
             {/* Chat Console */}
             <div className="flex-1 flex flex-col h-full bg-white relative">
                {!activeConversationId ? (
                   <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                          <MessageCircle className="w-10 h-10 text-gray-200" />
                       </div>
                       <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a chat</h2>
                       <p className="text-gray-500 text-sm italic font-serif">Communicate with vendors directly.</p>
                   </div>
                ) : (
                   <>
                      {/* Chat Header */}
                      <div className="h-16 px-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                         <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="lg:hidden rounded-full h-8 w-8" onClick={() => { setActiveConversationId(null); router.push('/user/messages', { scroll: false }) }}>
                               <ArrowLeft className="w-5 h-5 text-[#1b6b3e]" />
                            </Button>
                            <div className="relative shrink-0">
                               <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#1b6b3e]">
                                  {activeConversation?.vendor_name[0]}
                               </div>
                               {onlineVendors.has(activeConversation?.vendor_id) && (
                                  <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                               )}
                            </div>
                            <div className="flex flex-col">
                               <h4 className="text-sm font-bold text-gray-900 leading-tight italic font-serif uppercase">
                                 {activeConversation?.vendor_name}
                               </h4>
                               <p className="text-[11px] text-gray-500 font-medium">
                                 {onlineVendors.has(activeConversation?.vendor_id) ? 'Active now' : 'Offline'}
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
  
                      {/* Messages Area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                         {loadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                               <Loader2 className="w-6 h-6 text-[#1b6b3e] animate-spin" />
                            </div>
                         ) : (
                            <div className="flex flex-col space-y-1">
                               {messages.map((m, idx) => {
                                  const isMe = m.sender_type === 'buyer'
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
                                                  ? "bg-[#1b6b3e] text-white rounded-[1.25rem] rounded-tr-none shadow-green-900/5" 
                                                  : "bg-[#f0f0f0] text-gray-900 rounded-[1.25rem] rounded-tl-none"
                                              )}>
                                                 {m.content}
                                              </div>
                                              
                                              {isMe && isLast && (
                                                 <div className="relative h-4 mt-0.5 pr-1">
                                                    <p className="text-[10px] font-bold text-gray-400">
                                                      {m.read_at ? 'Seen' : 'Delivered'}
                                                    </p>
                                                 </div>
                                              )}
                                           </div>
                                        </div>
                                     </div>
                                  )
                               })}
                               <div ref={messagesEndRef} />
                            </div>
                         )}
                      </div>
  
                      {/* Control Panel */}
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
                            <button type="submit" className="p-2 text-[#1b6b3e] transition-transform active:scale-90 disabled:opacity-50">
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
       </div>
    </div>
  )
}
 
export default function UserMessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fafcfa]"><div className="flex flex-col items-center gap-6"><Loader2 className="w-12 h-12 text-[#1b6b3e] animate-spin" /><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1b6b3e] animate-pulse">Initializing Hub…</p></div></div>}>
       <MessagesContent />
    </Suspense>
  )
}
