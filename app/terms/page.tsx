import { FileText, Scale, Handshake, AlertCircle } from 'lucide-react'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050a05] pt-32 pb-20 transition-colors duration-500">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-900/20">
              User Agreement
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter">
              Terms of <span className="font-serif italic text-amber-600">Service</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              Effective Date: October 2024
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-4">
              <Scale className="w-8 h-8 text-amber-600" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Fair Trade</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                All vendors must adhere to the Price Act and local market regulations regarding fair pricing and accurate weighting of goods.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-4">
              <Handshake className="w-8 h-8 text-green-700" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">User Conduct</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                The platform is intended for professional inquiry and market monitoring. Harassment or misuse of the messenger system is strictly prohibited.
              </p>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-300">
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight font-serif italic border-l-4 border-amber-600 pl-4">1. Scope of Service</h2>
              <p className="leading-relaxed font-medium">
                BCMS is an informational platform provided by the Butuan City Government. While we verify vendor identities, transactions agreed upon through the inquiry system are the responsibility of the participating parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight font-serif italic border-l-4 border-amber-600 pl-4">2. Vendor Responsibilities</h2>
              <p className="leading-relaxed font-medium">
                Vendors are required to keep their "Live Prices" accurate to within a 5% margin of actual stall prices. Repeated discrepancies may lead to temporary suspension from the digital portal.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight font-serif italic border-l-4 border-amber-600 pl-4">3. Limitation of Liability</h2>
              <p className="leading-relaxed font-medium">
                The Butuan City Government is not liable for direct or indirect damages resulting from system downtime or inaccuracies in decentralized data contributed by independent vendors.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
