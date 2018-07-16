import { Store } from '@uppy/core';
import { Reducer, Middleware, Store as Redux } from 'redux';

export interface ReduxStoreOptions {
  store: Redux<object>;
  id?: string;
  selector?: (state: any) => object;
}

declare class ReduxStore implements Store {
  constructor(opts: ReduxStoreOptions);
  getState(): object;
  setState(patch: object): void;
  subscribe(listener: any): () => void;
}

export default function createReduxStore(opts: ReduxStoreOptions): ReduxStore;
export const reducer: Reducer<object>;
export const middleware: Middleware;
