import IndexedDBStore from './IndexedDBStore.js'
import MetaDataStore from './MetaDataStore.js'

/**
 * Clean old blobs without needing to import all of Uppy.
 */
export default function cleanup(): void {
  MetaDataStore.cleanup()
  IndexedDBStore.cleanup()
}
