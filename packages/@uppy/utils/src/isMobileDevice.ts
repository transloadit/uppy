/**
 * Checks if current device reports itself as “mobile”.
 * Very simple, not very reliable.
 */
export default function isMobileDevice(): boolean {
  if (
    typeof window !== 'undefined' &&
    window.navigator &&
    window.navigator.userAgent &&
    window.navigator.userAgent.match(/Mobi/)
  ) {
    return true
  }
  return false
}
