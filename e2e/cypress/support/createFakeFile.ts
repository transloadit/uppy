declare global {
  namespace Cypress {
    interface Chainable {
      // eslint-disable-next-line no-use-before-define
      createFakeFile: typeof createFakeFile
    }
  }
}

interface File {
  source: string
  name: string
  type: string
  data: Blob
}

export function createFakeFile(
  name?: string,
  type?: string,
  b64?: string,
): File {
  if (!b64) {
    // eslint-disable-next-line no-param-reassign
    b64 =
      'PHN2ZyB2aWV3Qm94PSIwIDAgMTIwIDEyMCI+CiAgPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNTAiLz4KPC9zdmc+Cg=='
  }
  // eslint-disable-next-line no-param-reassign
  if (!type) type = 'image/svg+xml'

  // https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
  function base64toBlob(base64Data: string, contentType = '') {
    const sliceSize = 1024
    const byteCharacters = atob(base64Data)
    const bytesLength = byteCharacters.length
    const slicesCount = Math.ceil(bytesLength / sliceSize)
    const byteArrays = new Array(slicesCount)

    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      const begin = sliceIndex * sliceSize
      const end = Math.min(begin + sliceSize, bytesLength)

      const bytes = new Array(end - begin)
      for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters[offset].charCodeAt(0)
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes)
    }
    return new Blob(byteArrays, { type: contentType })
  }

  const blob = base64toBlob(b64, type)

  return {
    source: 'test',
    name: name || 'test-file',
    type: blob.type,
    data: blob,
  }
}
