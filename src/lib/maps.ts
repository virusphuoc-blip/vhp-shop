const LATLNG_RE = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/
const MAPS_URL_RE = /^https:\/\/(maps\.google\.[a-z.]+|www\.google\.[a-z.]+\/maps|google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)([/?#]|$)/i

/** Link Google Maps từ toạ độ "lat,lng" hoặc link Google Maps; null nếu không hợp lệ. */
export function mapsUrl(input: string): string | null {
  const v = input.trim()
  if (!v) return null
  const m = LATLNG_RE.exec(v)
  if (m) {
    const lat = Number(m[1])
    const lng = Number(m[2])
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
    return `https://maps.google.com/?q=${lat},${lng}`
  }
  return MAPS_URL_RE.test(v) && v.length <= 500 && !/\s/.test(v) ? v : null
}
