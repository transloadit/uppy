import {
  createImageEditorController,
  type ImageEditorSnapshot,
} from '@uppy/components'
import type { UppyFile } from '@uppy/core'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useUppyContext } from './headless/UppyContextProvider.js'

type ImageEditorProps = {
  file: UppyFile<any, any>
}

export function useImageEditor(props: ImageEditorProps): ImageEditorSnapshot {
  const { uppy } = useUppyContext()

  const controller = useMemo(
    () => createImageEditorController(uppy, { file: props.file }),
    [uppy, props.file],
  )

  useEffect(() => {
    controller.start()
    return () => controller.stop()
  }, [controller])

  const store = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )

  return store
}
