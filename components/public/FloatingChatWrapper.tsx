'use client'

import { usePathname } from 'next/navigation'
import FloatingChat from './FloatingChat'

export default function FloatingChatWrapper() {
  const pathname = usePathname()

  // Do NOT show on vendor dashboard, admin pages, or login/register
  const isExcluded = 
    pathname.startsWith('/vendor') || 
    pathname.startsWith('/admin') || 
    pathname === '/login' || 
    pathname === '/register'

  if (isExcluded) return null

  return <FloatingChat />
}
