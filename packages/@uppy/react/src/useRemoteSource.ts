import { useMemo, useContext, useEffect } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import {
  createRemoteSourceController,
  type RemoteSourceSnapshot,
  type RemoteSourceKeys,
} from '@uppy/components'
import { UppyContext } from './headless/UppyContextProvider.js'

export function useRemoteSource(
  sourceId: RemoteSourceKeys,
): RemoteSourceSnapshot {
  const { uppy } = useContext(UppyContext)

  if (!uppy) {
    throw new Error(
      'useRemoteSources must be called within a UppyContextProvider',
    )
  }

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
