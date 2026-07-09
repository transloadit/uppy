export default function isPreviewSupported(fileType: string): boolean {
  if (!fileType) return false
  // list of images that browsers can preview
  return /^[^/]+\/(jpe?g|gif|png|svg|svg\+xml|bmp|webp|avif)$/.test(fileType)
}
