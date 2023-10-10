/**
 * Truncates a string to the given number of chars (maxLength) by inserting '...' in the middle of that string.
 * Partially taken from https://stackoverflow.com/a/5723274/3192470.
 */
const separator = '...'
export default function truncateString(
  string: string,
  maxLength: number,
): string {
  // Return the empty string if maxLength is zero
  if (maxLength === 0) return ''
  // Return original string if it's already shorter than maxLength
  if (string.length <= maxLength) return string
  // Return truncated substring appended of the ellipsis char if string can't be meaningfully truncated
  if (maxLength <= separator.length + 1)
    return `${string.slice(0, maxLength - 1)}…`

  const charsToShow = maxLength - separator.length
  const frontChars = Math.ceil(charsToShow / 2)
  const backChars = Math.floor(charsToShow / 2)

  return string.slice(0, frontChars) + separator + string.slice(-backChars)
}
