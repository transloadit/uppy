import type { Store } from '@uppy/utils'

declare class DefaultStore implements Store {
  constructor ()
  getState (): object
  setState (patch: object): void
  subscribe (listener: any): () => void
}

declare function createDefaultStore (): DefaultStore

export default createDefaultStore
