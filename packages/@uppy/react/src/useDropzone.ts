import { useContext, useMemo } from 'react'
import type {
  DragEvent as ReactDragEvent,
  ChangeEvent as ReactChangeEvent,
} from 'react'
import {
  createDropzone,
  type DropzoneOptions,
  type DropzoneReturn,
} from '@uppy/components'
import { UppyContext } from './headless/UppyContextProvider.js'

type TDragEvent = DragEvent & ReactDragEvent<HTMLDivElement>
type TChangeEvent = Event & ReactChangeEvent<HTMLInputElement>

export function useDropzone(
  options?: DropzoneOptions,
): DropzoneReturn<TDragEvent, TChangeEvent> {
  const ctx = useContext(UppyContext)

  if (!ctx.uppy) {
    throw new Error('useDropzone must be called within a UppyContextProvider')
  }

  const dropzone = useMemo(
    () => createDropzone<TDragEvent, TChangeEvent>(ctx, options),
    [ctx, options],
  )

  return dropzone
}
