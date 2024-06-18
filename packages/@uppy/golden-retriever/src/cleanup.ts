import IndexedDBStore from './IndexedDBStore'
import MetaDataStore from './MetaDataStore'

/**
 * Clean old blobs without needing to import all of Uppy.
 */
export default function cleanup(): void {
  MetaDataStore.cleanup()
  IndexedDBStore.cleanup()
}
