import {
  createImageEditorController,
  type ImageEditorSnapshot,
} from '@uppy/components'
import type { UppyFile } from '@uppy/core'
import type { ShallowRef } from 'vue'
import { injectUppyContext } from './headless/context-provider.js'
import { useExternalStore } from './useSyncExternalStore.js'

type ImageEditorProps = {
  file: UppyFile<any, any>
}

export function useImageEditor(
  props: ImageEditorProps,
): ShallowRef<ImageEditorSnapshot> {
  const ctx = injectUppyContext()

  const controller = createImageEditorController(ctx.uppy, { file: props.file })
  const store = useExternalStore<ImageEditorSnapshot>(
    controller.getSnapshot,
    controller.subscribe,
  )

  return store
}
