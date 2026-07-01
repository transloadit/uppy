/**
 * Check if a URL string is an object URL from `URL.createObjectURL`.
 */
export default function isObjectURL(url: string): boolean {
  return url.startsWith('blob:')
}
