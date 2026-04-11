import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#050a05] px-6 py-10 transition-colors duration-500 dark:shadow-[0_-30px_50px_-20px_rgba(27,107,62,0.1)]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Butuan City Market</p>
          <div className="mt-3 space-y-1 text-xs leading-relaxed text-gray-400 dark:text-gray-300">
            <p>© 2026 All rights reserved.</p>
            <p>Verified official information.</p>
            <p>
              The Butuan Market Information System is a flagship initiative of the Department of Agriculture
              and City Hall.
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Resources</p>
          <ul className="mt-3 space-y-2">
            {['Privacy Policy', 'Terms of Service', 'Market Data'].map((label) => (
              <li key={label}>
                <Link href="#" className="text-xs text-gray-400 hover:text-gray-600">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">Contact Us</p>
          <ul className="mt-3 space-y-2">
            {['City Hall Contact', 'Department of Agriculture', 'Report an Issue'].map((label) => (
              <li key={label}>
                <Link href="#" className="text-xs text-gray-400 hover:text-gray-600">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
