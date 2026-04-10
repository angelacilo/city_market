'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  useEffect(() => {
    let interval: NodeJS.Timeout
    let currentUserId: string | null = null

    const updatePresence = async (status: boolean) => {
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          currentUserId = session.user.id
        } else {
          return
        }
      }

      const now = new Date().toISOString()

      // Update both potential tables based on user_id
      // RLS should ensure only the owner can update their own record
      
      // Update Vendor Profile if exists
      await supabase
        .from('vendors')
        .update({ 
          is_online: status, 
          last_seen_at: now 
        })
        .eq('user_id', currentUserId)

      // Update Buyer Profile if exists
      await supabase
        .from('buyer_profiles')
        .update({ 
          is_online: status, 
          last_seen_at: now 
        })
        .eq('user_id', currentUserId)
    }

    const initPresence = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        currentUserId = session.user.id
        await updatePresence(true)
        
        // Start heartbeat every 45 seconds
        interval = setInterval(() => updatePresence(true), 45000)
      }
    }

    initPresence()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence(true)
      }
    }

    const handleBeforeUnload = () => {
      if (currentUserId) {
        updatePresence(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Also handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        currentUserId = session.user.id
        updatePresence(true)
      } else if (event === 'SIGNED_OUT') {
        if (currentUserId) updatePresence(false)
        currentUserId = null
      }
    })

    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      subscription.unsubscribe()
      if (currentUserId) {
        updatePresence(false)
      }
    }
  }, [supabase])

  return <>{children}</>
}
