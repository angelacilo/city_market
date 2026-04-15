import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  try {
    const start = Date.now()
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    const duration = Date.now() - start

    if (error) {
       return NextResponse.json({ 
         status: 'degraded', 
         error: error.message,
         code: error.code,
         duration: `${duration}ms`
       }, { status: 500 })
    }

    return NextResponse.json({ 
      status: 'healthy', 
      supabase: 'connected',
      latency: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 })
  }
}
