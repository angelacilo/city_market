import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
        <div>
          <p className="text-sm font-bold text-gray-900">Butuan City Market</p>
          <div className="mt-3 space-y-1 text-xs leading-relaxed text-gray-400">
            <p>© 2026 All rights reserved.</p>
            <p>Verified official information.</p>
            <p>
              The Butuan Market Information System is a flagship initiative of the Department of Agriculture
              and City Hall.
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resources</p>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact Us</p>
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
