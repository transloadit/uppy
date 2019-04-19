const toArray = require('../../toArray')

// .files fallback, should be implemented in any browser
module.exports = function fallbackApi (dataTransfer) {
  const files = toArray(dataTransfer.files)
  return Promise.resolve(files)
}
