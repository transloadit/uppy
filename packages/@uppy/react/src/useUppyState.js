import { useSyncExternalStore, useMemo, useCallback } from 'react'

export default function useUppyState(uppy, selector) {
  const subscribe = useMemo(
    () => uppy.store.subscribe.bind(uppy.store),
    [uppy.store],
  )
  const getSnapshot = useCallback(
    () => selector(uppy.store.getState()),
    [uppy.store, selector],
  )

  return useSyncExternalStore(subscribe, getSnapshot)
}
