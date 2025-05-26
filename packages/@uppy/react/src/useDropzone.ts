import { useContext, useMemo } from 'react'
import type {
  DragEvent as ReactDragEvent,
  ChangeEvent as ReactChangeEvent,
} from 'react'
import {
  createDropzone,
  type DropzoneOptions,
  type DropzoneReturn,
  type NonNullableUppyContext,
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
    () =>
      createDropzone<TDragEvent, TChangeEvent>(
        ctx as NonNullableUppyContext, // covered by the if statement above
        options,
      ),
    // We need every value on options to be memoized to avoid re-creating the dropzone on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ctx,
      options?.noClick,
      options?.onDragOver,
      options?.onDragEnter,
      options?.onDragLeave,
      options?.onDrop,
      options?.onFileInputChange,
    ],
  )

  return dropzone
}
