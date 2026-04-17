import { Info, Newspaper, Radio, Globe, Twitter, Facebook, Youtube } from 'lucide-react'

export default function PIOPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050a05] pt-32 pb-20 transition-colors duration-500">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20">
              Information & Transparency
            </div>
            <h1 className="text-6xl font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter">
              Public <span className="font-serif italic text-blue-600">Information</span> <span className="block italic font-serif">Office</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Serving as the official communication arm of the Butuan City Government. We bridge the gap between government policy and public understanding.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Newspaper className="w-8 h-8 text-blue-700" />, title: "News & Bulletins", desc: "Stay updated with the latest administrative orders and market development news." },
              { icon: <Radio className="w-8 h-8 text-indigo-600" />, title: "Broadcasting", desc: "Official radio and digital broadcasts regarding city-wide market initiatives." },
              { icon: <Globe className="w-8 h-8 text-green-700" />, title: "Digital Platform", desc: "Managing the BCMS portal and other community-facing digital services." }
            ].map((service, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-6 hover:translate-y-[-8px] transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-black/20 flex items-center justify-center shadow-sm">
                  {service.icon}
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{service.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="space-y-4">
                <h3 className="text-3xl font-black font-serif italic tracking-tight">Connect on Social</h3>
                <p className="text-blue-100/70 font-medium uppercase text-[10px] tracking-widest">Official verified channels for Butuan City news</p>
              </div>
              <div className="flex gap-4">
                {[Facebook, Twitter, Youtube].map((Icon, i) => (
                  <div key={i} className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95">
                    <Icon className="w-6 h-6" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
