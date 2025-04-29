import { getContext } from 'svelte'
import {
  createDropzone,
  type DropzoneOptions,
  type DropzoneAPI,
} from '@uppy/components'
import type { UppyContext } from '@uppy/components/lib/types.js'

export interface UseDropzoneResult {
  isDragging: boolean
  rootProps: DropzoneAPI['rootProps']
  inputProps: DropzoneAPI['inputProps']
  setFileInputRef: (node: HTMLInputElement) => void
}

export function useDropzone(
  options: Omit<DropzoneOptions, 'onDragEnter' | 'onDragLeave'> = {},
): UseDropzoneResult {
  const ctx = getContext('uppy') as UppyContext
  let isDragging = $state(false)
  let fileInputElement: HTMLInputElement | null = null

  const dropzoneAPI = createDropzone(ctx, {
    ...options,
    onDragEnter: () => {
      isDragging = true
    },
    onDragLeave: () => {
      isDragging = false
    },
  })

  function setFileInputRef(node: HTMLInputElement) {
    fileInputElement = node
    if (fileInputElement) {
      dropzoneAPI.setFileInputRef(fileInputElement)
    }
  }

  return {
    isDragging,
    rootProps: dropzoneAPI.rootProps,
    inputProps: dropzoneAPI.inputProps,
    setFileInputRef,
  }
}
