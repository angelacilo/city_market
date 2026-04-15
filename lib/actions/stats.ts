'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAboutStats() {
  const supabase = await createClient()
  
  try {
    // 1. Total Verified Vendors
    const { count: vendorCount } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })

    // 2. Total Public Markets
    const { count: marketCount } = await supabase
      .from('markets')
      .select('*', { count: 'exact', head: true })

    // 3. Weekly Visitors - Fetch from system_settings or approximate 
    // For now, let's fetch a base value and add a small random "live" offset to feel real-time
    const { data: visitorSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'weekly_visitors_base')
      .maybeSingle()

    const baseVisitors = visitorSetting ? parseInt(visitorSetting.value) : 15000
    // Dynamic offset based on hour of the day to simulate traffic
    const hour = new Date().getHours()
    const trafficMultiplier = Math.sin((hour / 24) * Math.PI) * 500
    const liveVisitors = Math.floor(baseVisitors + trafficMultiplier + (Math.random() * 50))

    return {
      vendors: vendorCount || 0,
      markets: marketCount || 0,
      visitors: liveVisitors
    }
  } catch (err) {
    console.error('Error fetching about stats:', err)
    return {
      vendors: 0,
      markets: 0,
      visitors: 0
    }
  }
}
