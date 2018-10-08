// TODO Check which types are actually supported in browsers. Chrome likes webm
// from my testing, but we may need more.
// We could use a library but they tend to contain dozens of KBs of mappings,
// most of which will go unused, so not sure if that's worth it.
const mimeToExtensions = {
  'video/ogg': 'ogv',
  'audio/ogg': 'ogg',
  'video/webm': 'webm',
  'audio/webm': 'webm',
  'video/x-matroska': 'mkv',
  'video/mp4': 'mp4',
  'audio/mp3': 'mp3'
}

module.exports = function getFileTypeExtension (mimeType) {
  // Remove the ; bit in 'video/x-matroska;codecs=avc1'
  mimeType = mimeType.replace(/;.*$/, '')
  return mimeToExtensions[mimeType] || null
}
