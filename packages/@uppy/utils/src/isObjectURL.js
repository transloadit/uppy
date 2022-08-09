/**
 * Check if a URL string is an object URL from `URL.createObjectURL`.
 *
 * @param {string} url
 * @returns {boolean}
 */
export default function isObjectURL (url) {
  return url.startsWith('blob:')
}
