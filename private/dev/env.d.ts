import type Uppy from '@uppy/core'

declare global {
  interface Window {
    uppy: Uppy<any, any>
  }
}
