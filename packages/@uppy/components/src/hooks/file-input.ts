import type { NonNullableUppyContext } from '../types.js'

export type FileInputProps = {
  multiple?: boolean
  accept?: string
}

export type FileInputFunctions<EventType> = {
  getInputProps: () => {
    id: string
    type: 'file'
    multiple: boolean
    accept?: string
    onChange: (event: EventType) => void
  }
  getButtonProps: () => {
    type: 'button'
    onClick: () => void
  }
}

const fileInputId = 'uppy-file-input' as const

// Use a more generic constraint that works with both DOM Events and React/Vue Events
export function createFileInput<EventType extends Event>(
  ctx: NonNullableUppyContext,
  props: FileInputProps = {},
): FileInputFunctions<EventType> {
  const handleClick = () => {
    const input = document.getElementById(fileInputId) as HTMLInputElement
    input?.click()
  }

  const handleFileInputChange = (event: EventType) => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    if (!files.length) return

    ctx.uppy.addFiles(
      files.map((file) => ({
        name: file.name,
        type: file.type,
        data: file,
      })),
    )

    // Reset the input value so the same file can be selected again
    input.value = ''
  }

  return {
    getInputProps: () => ({
      id: fileInputId,
      type: 'file',
      multiple: props.multiple ?? true,
      accept: props.accept,
      onChange: handleFileInputChange,
    }),
    getButtonProps: () => ({
      type: 'button',
      onClick: handleClick,
    }),
  }
}
