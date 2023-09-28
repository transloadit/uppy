import type { Uppy, State } from '@uppy/core'

type ValueOf<T> = T[keyof T];

/**
 * Subscribe to a part of Uppy's state and only re-render when that part changes.
 */
declare function useUppyStateSelector(
  uppy: Uppy,
  selector: (state: State) => ValueOf<State>
): ValueOf<State>;

export default useUppyStateSelector
