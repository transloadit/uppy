import { Store } from '@uppy/core';

declare class DefaultStore implements Store {
  constructor();
  getState(): object;
  setState(patch: object): void;
  subscribe(listener: any): () => void;
}

declare function createDefaultStore(): DefaultStore;
export = createDefaultStore;