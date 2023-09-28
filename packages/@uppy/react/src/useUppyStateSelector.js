import { useSyncExternalStore } from 'react'

export default function useUppyStateSelector (uppy, selector) {
  const subscribe = uppy.store.subscribe.bind(uppy.store)
  const getState = uppy.store.getState.bind(uppy.store)
  const getSnapshot = () => selector(getState())
  const state = useSyncExternalStore(subscribe, getSnapshot)
  return state
}
