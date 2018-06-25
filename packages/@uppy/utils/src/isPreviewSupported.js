module.exports = function isPreviewSupported (fileType) {
  if (!fileType) return false
  const fileTypeSpecific = fileType.split('/')[1]
  // list of images that browsers can preview
  if (/^(jpeg|gif|png|svg|svg\+xml|bmp)$/.test(fileTypeSpecific)) {
    return true
  }
  return false
}
