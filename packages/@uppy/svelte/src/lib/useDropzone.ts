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
  return createDropzone(ctx, options)
}
