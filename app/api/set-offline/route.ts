import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type } = body

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing userId or type' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    if (type === 'buyer') {
      const { error } = await supabase
        .from('buyer_profiles')
        .update({
          is_online: false,
          last_seen_at: now
        })
        .eq('user_id', userId)

      if (error) throw error
    } else if (type === 'vendor') {
      const { error } = await supabase
        .from('vendors')
        .update({
          is_online: false,
          last_seen_at: now
        })
        .eq('user_id', userId)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set offline error:', error)
    return NextResponse.json(
      { error: 'Failed to set offline status' },
      { status: 500 }
    )
  }
}
