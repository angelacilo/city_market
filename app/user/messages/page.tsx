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
 
          <div className="flex-1 bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl flex overflow-hidden relative">
             
             {/* Sidebar List */}
             <div className="w-96 border-r border-gray-50 flex flex-col bg-gray-50/20">
                <div className="p-8 pb-4">
                   <h2 className="text-xl font-black text-gray-900 tracking-tight mb-8 font-serif italic uppercase flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-[#1b6b3e]" />
                      Inbox
                   </h2>
                   <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#1b6b3e] transition-colors" />
                      <input 
                         type="text" 
                         placeholder="Find vendor or product..."
                         value={searchQuery}
                         onChange={e => setSearchQuery(e.target.value)}
                         className="w-full h-12 bg-white border border-gray-100 rounded-2xl pl-12 pr-4 text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#1b6b3e]/20 transition-all shadow-sm"
                      />
                   </div>
                </div>
 
                <div className="flex-1 overflow-y-auto px-4 py-8 space-y-3">
                   {filteredConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                         <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-gray-50">
                            <Inbox className="w-8 h-8 text-gray-200" />
                         </div>
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-loose">Choose a product from <br /> the market to start.</p>
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
                                 "w-full text-left p-6 rounded-[2.2rem] transition-all relative group",
                                 isActive ? "bg-white shadow-xl shadow-green-900/5 ring-1 ring-gray-100/50" : "hover:bg-white/60"
                              )}
                            >
                              {isActive && <div className="absolute left-0 top-6 bottom-6 w-1 bg-[#1b6b3e] rounded-r-full" />}
                              
                              <div className="flex items-start gap-4">
                                 <div className="relative shrink-0">
                                    <div className={cn(
                                       "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm border border-gray-50 uppercase",
                                       hasUnread ? "bg-[#1b6b3e] text-white" : "bg-white text-gray-300"
                                    )}>
                                       {c.vendor_name[0]}
                                    </div>
                                    {isOnline && (
                                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-gray-50 shadow-sm">
                                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                       </div>
                                    )}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1 gap-2">
                                       <h4 className="text-sm font-black text-gray-900 truncate tracking-tight">{c.vendor_name}</h4>
                                       {hasUnread && <div className="w-2 h-2 bg-[#1b6b3e] rounded-full shrink-0 animate-bounce" />}
                                    </div>
                                    
                                    {/* Pinned Product */}
                                    <div className="px-2 py-0.5 bg-gray-50 rounded-lg inline-block mb-3 border border-gray-100">
                                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{c.product_name}</p>
                                    </div>
 
                                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 tracking-wider">
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
 
             {/* Chat Console */}
             <div className="flex-1 flex flex-col h-full bg-white relative">
                {!activeConversationId ? (
                   <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fafcfa]">
                      <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-10 border border-gray-50">
                          <MessageCircle className="w-10 h-10 text-gray-100" />
                       </div>
                       <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight leading-none italic font-serif">Secure Messaging</h2>
                       <p className="text-gray-400 font-medium text-center max-w-[280px] text-[11px] leading-relaxed uppercase tracking-widest font-black opacity-50">
                          End-to-end communication with Butuan Market vendors.
                       </p>
                   </div>
                ) : (
                   <>
                      {/* Chat Header */}
                      <div className="px-10 py-6 border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                         <div className="flex items-center gap-5">
                            <Button variant="ghost" size="icon" className="lg:hidden rounded-xl" onClick={() => { setActiveConversationId(null); router.push('/user/messages', { scroll: false }) }}>
                               <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-110">
                               <Store className="w-6 h-6 text-[#1b6b3e]" />
                            </div>
                            <div className="hidden sm:block">
                               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1b6b3e] opacity-50 mb-0.5">Stall Presence</p>
                               <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Active Inquirer</h4>
                            </div>
                         </div>
 
                         {/* Vendor Details - Right Aligned */}
                         <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-4">
                               <div className={cn("px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-gray-50 shadow-sm", onlineVendors.has(activeConversation?.vendor_id) ? "bg-green-50" : "bg-gray-50")}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", onlineVendors.has(activeConversation?.vendor_id) ? "bg-green-500 animate-pulse" : "bg-gray-300")} />
                                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{onlineVendors.has(activeConversation?.vendor_id) ? 'Live' : 'Offline'}</span>
                               </div>
                               <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight italic font-serif">
                                 {activeConversation?.vendor_name}
                               </h4>
                            </div>
 
                            {/* Pinned Product Badge */}
                            <div className="group flex items-center gap-3 bg-[#1b6b3e] text-white px-4 py-2 rounded-2xl shadow-xl shadow-green-900/20 transform hover:-translate-x-1 transition-transform cursor-help">
                               <div className="flex flex-col items-end">
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Involved Listing</span>
                                  <div className="flex items-center gap-2">
                                     <span className="text-xs font-black uppercase tracking-tight text-white/90">
                                       {activeConversation?.product_name}
                                     </span>
                                     <div className="w-1 h-1 bg-white/40 rounded-full" />
                                     <span className="text-[10px] font-black text-white/90">
                                       ₱{activeConversation?.price} / {activeConversation?.unit}
                                     </span>
                                  </div>
                               </div>
                               <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                                  <ShoppingBag className="w-3 h-3 text-white" />
                               </div>
                            </div>
                         </div>
                      </div>
  
                      {/* Messages Area */}
                      <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                         {loadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                               <Loader2 className="w-10 h-10 text-[#1b6b3e] animate-spin" />
                            </div>
                         ) : (
                            <div className="space-y-10">
                               {messages.map((m, idx) => {
                                  const isMe = m.sender_type === 'buyer'
                                  const isLast = idx === messages.length - 1
                                  return (
                                     <div key={m.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                        <div className={cn("max-w-[75%] group", isMe ? "text-right" : "text-left")}>
                                           <div className={cn(
                                              "p-6 rounded-[2.2rem] text-sm font-semibold leading-relaxed shadow-sm transition-all group-hover:shadow-md",
                                              isMe ? "bg-[#1b6b3e] text-white rounded-tr-none shadow-green-900/10" : "bg-white text-gray-600 rounded-tl-none border border-gray-100"
                                           )}>
                                              {m.content}
                                           </div>
                                           <div className={cn("flex items-center gap-2 mt-3 px-1 opacity-100 transition-opacity", isMe ? "justify-end" : "justify-start")}>
                                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(m.created_at), 'h:mm a')}</span>
                                              {isMe && isLast && (
                                                 <div className="flex items-center gap-1">
                                                   {m.read_at ? (
                                                      <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100/50">
                                                         <Eye className="w-2.5 h-2.5 text-[#1b6b3e]" />
                                                         <span className="text-[7px] font-black uppercase tracking-tighter text-[#1b6b3e]">Seen {format(new Date(m.read_at), 'h:mm a')}</span>
                                                      </div>
                                                   ) : (
                                                      <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                         <CheckCheck className="w-3 h-3 text-gray-200" />
                                                         <span className="text-[7px] font-black uppercase tracking-tighter text-gray-400">Delivered</span>
                                                      </div>
                                                   )}
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
                      <div className="p-8 border-t border-gray-50 bg-gray-50/20">
                         <form onSubmit={handleSend} className="bg-white rounded-[2rem] p-2 border border-gray-100 shadow-2xl flex items-center group focus-within:ring-2 focus-within:ring-[#1b6b3e]/10 transition-all">
                            <Textarea 
                               value={reply}
                               onChange={(e) => setReply(e.target.value)}
                               onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                               placeholder="Reply to vendor..."
                               className="flex-1 border-none bg-transparent resize-none focus-visible:ring-0 text-sm font-semibold p-4 py-4 min-h-[64px]"
                            />
                            <Button type="submit" disabled={sending || !reply.trim()} className="w-14 h-14 rounded-2xl bg-[#1b6b3e] hover:bg-[#114026] text-white p-0 shrink-0 mx-2 shadow-2xl shadow-green-900/20 active:scale-95 transition-all">
                               {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </Button>
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
