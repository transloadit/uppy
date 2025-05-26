import { getContext } from 'svelte'
import {
  createDropzone,
  type DropzoneOptions,
  type NonNullableUppyContext,
  type UppyContext,
} from '@uppy/components'

import { UppyContextKey } from './components/headless/UppyContextProvider.svelte'

export type SvelteDropzoneReturn = {
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

export function useDropzone(options?: DropzoneOptions): SvelteDropzoneReturn {
  const ctx = getContext<UppyContext>(UppyContextKey)

  if (!ctx?.uppy) {
    throw new Error('useDropzone must be called within a UppyContextProvider')
  }
  const dropzone = createDropzone(ctx as NonNullableUppyContext, options)

  return {
    // Only Svelte uses lowercase event names so we want to remap them
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
