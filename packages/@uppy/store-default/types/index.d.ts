import type { Store } from '@uppy/utils'

type State = Record<string, unknown>
type StateChangeListener = (prevState: State, nextState: State, patch: State) => void

declare class DefaultStore implements Store {
  constructor ()

  getState (): State

  setState (patch: State): void

  subscribe (listener: StateChangeListener): () => void
}

declare function createDefaultStore (): DefaultStore

export default createDefaultStore
