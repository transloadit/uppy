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

export const reducer: Reducer<object>;
export const middleware: Middleware;
// Redux action name.
export const STATE_UPDATE: string;

// Typescript forbids the next two lines with the following error message:
// "An export assignment cannot be used in a module with other exported elements."

// declare function createReduxStore(opts: ReduxStoreOptions): ReduxStore;
// export = createReduxStore;
