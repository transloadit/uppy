/**
 * Copies text to clipboard by creating an almost invisible textarea,
 * adding text there, then running execCommand('copy').
 * Falls back to prompt() when the easy way fails (hello, Safari!)
 * From http://stackoverflow.com/a/30810322
 *
 * @param {string} textToCopy
 * @param {string} fallbackString
 * @returns {Promise}
 */
export default function copyToClipboard(
  textToCopy: string,
  fallbackString = 'Copy the URL below',
): Promise<void> {
  return new Promise((resolve) => {
    const textArea = document.createElement('textarea')
    textArea.style.position = 'fixed'
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.width = '2em'
    textArea.style.height = '2em'
    textArea.style.padding = '0'
    textArea.style.border = 'none'
    textArea.style.outline = 'none'
    textArea.style.boxShadow = 'none'
    textArea.style.background = 'transparent'

    textArea.value = textToCopy
    document.body.appendChild(textArea)
    textArea.select()

    const magicCopyFailed = () => {
      document.body.removeChild(textArea)
      window.prompt(fallbackString, textToCopy)
      resolve()
    }

    try {
      const successful = document.execCommand('copy')
      if (!successful) {
        return magicCopyFailed()
      }
      document.body.removeChild(textArea)
      resolve()
    } catch {
      document.body.removeChild(textArea)
      return magicCopyFailed()
    }
  })
}
