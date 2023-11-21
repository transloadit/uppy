import type Uppy from '@uppy/core'

/**
 * @deprecated Initialize Uppy outside of the component.
 */
declare function useUppy(factory: () => Uppy): Uppy

export default useUppy
