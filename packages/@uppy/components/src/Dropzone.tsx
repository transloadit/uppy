/* eslint-disable jsx-a11y/click-events-have-key-events */
import { h } from 'preact'
import { useState, useRef } from 'preact/hooks'
import { clsx } from 'clsx'
import type { UppyContext } from './types.js'

export type DropzoneProps = {
  width?: string
  height?: string
  note?: string
  noClick?: boolean
  ctx: UppyContext
}

export default function Dropzone(props: DropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(() => false)
  const { width, height, note, noClick, ctx } = props

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    const files = Array.from(event.dataTransfer?.files || [])
    if (!files.length) return
    ctx.uppy?.addFiles(
      files.map((file) => ({
        source: 'drag-drop',
        name: file.name,
        type: file.type,
        data: file,
      })),
    )
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  function handleClick() {
    if (noClick) return
    fileInputRef.current?.click()
  }

  function handleFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    if (!files.length) return
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

  return (
    <div className="uppy-reset" data-uppy-element="dropzone">
      <input
        type="file"
        className="uppy:hidden"
        ref={fileInputRef}
        multiple
        onChange={handleFileInputChange}
      />
      <div
        role="button"
        tabIndex={0}
        style={{
          width: width || '100%',
          height: height || '100%',
        }}
        className={clsx(
          'uppy:border-2 uppy:border-dashed uppy:border-gray-300',
          'uppy:rounded-lg uppy:p-6 uppy:bg-gray-50',
          'uppy:transition-colors uppy:duration-200',
          {
            'uppy:bg-blue-50': isDragging,
          },
          {
            'uppy:cursor-pointer uppy:hover:bg-blue-50': !noClick,
          },
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <div className="uppy:flex uppy:flex-col uppy:items-center uppy:justify-center uppy:h-full uppy:space-y-3">
          <p className="uppy:text-gray-600">
            Drop files here or click to add them
          </p>
        </div>
        {note ?
          <div className="uppy:text-sm uppy:text-gray-500">{note}</div>
        : null}
      </div>
    </div>
  )
}
