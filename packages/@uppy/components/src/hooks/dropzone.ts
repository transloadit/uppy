import type { UppyContext } from '../types.js'

export type DropzoneOptions = {
  noClick?: boolean
  onDragEnter?: () => void
  onDragLeave?: () => void
  onDrop?: (files: File[]) => void
  onFileInputChange?: (files: File[]) => void
}

export type DropzoneAPI = {
  isDragging: boolean
  rootProps: {
    onDragEnter: (event: DragEvent) => void
    onDragOver: (event: DragEvent) => void
    onDragLeave: (event: DragEvent) => void
    onDrop: (event: DragEvent) => void
    onClick: () => void
  }
  inputProps: {
    type: 'file'
    multiple: boolean
    onChange: (event: Event) => void
    style?: { display: 'none' }
  }
  setFileInputRef: (element: HTMLInputElement | null) => void
}

export function createDropzone(
  ctx: UppyContext,
  options: DropzoneOptions = {},
): DropzoneAPI {
  let isDragging = false
  let fileInputRef: HTMLInputElement | null = null

  const setIsDragging = (value: boolean) => {
    isDragging = value
    if (value && options.onDragEnter) {
      options.onDragEnter()
    } else if (!value && options.onDragLeave) {
      options.onDragLeave()
    }
  }

  const handleDrop = (event: DragEvent) => {
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
        source: 'drag-drop',
        name: file.name,
        type: file.type,
        data: file,
      })),
    )
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleClick = () => {
    if (options.noClick) return
    fileInputRef?.click()
  }

  const handleFileInputChange = (event: Event) => {
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
    rootProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onClick: handleClick,
    },
    inputProps: {
      type: 'file',
      multiple: true,
      onChange: handleFileInputChange,
      style: { display: 'none' },
    },
    setFileInputRef: (element: HTMLInputElement | null) => {
      fileInputRef = element
    },
  }
}
