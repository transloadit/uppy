import {
  createRemoteSourceController,
  type RemoteSourceKeys,
  type RemoteSourceOptions,
  type RemoteSourceSnapshot,
} from '@uppy/components'
import { useEffect, useMemo, useRef } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'
import { useUppyContext } from './headless/UppyContextProvider.js'

export function useRemoteSource(
  sourceId: RemoteSourceKeys,
  options?: RemoteSourceOptions,
): RemoteSourceSnapshot {
  const { uppy } = useUppyContext()
  // A new controller would open the root folder again, so an inline `onClose`
  // must not recreate it.
  const onCloseRef = useRef(options?.onClose)
  onCloseRef.current = options?.onClose

  const controller = useMemo(
    () =>
      createRemoteSourceController(uppy, sourceId, {
        onClose: () => onCloseRef.current?.(),
      }),
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
