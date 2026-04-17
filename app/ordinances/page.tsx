import { Gavel, Landmark, ScrollText, CheckCircle } from 'lucide-react'

export default function OrdinancesPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050a05] pt-32 pb-20 transition-colors duration-500">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/20">
              Regulatory Framework
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter">
              City <span className="font-serif italic text-indigo-600">Ordinances</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              Sangguniang Panlungsod Legislations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-4">
              <ScrollText className="w-8 h-8 text-indigo-700" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Market Governance</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                Comprehensive rules governing the allocation of stalls, sanitation standards, and operational hours of all Public Markets.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-4">
              <Gavel className="w-8 h-8 text-amber-600" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Revenue Code</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                Legal basis for market fees, rental rates, and business registration requirements in Butuan City.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight font-serif italic mb-8">Recent Legislations</h2>
            
            {[
              {
                id: "Ord. 2023-14",
                title: "Digital Market Integration Act",
                desc: "Mandating the use of the BCMS portal for government-monitored price tracking and vendor verification."
              },
              {
                id: "Ord. 2022-09",
                title: "Sustainable Market Waste Policy",
                desc: "Implementing zero-waste protocols and plastic reduction measures within market perimeters."
              },
              {
                id: "Ord. 2021-45",
                title: "Unified Stall Management Code",
                desc: "Standardizing the legal process for stall assignment and inheritance rights for local vendors."
              }
            ].map((ord, i) => (
              <div key={i} className="flex gap-6 p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                <div className="w-12 h-12 rounded-full border border-indigo-200 dark:border-indigo-900/30 flex items-center justify-center shrink-0 font-black text-[10px] text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition-all">
                  PDF
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{ord.id}</span>
                    <h4 className="text-lg font-black text-gray-900 dark:text-white">{ord.title}</h4>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{ord.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
