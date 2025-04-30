import { ref, onMounted, type Ref } from 'vue'
import {
  createDropzone,
  type DropzoneOptions,
  type DropzoneAPI,
} from '@uppy/components'
import { useUppyContext } from './headless/useUppyContext.js'

type InputPropsResult = DropzoneAPI['inputProps'] & {
  ref: Ref<HTMLInputElement | null>
}

export interface UseDropzoneResult {
  isDragging: Ref<boolean>
  getRootProps: () => DropzoneAPI['rootProps']
  getInputProps: () => InputPropsResult
}

export function useDropzone(
  options: Omit<DropzoneOptions, 'onDragEnter' | 'onDragLeave'> = {},
): UseDropzoneResult {
  const ctx = useUppyContext()
  const isDragging = ref(false)
  const fileInputRef = ref<HTMLInputElement | null>(null)

  if (!ctx) {
    throw new Error('useDropzone must be called within a UppyContextProvider')
  }

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
    getRootProps: () => dropzoneAPI.rootProps,
    getInputProps: () => ({
      ...dropzoneAPI.inputProps,
      ref: fileInputRef,
    }),
  }
}
