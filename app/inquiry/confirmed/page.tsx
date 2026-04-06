import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Inquiry Sent | Butuan City Market',
  description: 'Your inquiry has been sent successfully to the vendor.',
}

interface Props {
  searchParams: Promise<{ vendor?: string; product?: string; contact?: string }>
}

export default async function InquiryConfirmedPage({ searchParams }: Props) {
  const params = await searchParams
  const vendorName = params.vendor ?? 'the vendor'
  const productName = params.product ?? 'the product'
  const contact = params.contact ?? 'your number'

  const tips = [
    'The vendor typically responds within a few hours.',
    'Make sure your phone is on and accepting calls or messages.',
    'You can also visit the vendor directly at their stall.',
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center space-y-5">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-900">Inquiry sent!</h1>

        <p className="text-sm text-gray-500 leading-relaxed">
          Your message has been sent to{' '}
          <span className="font-bold text-gray-700">{vendorName}</span> about{' '}
          <span className="font-bold text-green-700">{productName}</span>. They
          will contact you at{' '}
          <span className="font-bold text-green-700">{contact}</span> as soon as
          possible.
        </p>

        {/* Tips box */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-left space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Button asChild className="h-12 bg-green-600 hover:bg-green-700 text-white font-black text-sm">
            <Link href="/">Browse more products</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 font-bold text-sm">
            <Link href="/compare">Compare prices</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
