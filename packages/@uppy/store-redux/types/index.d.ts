import type { Store } from '@uppy/utils'
import type { Reducer, Middleware, Store as Redux } from 'redux'

type State = Record<string, unknown>
type StateChangeListener = (
  prevState: State,
  nextState: State,
  patch: State,
) => void

interface ReduxStoreOptions {
  store: Redux<State>
  id?: string
  selector?: (state: any) => State
}

export class ReduxStore implements Store {
  constructor(opts: ReduxStoreOptions)

  getState(): State

  setState(patch: State): void

  subscribe(listener: StateChangeListener): () => void
}

export const reducer: Reducer<any>
export const middleware: Middleware
export const STATE_UPDATE: string

export default ReduxStore
