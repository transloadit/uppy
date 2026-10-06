import {
  createS3ManagerController,
  type S3ManagerSnapshot,
} from '@uppy/components'
import { useEffect, useMemo } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'
import { useUppyContext } from './headless/UppyContextProvider.js'

/** @experimental Headless manager-mode storage browser, e.g. `@uppy/s3`. */
export function useS3Manager(
  pluginId: string,
  options?: { initialFolderKey?: string | null },
): S3ManagerSnapshot {
  const { uppy } = useUppyContext()

  // ponytail: initialFolderKey only applies on first mount, like a default value.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  const controller = useMemo(
    () => createS3ManagerController(uppy, pluginId, options),
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
