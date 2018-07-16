const dataURItoBlob = require('./dataURItoBlob')

module.exports = function dataURItoFile (dataURI, opts) {
  return dataURItoBlob(dataURI, opts, true)
}
