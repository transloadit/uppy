import { h } from 'preact'
import { useRef } from 'preact/hooks'
import type { UppyContext } from './types'

export type NewFileInputProps = {
  multiple?: boolean
  accept?: string
  className?: string
  ctx: UppyContext
}

export default function NewFileInput(props: NewFileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { multiple, accept, className, ctx } = props

  function handleClick() {
    fileInputRef.current?.click()
  }

  function handleFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    if (!files.length) return
    ctx.uppy?.addFiles(
      files.map((file) => ({
        source: 'file-input',
        name: file.name,
        type: file.type,
        data: file,
      })),
    )

    // Reset the input value so the same file can be selected again
    input.value = ''
  }

  return (
    <div className="uppy-reset">
      <input
        data-uppy-element="file-input"
        type="file"
        className="uppy:hidden"
        data-state={ctx.status}
        ref={fileInputRef}
        multiple={multiple}
        accept={accept}
        onChange={(event) => handleFileInputChange(event)}
      />
      <button
        type="button"
        data-uppy-element="file-input-button"
        data-state={ctx.status}
        onClick={handleClick}
        className={`uppy:inline-flex uppy:items-center uppy:justify-center ${className}`}
      >
        Select files
      </button>
    </div>
  )
}
