const IndexedDBStore = require('./IndexedDBStore')
const MetaDataStore = require('./MetaDataStore')

/**
 * Clean old blobs without needing to import all of Uppy.
 */
module.exports = function cleanup () {
  MetaDataStore.cleanup()
  IndexedDBStore.cleanup()
}
