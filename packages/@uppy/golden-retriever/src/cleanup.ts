import IndexedDBStore from './IndexedDBStore.ts'
import MetaDataStore from './MetaDataStore.ts'

/**
 * Clean old blobs without needing to import all of Uppy.
 */
export default function cleanup(): void {
  MetaDataStore.cleanup()
  IndexedDBStore.cleanup()
}
