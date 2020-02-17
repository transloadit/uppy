import UppyUtils = require('@uppy/utils')

declare class DefaultStore implements UppyUtils.Store {
  constructor ()
  getState (): object
  setState (patch: object): void
  subscribe (listener: any): () => void
}

declare function createDefaultStore (): DefaultStore
export = createDefaultStore
