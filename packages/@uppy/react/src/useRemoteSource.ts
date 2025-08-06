import {
  createRemoteSourceController,
  type RemoteSourceKeys,
  type RemoteSourceSnapshot,
} from '@uppy/components'
import { useEffect, useMemo } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import { useUppyContext } from './headless/UppyContextProvider.js'

export function useRemoteSource(
  sourceId: RemoteSourceKeys,
): RemoteSourceSnapshot {
  const { uppy } = useUppyContext()

  const controller = useMemo(
    () => createRemoteSourceController(uppy, sourceId),
    [uppy, sourceId],
  )
  const store = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )

  useEffect(() => {
    controller.mount()

    return () => {
      controller.unmount()
    }
  }, [controller])

  return store
}
