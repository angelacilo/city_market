/**
 * Returns the market name for a given market id from the markets array.
 * Returns an empty string if not found.
 */
export function getMarketName(
  markets: { id: string; name: string }[],
  marketId: string
): string {
  return markets.find((m) => m.id === marketId)?.name ?? ''
}

/**
 * Strips all non-digit characters from a phone number string and
 * returns the cleaned string. Ensures it starts with 09.
 */
export function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('639')) return '0' + digits.slice(2)
  return digits
}
