import { Store } from '@uppy/core';

declare module '@uppy/store-default' {
  class DefaultStore implements Store {
    constructor();
    getState(): object;
    setState(patch: object): void;
    subscribe(listener: any): () => void;
  }

  export default function createDefaultStore(): DefaultStore;
}
