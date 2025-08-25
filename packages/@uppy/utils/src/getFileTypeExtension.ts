const mimeToExtensions = {
  __proto__: null,
  'audio/mp3': 'mp3',
  'audio/mp4': 'mp4',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv',
  'video/x-msvideo': 'avi',
} as unknown as Record<string, string>

export default function getFileTypeExtension(mimeType: string): string | null {
  // Remove the ; bit in 'video/x-matroska;codecs=avc1'
  ;[mimeType] = mimeType.split(';', 1)
  return mimeToExtensions[mimeType] || null
}
