import {
  createDropzone,
  type DropzoneOptions,
  type DropzoneReturn,
} from '@uppy/components'
import type {
  ChangeEvent as ReactChangeEvent,
  DragEvent as ReactDragEvent,
} from 'react'
import { useMemo } from 'react'
import { useUppyContext } from './headless/UppyContextProvider.js'

type TDragEvent = DragEvent & ReactDragEvent<HTMLDivElement>
type TChangeEvent = Event & ReactChangeEvent<HTMLInputElement>

export function useDropzone(
  options?: DropzoneOptions,
): DropzoneReturn<TDragEvent, TChangeEvent> {
  const ctx = useUppyContext()

  const dropzone = useMemo(
    () => createDropzone<TDragEvent, TChangeEvent>(ctx, options),
    // We need every value on options to be memoized to avoid re-creating the dropzone on every render
    [
      ctx,
      options?.noClick,
      options?.onDragOver,
      options?.onDragEnter,
      options?.onDragLeave,
      options?.onDrop,
      options?.onFileInputChange,
      options,
    ],
  )

  return dropzone
}
