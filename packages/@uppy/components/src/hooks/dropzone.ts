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
    accept?: string
    onChange: (event: ChangeEventType) => void
  }
}

export function createDropzone<
  DragEventType extends DragEvent,
  ChangeEventType extends Event,
>(
  ctx: NonNullableUppyContext,
  options: DropzoneOptions = {},
): DropzoneReturn<DragEventType, ChangeEventType> {
  const fileInputId = `uppy-dropzone-file-input-${ctx.uppy.getID()}`

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

  const handleKeyPress = (event: KeyboardEvent) => {
    // taken from https://github.com/react-dropzone/react-dropzone/blob/d6911c991e077151e302b599b92269432ab0472b/src/index.js#L830C1-L836C1
    if (
      event.key === ' ' ||
      event.key === 'Enter' ||
      event.keyCode === 32 ||
      event.keyCode === 13
    ) {
      handleClick()
    }
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
      onKeyPress: handleKeyPress,
    }),
    getInputProps: () => {
      const { restrictions } = ctx.uppy.opts
      const accept = restrictions.allowedFileTypes?.join(', ')

      return {
        id: fileInputId,
        type: 'file' as const,
        multiple: restrictions.maxNumberOfFiles !== 1,
        accept,
        onChange: handleFileInputChange,
      }
    },
  }
}
