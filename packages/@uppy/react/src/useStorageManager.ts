import {
  createStorageManagerController,
  type StorageManagerSnapshot,
} from '@uppy/components'
import { useEffect, useMemo } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'
import { useUppyContext } from './headless/UppyContextProvider.js'

/** @experimental Headless manager-mode storage browser, e.g. `@uppy/s3`. */
export function useStorageManager(
  pluginId: string,
  options?: { initialFolderKey?: string | null },
): StorageManagerSnapshot {
  const { uppy } = useUppyContext()

  // ponytail: initialFolderKey only applies on first mount, like a default value.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  const controller = useMemo(
    () => createStorageManagerController(uppy, pluginId, options),
    [uppy, pluginId],
  )
  const store = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )

  useEffect(() => {
    controller.mount()
    return () => controller.unmount()
  }, [controller])

  return store
}
