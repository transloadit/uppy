import type Uppy from '@uppy/core'

/**
 * @deprecated Initialize Uppy outside of the component or with `useState` and `useEffect` (see docs)
 */
declare function useUppy(factory: () => Uppy): Uppy

export default useUppy
