'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  Minus,
  Maximize2,
  X,
  Search,
  Plus,
  Send,
  Loader2,
  ExternalLink,
  ChevronRight,
  ShoppingBag
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Conversation {
  id: string
  vendor_id: string
  buyer_id: string
  product_name: string
  vendor_name: string
  market_name: string
  price: number
  unit: string
  last_message_at: string
  buyer_unread_count: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'buyer' | 'vendor'
  content: string
  is_read: boolean
  created_at: string
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('buyer_id', userId)
      .order('last_message_at', { ascending: false })

    if (data) {
      setConversations(data)
      const total = data.reduce((acc, c) => acc + (c.buyer_unread_count || 0), 0)
      setUnreadTotal(total)
    }
  }, [supabase])

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
      setTimeout(scrollToBottom, 100)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session?.user) {
        fetchConversations(session.user.id)

        // Interval for unread counts
        const interval = setInterval(() => fetchConversations(session.user.id), 30000)
        return () => clearInterval(interval)
      }
    }
    init()
  }, [supabase, fetchConversations])

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true)
    window.addEventListener('open-chat', handleOpenChat)
    return () => window.removeEventListener('open-chat', handleOpenChat)
  }, [])

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id)

      // Subscribe to real-time messages
      const channel = supabase
        .channel(`chat-${activeConversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          setTimeout(scrollToBottom, 50)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [activeConversation, supabase, fetchMessages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newMessage.trim() || !activeConversation || !session || isSending) return

    setIsSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    const { data: msg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversation.id,
        sender_id: session.user.id,
        sender_type: 'buyer',
        content
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      setNewMessage(content)
    } else {
      // Update last_message_at in conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          vendor_unread_count: (activeConversation as any).vendor_unread_count + 1
        })
        .eq('id', activeConversation.id)

      fetchConversations(session.user.id)
    }
    setIsSending(false)
  }

  const markAsRead = async (conversation: Conversation) => {
    if (conversation.buyer_unread_count > 0) {
      await supabase
        .from('conversations')
        .update({ buyer_unread_count: 0 })
        .eq('id', conversation.id)

      if (session?.user) fetchConversations(session.user.id)
    }
  }

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv)
    markAsRead(conv)
  }

  if (!session) return null

  const filteredConversations = conversations.filter(c =>
    c.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Panel */}
      {isOpen && (
        <div className="mb-4 w-screen h-[calc(100vh-120px)] sm:w-[680px] sm:h-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200 origin-bottom-right">
          {/* Header */}
          <div className="bg-green-800 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-[200px]">
                {activeConversation ? activeConversation.vendor_name : 'Chat with Vendors'}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-green-200 font-medium tracking-wide uppercase">Verified Vendor</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Minimize"
              >
                <Minus className="w-4 h-4" />
              </button>
              <Link
                href="/user/messages"
                target="_blank"
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Open full view"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border-l border-white/20 ml-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: List */}
            <div className="w-full sm:w-[240px] border-r border-gray-100 flex flex-col bg-gray-50/30 overflow-hidden">
              <div className="p-3 bg-white border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    placeholder="Search vendors..."
                    className="pl-9 h-9 text-xs bg-gray-50 border-gray-100 rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No conversations yet</p>
                  </div>
                ) : filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative group",
                      activeConversation?.id === conv.id ? "bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] border-l-4 border-green-700" : "hover:bg-gray-50 border-l-4 border-transparent"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-black text-sm shrink-0">
                      {conv.vendor_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {conv.vendor_name}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate font-medium">
                        {conv.product_name}
                      </p>
                    </div>
                    {conv.buyer_unread_count > 0 && (
                      <div className="w-2 h-2 bg-green-600 rounded-full absolute right-3 bottom-4 shadow-sm shadow-green-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Chat */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {activeConversation ? (
                <>
                  {/* Context Bar */}
                  <div className="px-4 py-2 bg-green-50/50 border-b border-green-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-green-700" />
                      <p className="text-[11px] font-bold text-green-800">
                        {activeConversation.product_name}
                        <span className="mx-2 text-green-300">•</span>
                        <span className="text-gray-500">₱{activeConversation.price}/{activeConversation.unit}</span>
                      </p>
                    </div>
                    <Link href={`/stalls/${activeConversation.vendor_id}`} className="text-[9px] font-black text-green-700 uppercase tracking-widest hover:underline">
                      Visit Stall
                    </Link>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-green-700 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Start the conversation</p>
                      </div>
                    ) : (
                      messages.map((msg, i) => {
                        const isBuyer = msg.sender_type === 'buyer'
                        const prevMsg = i > 0 ? messages[i - 1] : null
                        const isGrouped = prevMsg &&
                          prevMsg.sender_type === msg.sender_type &&
                          (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 300000

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex flex-col group",
                              isBuyer ? "items-end" : "items-start",
                              isGrouped ? "mt-1" : "mt-4"
                            )}
                          >
                            <div className={cn(
                              "max-w-[85%] px-3.5 py-2 text-xs shadow-sm",
                              isBuyer
                                ? "bg-green-700 text-white rounded-2xl rounded-br-sm"
                                : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm"
                            )}>
                              {msg.content}
                            </div>
                            <div className={cn(
                              "flex items-center gap-1.5 mt-1 transition-opacity duration-300",
                              isGrouped ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                            )}>
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isBuyer && (
                                <>
                                  <span className="text-[8px] text-gray-300">•</span>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest",
                                    msg.is_read ? "text-green-500" : "text-gray-300"
                                  )}>
                                    {msg.is_read ? 'Seen' : 'Sent'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-gray-100 bg-white">
                    <form
                      onSubmit={handleSendMessage}
                      className="flex items-end gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 focus-within:border-green-200 focus-within:bg-white transition-all shadow-inner"
                    >
                      <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                        <Plus className="w-5 h-5" />
                      </button>
                      <Textarea
                        placeholder="Type a message..."
                        className="flex-1 min-h-[40px] max-h-[120px] bg-transparent border-none focus-visible:ring-0 px-2 py-2 text-sm resize-none"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className={cn(
                          "p-2.5 rounded-xl transition-all shadow-sm shrink-0",
                          newMessage.trim() ? "bg-green-700 text-white hover:scale-105" : "bg-gray-100 text-gray-300"
                        )}
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/20">
                  <div className="bg-green-50 p-6 rounded-full mb-6">
                    <MessageCircle className="w-12 h-12 text-green-200" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight mb-2">No active chat</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mb-8">
                    When you send an inquiry from a product listing, your conversation with the vendor will appear here.
                  </p>
                  <Button
                    asChild
                    onClick={() => setIsOpen(false)}
                    className="bg-green-700 hover:bg-green-800 rounded-full px-8 h-12 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-green-900/10 active:scale-95 transition-all"
                  >
                    <Link href="/markets">Browse products</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 relative",
          isOpen ? "bg-white text-green-800 border border-gray-100 rotate-90" : "bg-green-700 text-white hover:bg-green-800 scale-100"
        )}
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
        {!isOpen && unreadTotal > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-bounce">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </div>
        )}
      </button>
    </div>
  )
}
