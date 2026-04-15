import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#050a05] py-12 border-t border-gray-100 dark:border-white/5 transition-colors duration-500">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-8">
          {/* Brand Section */}
          <div className="max-w-xs space-y-4">
            <h3 className="text-xl font-black text-green-700 dark:text-green-500 font-serif italic tracking-tight">
              Butuan City Market
            </h3>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-widest opacity-70">
              Verified official market data portal for the City of Butuan. Empowering citizens through transparency and digital agricultural synergy.
            </p>
            <div className="pt-4">
              <p className="text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">
                © 2024 BUTUAN CITY GOVERNMENT. VERIFIED OFFICIAL MARKET DATA.
              </p>
            </div>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-2 gap-8 md:gap-20">
            <div className="space-y-6">
              <h4 className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-[0.4em] mb-4">Legal & Policy</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-[10px] font-bold text-gray-400 hover:text-green-700 dark:hover:text-green-500 transition-colors uppercase tracking-widest">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-[10px] font-bold text-gray-400 hover:text-green-700 dark:hover:text-green-500 transition-colors uppercase tracking-widest">Terms of Service</Link></li>
                <li><Link href="/ordinances" className="text-[10px] font-bold text-gray-400 hover:text-green-700 dark:hover:text-green-500 transition-colors uppercase tracking-widest">City Ordinances</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-[0.4em] mb-4">Connect</h4>
              <ul className="space-y-3">
                <li><Link href="/contact" className="text-[10px] font-bold text-gray-400 hover:text-green-700 dark:hover:text-green-500 transition-colors uppercase tracking-widest">Contact Treasury</Link></li>
                <li><Link href="/pio" className="text-[10px] font-bold text-gray-400 hover:text-green-700 dark:hover:text-green-500 transition-colors uppercase tracking-widest">Public Information Office</Link></li>
                <li><Link href="/emergency" className="text-[10px] font-bold text-gray-400 hover:text-green-700 dark:hover:text-green-500 transition-colors uppercase tracking-widest">Emergency Hotline</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
