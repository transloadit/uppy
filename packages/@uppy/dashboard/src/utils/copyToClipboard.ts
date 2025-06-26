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

type $TSFixMe = any

export default function copyToClipboard(
  textToCopy: $TSFixMe,
  fallbackString = 'Copy the URL below',
): $TSFixMe {
  return new Promise<void>((resolve) => {
    const textArea = document.createElement('textarea')
    textArea.setAttribute('style', {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '2em',
      height: '2em',
      padding: 0,
      border: 'none',
      outline: 'none',
      boxShadow: 'none',
      background: 'transparent',
    } as $TSFixMe as string)

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
      return resolve()
    } catch (_err) {
      document.body.removeChild(textArea)
      return magicCopyFailed()
    }
  })
}
