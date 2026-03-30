'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function ConditionalNavbar() {
  const pathname = usePathname()
  
  // Hide global navbar on vendor dashboard and auth pages
  const hideOn = ['/vendor', '/login', '/register']
  const shouldHide = hideOn.some(path => pathname.startsWith(path))

  if (shouldHide) return null

  return <Navbar />
}
