'use client'
import { MessageSquare } from 'lucide-react'

export default function BuyerInquiriesManager() {
  return (
    <div className="p-6">
       <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold">My Inquiries</h2>
      </div>
      <div className="text-sm text-gray-500 italic">History of your conversations with market vendors.</div>
    </div>
  )
}
