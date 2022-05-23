export default function isPreviewSupported (fileType) {
  if (!fileType) return false
  // list of images that browsers can preview
  return /^[^/]+\/(jpe?g|gif|png|svg|svg\+xml|bmp|webp|avif)$/.test(fileType)
}
