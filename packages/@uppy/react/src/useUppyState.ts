import type { Uppy, State } from '@uppy/core'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import { useSyncExternalStore, useMemo, useCallback } from 'react'

type ValueOf<T> = T[keyof T]

export default function useUppyState<M extends Meta, B extends Body>(
  uppy: Uppy<M, B>,
  selector: (state: State<M, B>) => ValueOf<State<M, B>>,
): ValueOf<State<M, B>> {
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
