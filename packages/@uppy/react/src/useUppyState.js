import { useSyncExternalStore, useCallback } from 'react'

export default function useUppyState (uppy, selector) {
  // Eslint complains the dependencies are unknown and we should use an inline function
  // but we put uppy.store.subscribe in there ourselves.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const subscribe = useCallback(uppy.store.subscribe.bind(uppy.store), [
    uppy.store.subscribe,
  ])
  const getSnapshot = useCallback(
    () => selector(uppy.store.getState()),
    // Eslint wants to put `uppy.store` as the dependency
    // but that seems unnecessary as we can be more specific.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uppy.store.getState, selector],
  )

  const state = useSyncExternalStore(subscribe, getSnapshot)
  return state
}
