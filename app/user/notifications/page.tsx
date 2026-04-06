'use client'
 
import { Bell, Mail, Clock, Inbox } from 'lucide-react'
import Link from 'next/link'
 
export default function NotificationsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-24 px-6 min-h-screen">
      <div className="flex flex-col gap-3 mb-12">
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-6 bg-[#1b6b3e] rounded-full" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1b6b3e]">Personal Hub</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight italic font-serif">System <span className="text-[#1b6b3e]">Notifications</span></h1>
        <p className="text-sm font-medium text-gray-500 max-w-lg">Stay updated with price alerts, vendor replies, and market announcements.</p>
      </div>
 
      <div className="bg-white rounded-[3.5rem] border border-gray-50 shadow-2xl p-16 flex flex-col items-center justify-center text-center relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-green-50/30 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
         
         <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-10 border border-gray-100 group-hover:scale-110 transition-transform duration-500">
            <Bell className="w-10 h-10 text-gray-200 group-hover:text-[#1b6b3e] transition-colors" />
         </div>
         
         <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight leading-none italic font-serif">No new notifications</h3>
         <p className="text-gray-400 font-medium max-w-[320px] text-sm leading-relaxed mb-10">
            You're all caught up! When vendors reply to your messages or products you follow change price, they'll appear here.
         </p>
         
         <Link href="/user/messages">
            <button className="h-14 px-10 rounded-[1.25rem] bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-900/20 active:scale-95 transition-all flex items-center gap-4">
               <Mail className="w-4 h-4" />
               Check Messages Instead
            </button>
         </Link>
      </div>
    </div>
  )
}
