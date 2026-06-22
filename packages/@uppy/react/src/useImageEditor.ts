import {
  createImageEditorController,
  type ImageEditorSnapshot,
} from '@uppy/components'
import type { UppyFile } from '@uppy/core'
import {
  type ChangeEvent,
  type SyntheticEvent,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { useUppyContext } from './headless/UppyContextProvider.js'

type ImageEditorProps = {
  file: UppyFile<any, any>
}

type ImageLoadEvent = Event & SyntheticEvent<HTMLImageElement>
type SliderChangeEvent = Event & ChangeEvent<HTMLInputElement>

export function useImageEditor(
  props: ImageEditorProps,
): ImageEditorSnapshot<ImageLoadEvent, SliderChangeEvent> {
  const { uppy } = useUppyContext()

  const controller = useMemo(
    () =>
      createImageEditorController<ImageLoadEvent, SliderChangeEvent>(uppy, {
        file: props.file,
      }),
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
