import { getContext } from 'svelte'
import {
  createDropzone,
  type DropzoneOptions,
  type DropzoneReturn,
  type UppyContext,
} from '@uppy/components'

import { UppyContextKey } from './components/headless/UppyContextProvider.svelte'

export function useDropzone(
  options?: DropzoneOptions,
): DropzoneReturn<DragEvent, Event> {
  const ctx = getContext<UppyContext>(UppyContextKey)
  if (!ctx?.uppy) {
    throw new Error('useDropzone must be called within a UppyContextProvider')
  }
  const dropzone = createDropzone(ctx, options)

  return {
    // Only Svelte uses lowercase event names so we want to remap them
    ...dropzone,
    getRootProps: () => {
      const props = dropzone.getRootProps()
      return {
        ...props,
        ondragenter: props.onDragEnter,
        ondragover: props.onDragOver,
        ondragleave: props.onDragLeave,
        ondrop: props.onDrop,
        onclick: props.onClick,
      }
    },
    getInputProps: () => {
      const props = dropzone.getInputProps()
      return {
        ...props,
        onchange: props.onChange,
      }
    },
  }
}
