const DATA_URL_PATTERN = /^data:([^/]+\/[^,;]+(?:[^,]*?))(;base64)?,([\s\S]*)$/

export default function dataURItoBlob (dataURI, opts, toFile) {
  // get the base64 data
  const dataURIData = DATA_URL_PATTERN.exec(dataURI)

  // user may provide mime type, if not get it from data URI
  const mimeType = opts.mimeType ?? dataURIData?.[1] ?? 'plain/text'

  let data
  if (dataURIData[2] != null) {
    const binary = atob(decodeURIComponent(dataURIData[3]))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    data = [bytes]
  } else {
    data = [decodeURIComponent(dataURIData[3])]
  }

  // Convert to a File?
  if (toFile) {
    return new File(data, opts.name || '', { type: mimeType })
  }

  return new Blob(data, { type: mimeType })
}
