import type { Store } from '@uppy/utils'
import type { Reducer, Middleware, Store as Redux } from 'redux'

interface ReduxStoreOptions {
  store: Redux<object>
  id?: string
  selector?: (state: any) => object
}

export class ReduxStore implements Store {
  constructor (opts: ReduxStoreOptions)
  getState (): object
  setState (patch: object): void
  subscribe (listener: any): () => void
}

export const reducer: Reducer<any>
export const middleware: Middleware
export const STATE_UPDATE: string

export default ReduxStore
