import { createDropzone, type DropzoneOptions } from '@uppy/components'
import { injectUppyContext } from './headless/context-provider.js'

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
  const ctx = injectUppyContext()

  const dropzone = createDropzone(ctx, options)

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
