import type { UppyContext } from '../types.js'

export type DropzoneOptions = {
  noClick?: boolean
  onDragEnter?: () => void
  onDragLeave?: () => void
  onDrop?: (files: File[]) => void
  onFileInputChange?: (files: File[]) => void
}

export type DropzoneReturn<DragEventType, ChangeEventType> = {
  isDragging: boolean
  getRootProps: () => {
    onDragEnter: (event: DragEventType) => void
    onDragOver: (event: DragEventType) => void
    onDragLeave: (event: DragEventType) => void
    onDrop: (event: DragEventType) => void
    onClick: () => void
  }
  getInputProps: () => {
    id: string
    type: 'file'
    multiple: boolean
    onChange: (event: ChangeEventType) => void
  }
}

const fileInputId = 'uppy-dropzone-file-input' as const

export function createDropzone<
  DragEventType extends DragEvent,
  ChangeEventType extends Event,
>(
  ctx: UppyContext,
  options: DropzoneOptions = {},
): DropzoneReturn<DragEventType, ChangeEventType> {
  let isDragging = false

  const setIsDragging = (value: boolean) => {
    isDragging = value
    if (value && options.onDragEnter) {
      options.onDragEnter()
    } else if (!value && options.onDragLeave) {
      options.onDragLeave()
    }
  }

  const handleDrop = (event: DragEventType) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const files = Array.from(event.dataTransfer?.files || [])
    if (!files.length) return

    if (options.onDrop) {
      options.onDrop(files)
    }

    ctx.uppy?.addFiles(
      files.map((file) => ({
        name: file.name,
        type: file.type,
        data: file,
      })),
    )
  }

  const handleDragOver = (event: DragEventType) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter = (event: DragEventType) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEventType) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleClick = () => {
    if (options.noClick) return
    const input = document.getElementById(fileInputId) as HTMLInputElement
    input?.click()
  }

  const handleFileInputChange = (event: ChangeEventType) => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    if (!files.length) return

    if (options.onFileInputChange) {
      options.onFileInputChange(files)
    }

    ctx.uppy?.addFiles(
      files.map((file) => ({
        source: 'drag-drop',
        name: file.name,
        type: file.type,
        data: file,
      })),
    )

    // Reset the input value so the same file can be selected again
    input.value = ''
  }

  return {
    isDragging,
    getRootProps: () => ({
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onClick: handleClick,
    }),
    getInputProps: () => ({
      id: fileInputId,
      type: 'file',
      multiple: true,
      onChange: handleFileInputChange,
    }),
  }
}
