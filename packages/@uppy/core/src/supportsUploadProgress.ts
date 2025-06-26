// Edge 15.x does not fire 'progress' events on uploads.
// See https://github.com/transloadit/uppy/issues/945
// And https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12224510/
export default function supportsUploadProgress(userAgent?: string): boolean {
  // Allow passing in userAgent for tests
  if (userAgent == null && typeof navigator !== 'undefined') {
    userAgent = navigator.userAgent
  }
  // Assume it works because basically everything supports progress events.
  if (!userAgent) return true

  const m = /Edge\/(\d+\.\d+)/.exec(userAgent)
  if (!m) return true

  const edgeVersion = m[1]
  const version = edgeVersion.split('.', 2)
  const major = parseInt(version[0], 10)
  const minor = parseInt(version[1], 10)

  // Worked before:
  // Edge 40.15063.0.0
  // Microsoft EdgeHTML 15.15063
  if (major < 15 || (major === 15 && minor < 15063)) {
    return true
  }

  // Fixed in:
  // Microsoft EdgeHTML 18.18218
  if (major > 18 || (major === 18 && minor >= 18218)) {
    return true
  }

  // other versions don't work.
  return false
}
