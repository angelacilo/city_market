const STORAGE_KEY = 'bcmis_inquiry_timestamps'
const MAX_INQUIRIES_PER_HOUR = 5
const HOUR_MS = 3_600_000

interface RateLimitResult {
  allowed: boolean
  remainingMinutes: number
}

export function checkInquiryRateLimit(): RateLimitResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const now = Date.now()
    const cutoff = now - HOUR_MS

    // Parse existing timestamps, keep only those within the last hour
    let timestamps: number[] = []
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          timestamps = parsed.filter((t) => typeof t === 'number' && t > cutoff)
        }
      } catch {
        timestamps = []
      }
    }

    if (timestamps.length < MAX_INQUIRIES_PER_HOUR) {
      // Allow — add current timestamp and persist
      timestamps.push(now)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps))
      return { allowed: true, remainingMinutes: 0 }
    }

    // Blocked — calculate when the oldest entry expires
    const oldest = Math.min(...timestamps)
    const resetAt = oldest + HOUR_MS
    const diffMs = resetAt - now
    const remainingMinutes = Math.ceil(diffMs / 60_000)

    return { allowed: false, remainingMinutes: Math.max(1, remainingMinutes) }
  } catch {
    // localStorage unavailable (SSR, private mode, etc.) — allow by default
    return { allowed: true, remainingMinutes: 0 }
  }
}
