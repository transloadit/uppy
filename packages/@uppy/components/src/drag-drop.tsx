import { h } from 'preact'
import { useState, useRef, useEffect } from 'preact/hooks'
import { clsx } from 'clsx'
import type { UppyContext } from './uppy.context.js'

export type DragDropProps = {
  width?: string
  height?: string
  note?: string
  noClick?: boolean
  test?: () => any
  render?: (root: Element | null, node: any) => void
  ctx: UppyContext
}

function DragDrop(props: DragDropProps) {
  const dropAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const childRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(() => false)
  const { width, height, note, noClick, test, render, ctx } = props

  useEffect(() => {
    const element = dropAreaRef.current
    if (!element) return undefined

    const handleDrop = (event: DragEvent) => {
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
      if (noClick) return
      fileInputRef.current?.click()
    }

    element.addEventListener('drop', handleDrop)
    element.addEventListener('dragover', handleDragOver)
    element.addEventListener('dragenter', handleDragEnter)
    element.addEventListener('dragleave', handleDragLeave)
    element.addEventListener('click', handleClick)

    return () => {
      element.removeEventListener('drop', handleDrop)
      element.removeEventListener('dragover', handleDragOver)
      element.removeEventListener('dragenter', handleDragEnter)
      element.removeEventListener('dragleave', handleDragLeave)
      element.removeEventListener('click', handleClick)
    }
  }, [ctx.uppy, noClick])

  useEffect(() => {
    if (test) {
      render?.(childRef.current, test())
    }
  }, [test, render])

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
    <div className="uppy-reset">
      <input
        type="file"
        className="uppy:hidden"
        ref={fileInputRef}
        multiple
        onChange={(event) => handleFileInputChange(event)}
      />
      <div
        ref={dropAreaRef}
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
      >
        <div className="uppy:flex uppy:flex-col uppy:items-center uppy:justify-center uppy:h-full uppy:space-y-3">
          <div ref={childRef}>
            {!test && (
              <p className="uppy:text-gray-600">
                Drop files here or click to add them
              </p>
            )}
          </div>
          {note ?
            <div className="uppy:text-sm uppy:text-gray-500">{note}</div>
          : null}
        </div>
      </div>
    </div>
  )
}

export default DragDrop
