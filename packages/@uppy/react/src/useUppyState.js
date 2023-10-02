import { useSyncExternalStore, useMemo, useCallback } from 'react'

export default function useUppyState(uppy, selector) {
  const subscribe = useMemo(
    () => uppy.store.subscribe.bind(uppy.store),
    [uppy.store],
  )
  const getSnapshot = useCallback(
    () => selector(uppy.store.getState()),
    // Eslint wants to put `uppy.store` as the dependency
    // but that seems unnecessary as we can be more specific.
    // `uppy.store` can theoretically never be `undefined`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uppy.store.getState, selector],
  )

  const state = useSyncExternalStore(subscribe, getSnapshot)
  return state
}
