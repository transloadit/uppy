import { useMemo } from 'react'
import type {
  DragEvent as ReactDragEvent,
  ChangeEvent as ReactChangeEvent,
} from 'react'
import {
  createDropzone,
  type DropzoneOptions,
  type DropzoneReturn,
} from '@uppy/components'
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
