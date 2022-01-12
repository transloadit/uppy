// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands'

import type { Uppy, UppyFile } from '@uppy/core'

declare global {
  interface Window {
    uppy: Uppy
  }

  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace Cypress {
    interface Chainable {
      createFakeFile(name?: string, type?: string, b64?: string): UppyFile
    }
  }
}
