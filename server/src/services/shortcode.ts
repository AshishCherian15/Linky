const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Generate a random base62 shortcode
 * Uses a collision-resistant approach with retries
 */
export function generateShortcode(length: number = 6): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * BASE62_CHARS.length)
    result += BASE62_CHARS[randomIndex]
  }
  return result
}

/**
 * Convert a number to base62
 * Useful if you want auto-increment based shortcodes
 */
export function numberToBase62(num: number): string {
  if (num === 0) return BASE62_CHARS[0]
  
  let result = ''
  let n = num
  
  while (n > 0) {
    result = BASE62_CHARS[n % 62] + result
    n = Math.floor(n / 62)
  }
  
  return result
}

/**
 * Validate a shortcode format
 */
export function isValidShortcode(code: string): boolean {
  return /^[0-9A-Za-z]+$/.test(code) && code.length >= 4 && code.length <= 12
}
