import type { NonNullableUppyContext } from '../types.js'

export type DropzoneOptions = {
  noClick?: boolean
  onDragOver?: (event: Event) => void
  onDragEnter?: (event: Event) => void
  onDragLeave?: (event: Event) => void
  onDrop?: (files: File[]) => void
  onFileInputChange?: (files: File[]) => void
}

export type DropzoneReturn<DragEventType, ChangeEventType> = {
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
  ctx: NonNullableUppyContext,
  options: DropzoneOptions = {},
): DropzoneReturn<DragEventType, ChangeEventType> {
  const handleDrop = (event: DragEventType) => {
    event.preventDefault()
    event.stopPropagation()

    const files = Array.from(event.dataTransfer?.files ?? [])
    if (!files.length) return

    options.onDrop?.(files)

    ctx.uppy.addFiles(
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
    options.onDragOver?.(event)
  }

  const handleDragEnter = (event: DragEventType) => {
    event.preventDefault()
    event.stopPropagation()
    options.onDragEnter?.(event)
  }

  const handleDragLeave = (event: DragEventType) => {
    event.preventDefault()
    event.stopPropagation()
    options.onDragLeave?.(event)
  }

  const handleClick = () => {
    if (options.noClick) return
    const input = document.getElementById(fileInputId) as HTMLInputElement
    input?.click()
  }

  const handleFileInputChange = (event: ChangeEventType) => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    if (!files.length) return

    options.onFileInputChange?.(files)

    ctx.uppy.addFiles(
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
