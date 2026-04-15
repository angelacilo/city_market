'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Aggregates public statistics for the About and landing pages.
 * Fetches real totals from Postgres and calculates a dynamic "live traffic" 
 * estimate for visual engagement.
 */
export async function getAboutStats() {
  const supabase = await createClient()
  
  try {
    // 1. Total Verified Vendors - Head-only count for performance
    const { count: vendorCount } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })

    // 2. Total Public Markets - Head-only count
    const { count: marketCount } = await supabase
      .from('markets')
      .select('*', { count: 'exact', head: true })

    // 3. Weekly Visitors - Simulations
    // Fetches a baseline from system_settings and applies a sinusoidal 
    // traffic multiplier based on the current hour of the day.
    const { data: visitorSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'weekly_visitors_base')
      .maybeSingle()

    const baseVisitors = visitorSetting ? parseInt(visitorSetting.value) : 15000
    
    // Dynamic offset: Higher traffic during midday, lower at night
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
