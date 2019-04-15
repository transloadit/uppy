const toArray = require('@uppy/utils/lib/toArray')

// .files fallback, should be implemented in any browser
module.exports = function fallbackApi (dataTransfer, cb) {
  const files = toArray(dataTransfer.files)
  cb(files)
}
