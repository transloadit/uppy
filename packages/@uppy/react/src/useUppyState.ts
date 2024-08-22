import type { Uppy, State } from '@uppy/core'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import { useMemo, useCallback } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector.js'

export default function useUppyState<
  M extends Meta = Meta,
  B extends Body = Body,
  T = any,
>(uppy: Uppy<M, B>, selector: (state: State<M, B>) => T): T {
  const subscribe = useMemo(
    () => uppy.store.subscribe.bind(uppy.store),
    [uppy.store],
  )
  const getSnapshot = useCallback(() => uppy.store.getState(), [uppy.store])

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    null,
    selector,
  )
}
