import { PhoneCall, ShieldAlert, HeartPulse, Flame, Siren, AlertTriangle } from 'lucide-react'

export default function EmergencyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050a05] pt-32 pb-20 transition-colors duration-500">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-6 max-w-3xl">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-900/20">
              Immediate Assistance
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter">
              Emergency <span className="font-serif italic text-red-600">Hotlines</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl">
              Quick access to Butuan City's vital emergency services. Save these numbers for immediate response during market hours or city-wide incidents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Siren className="w-8 h-8 text-red-600" />, title: "CDRRMO", val: "911 / (085) 341-XXXX", desc: "Disaster Risk Reduction and Management Office" },
              { icon: <ShieldAlert className="w-8 h-8 text-blue-700" />, title: "City Police", val: "117 / (085) 342-XXXX", desc: "Butuan City Police Office (BCPO) Headquarters" },
              { icon: <Flame className="w-8 h-8 text-orange-600" />, title: "Bureau of Fire", val: "(085) 341-YYYY", desc: "Immediate Fire response and fire safety inspections" },
              { icon: <HeartPulse className="w-8 h-8 text-red-700" />, title: "Medical / Ambulance", val: "(085) 815-ZZZZ", desc: "Emergency medical transport and hospital coordination" },
              { icon: <AlertTriangle className="w-8 h-8 text-amber-600" />, title: "Market Security", val: "Local Stall 101", desc: "On-site market guards and security personnel" },
              { icon: <PhoneCall className="w-8 h-8 text-green-700" />, title: "Hotline Butuan", val: "888", desc: "General city government feedback and assistance" }
            ].map((hotline, i) => (
              <div key={i} className="group p-8 rounded-[2.5rem] bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-6 hover:bg-white dark:hover:bg-[#0a0f0a] hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-black/20 flex items-center justify-center shadow-sm group-hover:bg-red-50 dark:group-hover:bg-red-900/10 transition-colors">
                  {hotline.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{hotline.title}</h3>
                  <p className="text-2xl font-black text-red-600 dark:text-red-500 tracking-tighter">{hotline.val}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{hotline.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-10 rounded-[3rem] bg-amber-50 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/20 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-amber-900 dark:text-amber-400">Public Safety Notice</h4>
              <p className="text-sm text-amber-800/70 dark:text-amber-500/60 font-medium leading-relaxed">
                During market peak hours (4 AM - 9 AM), please follow the designated entry and exit points. Emergency vehicles have priority access through the North perimeter gate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
