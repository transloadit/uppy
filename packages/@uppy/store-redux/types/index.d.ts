import Uppy = require('@uppy/core');
import { Reducer, Middleware, Store as Redux } from 'redux';

declare namespace ReduxStore {
  interface ReduxStoreOptions {
    store: Redux<object>;
    id?: string;
    selector?: (state: any) => object;
  }

  interface ReduxStore extends Uppy.Store {
    constructor(opts: ReduxStoreOptions): ReduxStore;
    getState(): object;
    setState(patch: object): void;
    subscribe(listener: any): () => void;
  }

  const reducer: Reducer<object>;
  const middleware: Middleware;
  const STATE_UPDATE: string;
}
declare function ReduxStore(opts: ReduxStore.ReduxStoreOptions): ReduxStore.ReduxStore;

export = ReduxStore;
