import { useEffect, useRef, useState, useContext, useCallback } from 'react'
import type {
  DragEvent as ReactDragEvent,
  ChangeEvent as ReactChangeEvent,
  MouseEvent as ReactMouseEvent,
} from 'react'
import { createDropzone, type DropzoneOptions } from '@uppy/components'
import { UppyContext } from './headless/UppyContextProvider.js'

export interface UseDropzoneResult {
  isDragging: boolean
  getRootProps: () => {
    onDragEnter: (event: ReactDragEvent<HTMLDivElement>) => void
    onDragOver: (event: ReactDragEvent<HTMLDivElement>) => void
    onDragLeave: (event: ReactDragEvent<HTMLDivElement>) => void
    onDrop: (event: ReactDragEvent<HTMLDivElement>) => void
    onClick: (event: ReactMouseEvent<HTMLDivElement>) => void
  }
  getInputProps: () => {
    type: 'file'
    multiple: boolean
    onChange: (event: ReactChangeEvent<HTMLInputElement>) => void
    style?: { display: 'none' }
    ref: React.RefObject<HTMLInputElement>
  }
}

export function useDropzone(
  options: Omit<DropzoneOptions, 'onDragEnter' | 'onDragLeave'> = {},
): UseDropzoneResult {
  const ctx = useContext(UppyContext)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!ctx.uppy) {
    throw new Error('useDropzone must be called within a UppyContextProvider')
  }

  const dropzone = createDropzone(ctx, {
    ...options,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  useEffect(() => {
    if (fileInputRef.current) {
      dropzone.setFileInputRef(fileInputRef.current)
    }
  }, [dropzone])

  const handleReactDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      dropzone.rootProps.onDrop(event.nativeEvent as DragEvent)
    },
    [dropzone.rootProps],
  )

  const handleReactChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dropzone.inputProps.onChange(event.nativeEvent as Event)
    },
    [dropzone.inputProps],
  )

  return {
    isDragging,
    getRootProps: () => ({
      onDrop: handleReactDrop,
      onDragEnter: (e: ReactDragEvent<HTMLDivElement>) =>
        dropzone.rootProps.onDragEnter(e.nativeEvent as DragEvent),
      onDragOver: (e: ReactDragEvent<HTMLDivElement>) =>
        dropzone.rootProps.onDragOver(e.nativeEvent as DragEvent),
      onDragLeave: (e: ReactDragEvent<HTMLDivElement>) =>
        dropzone.rootProps.onDragLeave(e.nativeEvent as DragEvent),
      onClick: () => dropzone.rootProps.onClick(),
    }),
    getInputProps: () => ({
      type: 'file',
      multiple: dropzone.inputProps.multiple,
      style: dropzone.inputProps.style,
      ref: fileInputRef,
      onChange: handleReactChange,
    }),
  }
}
