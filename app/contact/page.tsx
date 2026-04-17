import { Mail, Phone, MapPin, Clock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050a05] pt-32 pb-20 transition-colors duration-500">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-20">
          <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-900/20">
                Treasury Department
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter">
                Get in <span className="font-serif italic text-green-700 dark:text-green-500">Touch</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-md">
                Have questions about stall rentals, business permits, or market fees? Our team is here to assist.
              </p>
            </div>

            <div className="space-y-8">
              {[
                { icon: <Phone className="w-5 h-5" />, label: "Phone", val: "(085) 817-6167", sub: "Mon-Fri, 8AM - 5PM" },
                { icon: <Mail className="w-5 h-5" />, label: "Email", val: "ctd@butuan.gov.ph", sub: "Average response: 24h" },
                { icon: <MapPin className="w-5 h-5" />, label: "Office", val: "City Hall Complex", sub: "Doongan, Butuan City" }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center text-green-700 shrink-0 border border-gray-100 dark:border-white/5">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">{item.label}</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.val}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="p-10 rounded-[3rem] bg-gray-50 dark:bg-[#0a0f0a] border border-gray-100 dark:border-white/5 shadow-2xl space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight font-serif italic">Send a Message</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Official inquiries are monitored by the Public Information Office.</p>
              </div>

              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input className="w-full h-14 px-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:ring-4 focus:ring-green-700/10 focus:border-green-700 transition-all text-sm font-bold" placeholder="Juan Dela Cruz" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                    <input className="w-full h-14 px-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:ring-4 focus:ring-green-700/10 focus:border-green-700 transition-all text-sm font-bold" placeholder="Stall Inquiry" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                  <textarea rows={5} className="w-full p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:ring-4 focus:ring-green-700/10 focus:border-green-700 transition-all text-sm font-bold resize-none" placeholder="Enter your detailed inquiry here..." />
                </div>
                <Button className="w-full h-16 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98]">
                  Submit Inquiry
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
