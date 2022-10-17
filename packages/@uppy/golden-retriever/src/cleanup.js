import IndexedDBStore from './IndexedDBStore.js'
import MetaDataStore from './MetaDataStore.js'

/**
 * Clean old blobs without needing to import all of Uppy.
 */
export default function cleanup () {
  MetaDataStore.cleanup()
  IndexedDBStore.cleanup()
}
