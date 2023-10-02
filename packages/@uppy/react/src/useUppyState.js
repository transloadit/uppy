import { useSyncExternalStore, useCallback } from 'react'

export default function useUppyState (uppy, selector) {
  const subscribe = useCallback(
    () => uppy.store.subscribe(),
    // Eslint wants us to put `uppy.store` in the dependency array,
    // but it seems to make more sense to be more specific.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uppy.store.subscribe],
  )
  const getSnapshot = useCallback(
    () => selector(uppy.store.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uppy.store.getState, selector],
  )

  const state = useSyncExternalStore(subscribe, getSnapshot)
  return state
}
