'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sendMessage } from '@/lib/actions/messenger'

interface Message {
  id: string
  conversation_id?: string
  inquiry_id?: string
  sender_type?: 'buyer' | 'vendor' // New
  sender_role?: 'buyer' | 'vendor' // Old
  content: string
  created_at: string
}

interface InquiryChatProps {
  conversationId?: string
  inquiryId?: string
  role: 'buyer' | 'vendor'
  buyerName?: string
  vendorName?: string
}

export default function InquiryChat({ 
  conversationId, 
  inquiryId, 
  role, 
  buyerName = 'Buyer', 
  vendorName = 'Vendor' 
}: InquiryChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true)
      
      if (conversationId) {
        // NEW SYSTEM
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (!error && data) {
          setMessages(data)
        }
      } else if (inquiryId) {
        // OLD SYSTEM (Backward Compatibility)
        const { data: inquiryData } = await supabase
          .from('inquiries')
          .select('message, created_at')
          .eq('id', inquiryId)
          .single()

        const { data: threadData, error } = await supabase
          .from('inquiry_messages')
          .select('*')
          .eq('inquiry_id', inquiryId)
          .order('created_at', { ascending: true })

        let allMessages: Message[] = []
        if (inquiryData) {
          allMessages.push({
            id: 'initial',
            inquiry_id: inquiryId,
            sender_role: 'buyer',
            content: inquiryData.message,
            created_at: inquiryData.created_at
          })
        }
        if (!error && threadData) {
          allMessages = [...allMessages, ...threadData]
        }
        setMessages(allMessages)
      }
      setLoading(false)
    }

    fetchMessages()

    // Real-time subscription
    let channel: any
    if (conversationId) {
      channel = supabase
        .channel(`chat:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        )
        .subscribe()
    } else if (inquiryId) {
      channel = supabase
        .channel(`inquiry:${inquiryId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'inquiry_messages',
            filter: `inquiry_id=eq.${inquiryId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        )
        .subscribe()
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [conversationId, inquiryId, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    
    if (conversationId) {
      // Use Server Action for tracking and updating conversation meta
      const result = await sendMessage({
        conversationId,
        senderType: role,
        content: newMessage.trim()
      })
      if (!result.error) {
        setNewMessage('')
      }
    } else if (inquiryId) {
      // Old direct insert
      const { error } = await supabase.from('inquiry_messages').insert({
        inquiry_id: inquiryId,
        sender_role: role,
        content: newMessage.trim(),
      })
      if (!error) {
        setNewMessage('')
      }
    }
    
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-green-700" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar min-h-[350px]"
      >
        {messages.map((m) => {
          const isMe = (m.sender_type || m.sender_role) === role
          const senderName = (m.sender_type || m.sender_role) === 'vendor' ? vendorName : buyerName

          return (
            <div 
              key={m.id}
              className={cn(
                "flex flex-col max-w-[85%] transition-all",
                isMe ? "ml-auto items-end" : "items-start"
              )}
            >
              <div className={cn(
                "px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                isMe 
                  ? "bg-[#1d631d] text-white rounded-tr-none" 
                  : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-50"
              )}>
                {m.content}
              </div>
              <span className="text-[9px] font-black text-gray-400 mt-1 uppercase tracking-widest pl-1 pr-1">
                {senderName} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-50 flex gap-3 bg-white">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write your message..."
          className="rounded-xl bg-gray-50 border-none h-12 px-6 font-bold text-sm focus:bg-white transition-all ring-0 focus-visible:ring-[#1d631d]/10"
        />
        <Button 
          type="submit" 
          disabled={!newMessage.trim() || sending}
          className="h-12 w-12 rounded-xl bg-[#1d631d] hover:bg-[#164d16] text-white p-0 shadow-lg shadow-[#1d631d]/20 shrink-0"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </form>
    </div>
  )
}
