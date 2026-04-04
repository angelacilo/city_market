'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  inquiry_id: string
  sender_role: 'buyer' | 'vendor'
  content: string
  created_at: string
}

interface InquiryChatProps {
  inquiryId: string
  role: 'buyer' | 'vendor'
  buyerName?: string
  vendorName?: string
}

export default function InquiryChat({ inquiryId, role, buyerName = 'Buyer', vendorName = 'Vendor' }: InquiryChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchMessages() {
      // First, get the initial message from the inquiry table
      const { data: inquiryData } = await supabase
        .from('inquiries')
        .select('message, created_at')
        .eq('id', inquiryId)
        .single()

      // Then get follow-up messages
      const { data: threadData, error } = await supabase
        .from('messages')
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
      setLoading(false)
    }

    fetchMessages()

    const channel = supabase
      .channel(`inquiry:${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [inquiryId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const { error } = await supabase.from('messages').insert({
      inquiry_id: inquiryId,
      sender_role: role,
      content: newMessage.trim(),
    })

    if (!error) {
      setNewMessage('')
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
        {messages.map((m) => (
          <div 
            key={m.id}
            className={cn(
              "flex flex-col max-w-[85%] transition-all",
              m.sender_role === role ? "ml-auto items-end" : "items-start"
            )}
          >
            <div className={cn(
              "px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
              m.sender_role === role 
                ? "bg-[#1d631d] text-white rounded-tr-none" 
                : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-50"
            )}>
              {m.content}
            </div>
            <span className="text-[9px] font-black text-gray-400 mt-1 uppercase tracking-widest pl-1 pr-1">
              {m.sender_role === 'vendor' ? vendorName : buyerName} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
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
