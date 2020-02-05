/**
 * Checks if current device reports itself as “mobile”.
 * Very simple, not very reliable.
 *
 * @returns {boolean}
 */
module.exports = function isMobileDevice () {
  if (window && window.navigator && window.navigator.userAgent.match(/Mobi/)) {
    return true
  }
  return false
}
