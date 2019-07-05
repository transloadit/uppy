/**
 * Truncates a string to the given number of chars (maxLength) by inserting '...' in the middle of that string.
 * Partially taken from https://stackoverflow.com/a/5723274/3192470.
 *
 * @param {string} string - string to be truncated
 * @param {number} maxLength - maximum size of the resulting string
 * @returns {string}
 */
module.exports = function truncateString (string, maxLength) {
  const separator = '...'

  // Return original string if it's already shorter than maxLength
  if (string.length <= maxLength) {
    return string
  // Return truncated substring without '...' if string can't be meaningfully truncated
  } else if (maxLength <= separator.length) {
    return string.substr(0, maxLength)
  // Return truncated string divided in half by '...'
  } else {
    const charsToShow = maxLength - separator.length
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)

    return string.substr(0, frontChars) + separator + string.substr(string.length - backChars)
  }
}
