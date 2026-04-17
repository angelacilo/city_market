import { Shield, Lock, Eye, FileText } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050a05] pt-32 pb-20 transition-colors duration-500">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-900/20">
              Legal Document
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter">
              Privacy <span className="font-serif italic text-green-700 dark:text-green-500">Policy</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              Last Updated: October 2024
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-4">
              <Shield className="w-8 h-8 text-green-700" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Data Protection</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                We employ industry-standard encryption and security protocols to ensure that your personal information and transaction data remain confidential and protected.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-4">
              <Eye className="w-8 h-8 text-amber-600" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Transparency</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                We believe in total transparency regarding how your data is used. We only collect information necessary to improve the market experience for Butuanons.
              </p>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-300">
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight font-serif italic border-l-4 border-green-700 pl-4">1. Information Collection</h2>
              <p className="leading-relaxed font-medium">
                The Butuan City Market System (BCMS) collects minimal personal data to facilitate vendor-buyer communication and market monitoring. This includes name, contact number (for verified accounts), and basic browsing metrics to optimize system performance.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight font-serif italic border-l-4 border-green-700 pl-4">2. Use of Information</h2>
              <p className="leading-relaxed font-medium">
                Your data is exclusively used for:
              </p>
              <ul className="list-disc pl-6 space-y-2 font-medium">
                <li>Verifying market vendor identities.</li>
                <li>Facilitating the "Inquiry" system between buyers and sellers.</li>
                <li>Aggregating market price data for public transparency reports.</li>
                <li>Ensuring the security and integrity of the digital marketplace.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight font-serif italic border-l-4 border-green-700 pl-4">3. Data Sovereignty</h2>
              <p className="leading-relaxed font-medium">
                As a user, you retain the right to your data. All government data handled through BCMS complies with the Data Privacy Act of 2012 (RA 10173). You may request data deletion or access at any time through our contact channels.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
