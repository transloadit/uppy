import { useMemo, useContext, useEffect } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import {
  createRemoteSourcesController,
  type RemoteSourcesSnapshot,
  type RemoteSourcesKeys,
} from '@uppy/components'
import { UppyContext } from './headless/UppyContextProvider.js'

export function useRemoteSources(
  sourceId: RemoteSourcesKeys,
): RemoteSourcesSnapshot {
  const { uppy } = useContext(UppyContext)

  if (!uppy) {
    throw new Error(
      'useRemoteSources must be called within a UppyContextProvider',
    )
  }

  const controller = useMemo(
    () => createRemoteSourcesController(uppy, sourceId),
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
