import {
  createDropzone,
  type DropzoneOptions,
  type NonNullableUppyContext,
} from '@uppy/components'
import { useUppyContext } from './headless/useUppyContext.js'

export type VueDropzoneReturn = {
  getRootProps: () => {
    ondragenter: (event: DragEvent) => void
    ondragover: (event: DragEvent) => void
    ondragleave: (event: DragEvent) => void
    ondrop: (event: DragEvent) => void
    onclick: () => void
  }
  getInputProps: () => {
    id: string
    type: 'file'
    multiple: boolean
    onchange: (event: Event) => void
  }
}

export function useDropzone(options?: DropzoneOptions): VueDropzoneReturn {
  const ctx = useUppyContext()

  if (!ctx?.uppy) {
    throw new Error('useDropzone must be called within a UppyContextProvider')
  }

  const dropzone = createDropzone(
    ctx as NonNullableUppyContext, // covered by the if statement above
    options,
  )

  return {
    // Vue.js uses lowercase event names when using v-bind so we need to remap them
    ...dropzone,
    getRootProps: () => {
      const { onDragEnter, onDragOver, onDragLeave, onDrop, onClick, ...rest } =
        dropzone.getRootProps()
      return {
        ...rest,
        ondragenter: onDragEnter,
        ondragover: onDragOver,
        ondragleave: onDragLeave,
        ondrop: onDrop,
        onclick: onClick,
      }
    },
    getInputProps: () => {
      const { onChange, ...rest } = dropzone.getInputProps()
      return {
        ...rest,
        onchange: onChange,
      }
    },
  }
}
