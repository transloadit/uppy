const webkitGetAsEntryApi = require('./utils/webkitGetAsEntryApi')
const getFilesAndDirectoriesApi = require('./utils/getFilesAndDirectoriesApi')
const fallbackApi = require('./utils/fallbackApi')

module.exports = function getDroppedFiles (dataTransfer, callback) {
  if (dataTransfer.items[0] && 'webkitGetAsEntry' in dataTransfer.items[0]) {
    webkitGetAsEntryApi(dataTransfer, callback)
  } else if ('getFilesAndDirectories' in dataTransfer) {
    // Doesn't actually work in firefox, maybe in previous versions. webkitGetAsEntryApi() works.
    getFilesAndDirectoriesApi(dataTransfer, callback)
  } else {
    fallbackApi(dataTransfer, callback)
  }
}
