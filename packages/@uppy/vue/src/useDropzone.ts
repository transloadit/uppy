import {
  createDropzone,
  type DropzoneOptions,
  type DropzoneReturn,
  type NonNullableUppyContext,
} from '@uppy/components'
import { useUppyContext } from './headless/useUppyContext.js'

export function useDropzone(
  options?: DropzoneOptions,
): DropzoneReturn<DragEvent, Event> {
  const ctx = useUppyContext()

  if (!ctx?.uppy) {
    throw new Error('useDropzone must be called within a UppyContextProvider')
  }

  return createDropzone(
    ctx as NonNullableUppyContext, // covered by the if statement above
    options,
  )
}
