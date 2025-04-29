import { ref, inject, onMounted, type Ref } from 'vue'
import {
  createDropzone,
  type DropzoneOptions,
  type DropzoneAPI,
} from '@uppy/components'
import type { UppyContext } from '@uppy/components/lib/types.js'

export interface UseDropzoneResult {
  isDragging: Ref<boolean>
  rootProps: DropzoneAPI['rootProps']
  inputProps: DropzoneAPI['inputProps']
  fileInputRef: Ref<HTMLInputElement | null>
}

export function useDropzone(
  options: Omit<DropzoneOptions, 'onDragEnter' | 'onDragLeave'> = {},
): UseDropzoneResult {
  const ctx = inject('uppy') as UppyContext
  const isDragging = ref(false)
  const fileInputRef = ref<HTMLInputElement | null>(null)

  const dropzoneAPI = createDropzone(ctx, {
    ...options,
    onDragEnter: () => {
      isDragging.value = true
    },
    onDragLeave: () => {
      isDragging.value = false
    },
  })

  onMounted(() => {
    if (fileInputRef.value) {
      dropzoneAPI.setFileInputRef(fileInputRef.value)
    }
  })

  return {
    isDragging,
    rootProps: dropzoneAPI.rootProps,
    inputProps: dropzoneAPI.inputProps,
    fileInputRef,
  }
}
