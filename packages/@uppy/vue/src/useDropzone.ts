import {
  createDropzone,
  type DropzoneOptions,
  type DropzoneReturn,
} from '@uppy/components'
import { useUppyContext } from './headless/useUppyContext.js'

export function useDropzone(
  options?: DropzoneOptions,
): DropzoneReturn<DragEvent, Event> {
  const ctx = useUppyContext()

  if (!ctx) {
    throw new Error('useDropzone must be called within a UppyContextProvider')
  }

  return createDropzone(ctx, options)
}
