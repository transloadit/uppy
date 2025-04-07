import { h } from 'preact'
import { useContext, useRef } from 'preact/hooks'
import { UppyContext } from './index.js'

type FileInputProps = {
  multiple?: boolean
  accept?: string
  children?: any
  className?: string
}

function FileInput(props: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ctx = useContext(UppyContext)
  const { multiple, accept, children, className } = props

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
        data-uppy-element="file-input-button"
        type="button"
        data-state={ctx.status}
        onClick={handleClick}
        className={`uppy:inline-flex uppy:items-center uppy:justify-center ${className}`}
      >
        {children || 'Select files'}
      </button>
    </div>
  )
}

export default FileInput
