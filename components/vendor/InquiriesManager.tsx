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
  Dot
} from 'lucide-react'
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
      <div className="w-96 border-r border-gray-50 flex flex-col h-full bg-gray-50/20">
        <div className="p-8 pb-4">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2 font-serif italic">Inbox</h2>
              <div className="px-3 py-1 bg-[#1b6b3e]/10 rounded-full">
                 <p className="text-[9px] font-black uppercase tracking-widest text-[#1b6b3e]">{conversations.length} Active</p>
              </div>
           </div>
           
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#1b6b3e] transition-colors" />
              <input 
                 type="text" 
                 placeholder="Search conversations..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-12 bg-white border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1b6b3e]/20 transition-all shadow-sm"
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
                              {(c.buyer_profiles?.full_name || 'B')[0]}
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fafcfa]">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-10 border border-gray-50">
                <MessageCircle className="w-10 h-10 text-gray-100" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight leading-none italic font-serif">Vendor Hub</h2>
            <p className="text-gray-400 font-medium text-center max-w-[280px] text-sm leading-relaxed">
               Select an incoming inquiry from the sidebar to start a real-time negotiation.
            </p>
          </div>
        ) : (
          <>
            <div className="px-10 py-6 border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-105 duration-300">
                      <ShoppingBag className="w-6 h-6 text-[#1b6b3e]" />
                   </div>
                   <div className="hidden sm:block">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1b6b3e] opacity-50 mb-0.5">Active Negotiation</p>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Direct Inquiry</h4>
                   </div>
                </div>
                
                {/* Buyer Details Context - Right Aligned */}
                <div className="flex flex-col items-end gap-2">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                         <div className={cn("w-1.5 h-1.5 rounded-full", onlineUsers.has(activeConversation?.buyer_id) ? "bg-green-500 animate-pulse" : "bg-gray-300")} />
                         <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">
                            {onlineUsers.has(activeConversation?.buyer_id) ? 'Online' : 'Offline'}
                         </span>
                      </div>
                      <h5 className="text-lg font-black text-gray-900 tracking-tight leading-none italic font-serif uppercase">
                        {activeConversation?.buyer_profiles?.full_name || 'Anonymous Buyer'}
                      </h5>
                   </div>
 
                   {/* Pinned Product Badge */}
                   <div className="group flex items-center gap-3 bg-[#1b6b3e] text-white px-4 py-2 rounded-2xl shadow-xl shadow-green-900/20 transform hover:-translate-x-1 transition-transform cursor-help">
                      <div className="flex flex-col items-end">
                         <span className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Pinned Product</span>
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-tight text-white/90">
                              {activeConversation?.product_name}
                            </span>
                            <div className="w-1 h-1 bg-white/40 rounded-full" />
                            <span className="text-[10px] font-black text-white">
                              ₱{activeConversation?.price} / {activeConversation?.unit}
                            </span>
                         </div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                         <ExternalLink className="w-3 h-3 text-white" />
                      </div>
                   </div>
                </div>
            </div>
 
            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
               {loadingMessages ? (
                 <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-[#1b6b3e] animate-spin" />
                 </div>
               ) : (
                 messages.map((m, idx) => {
                   const isMe = m.sender_type === 'vendor'
                   const isLast = idx === messages.length - 1
                   return (
                     <div key={m.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                       <div className={cn("max-w-[75%] group", isMe ? "text-right" : "text-left")}>
                         <div className={cn(
                           "p-5 rounded-[1.8rem] text-sm font-medium leading-relaxed shadow-sm transition-all group-hover:shadow-md",
                           isMe ? "bg-[#1b6b3e] text-white rounded-tr-none shadow-green-900/10" : "bg-white text-gray-600 rounded-tl-none border border-gray-100"
                         )}>
                           {m.content}
                         </div>
                         
                         <div className={cn("flex items-center gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity", isMe ? "justify-end" : "justify-start")}>
                           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                             {format(new Date(m.created_at), 'h:mm a')}
                           </span>
                           {isMe && isLast && (
                             <div className="flex items-center gap-1 text-[#1b6b3e]">
                               {m.read_at ? (
                                  <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100/50">
                                     <Eye className="w-2.5 h-2.5" />
                                     <span className="text-[7px] font-black uppercase tracking-tighter">Seen {format(new Date(m.read_at), 'h:mm a')}</span>
                                  </div>
                               ) : (
                                  <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-full">
                                     <CheckCheck className="w-3 h-3 text-gray-300" />
                                     <span className="text-[7px] font-black uppercase tracking-tighter">Delivered</span>
                                  </div>
                               )}
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   )
                 })
               )}
               <div ref={messagesEndRef} />
            </div>
 
            <div className="p-8 border-t border-gray-50 bg-gray-50/20">
               <form onSubmit={handleSend} className="bg-white rounded-[1.8rem] p-2 border border-gray-100 shadow-xl flex items-center group focus-within:ring-2 focus-within:ring-[#1b6b3e]/10 transition-all">
                  <Textarea 
                     value={reply}
                     onChange={(e) => setReply(e.target.value)}
                     onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                     placeholder="Securely reply to inquirer..."
                     className="flex-1 border-none bg-transparent resize-none focus-visible:ring-0 text-sm font-medium p-4 py-4 min-h-[56px]"
                  />
                  <Button type="submit" disabled={sending || !reply.trim()} className="w-12 h-12 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white p-0 shrink-0 mx-2 shadow-lg shadow-green-900/10">
                     {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
               </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
