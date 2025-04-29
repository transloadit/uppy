import { useEffect, useRef, useState, useContext, useCallback } from 'react'
import type {
  DragEvent as ReactDragEvent,
  ChangeEvent as ReactChangeEvent,
  MouseEvent as ReactMouseEvent,
} from 'react'
import { createDropzone, type DropzoneOptions } from '@uppy/components'
import type { UppyContext as UppyContextType } from '@uppy/components/lib/types.js'
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
  const ctx = useContext(UppyContext) as UppyContextType
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dropzoneAPI = createDropzone(ctx, {
    ...options,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  useEffect(() => {
    if (fileInputRef.current) {
      dropzoneAPI.setFileInputRef(fileInputRef.current)
    }
  }, [dropzoneAPI])

  const handleReactDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      dropzoneAPI.rootProps.onDrop(event.nativeEvent as DragEvent)
    },
    [dropzoneAPI.rootProps],
  )

  const handleReactChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dropzoneAPI.inputProps.onChange(event.nativeEvent as Event)
    },
    [dropzoneAPI.inputProps],
  )

  return {
    isDragging,
    getRootProps: () => ({
      onDrop: handleReactDrop,
      onDragEnter: (e: ReactDragEvent<HTMLDivElement>) =>
        dropzoneAPI.rootProps.onDragEnter(e.nativeEvent as DragEvent),
      onDragOver: (e: ReactDragEvent<HTMLDivElement>) =>
        dropzoneAPI.rootProps.onDragOver(e.nativeEvent as DragEvent),
      onDragLeave: (e: ReactDragEvent<HTMLDivElement>) =>
        dropzoneAPI.rootProps.onDragLeave(e.nativeEvent as DragEvent),
      onClick: () => dropzoneAPI.rootProps.onClick(),
    }),
    getInputProps: () => ({
      type: 'file',
      multiple: dropzoneAPI.inputProps.multiple,
      style: dropzoneAPI.inputProps.style,
      ref: fileInputRef,
      onChange: handleReactChange,
    }),
  }
}
