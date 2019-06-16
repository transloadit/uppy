const webkitGetAsEntryApi = require('./utils/webkitGetAsEntryApi')
const fallbackApi = require('./utils/fallbackApi')

/**
 * Returns a promise that resolves to the array of dropped files (if a folder is dropped, and browser supports folder parsing - promise resolves to the flat array of all files in all directories).
 * Each file has .relativePath prop appended to it (e.g. "/docs/Prague/ticket_from_prague_to_ufa.pdf") if browser supports it. Otherwise it's undefined.
 *
 * @param {DataTransfer} dataTransfer
 * @returns {Promise} - Array<File>
 */
module.exports = function getDroppedFiles (dataTransfer) {
  // Get all files from all subdirs. Works (at least) in Chrome, Mozilla, and Safari
  if (dataTransfer.items && dataTransfer.items[0] && 'webkitGetAsEntry' in dataTransfer.items[0]) {
    return webkitGetAsEntryApi(dataTransfer)
  // Otherwise just return all first-order files
  } else {
    return fallbackApi(dataTransfer)
  }
}
