import { h } from 'preact'
import { useState, useContext, useRef, useEffect } from 'preact/hooks'
import { clsx } from 'clsx'
import { UppyContext } from './index.js'

type DragDropProps = {
  width?: string
  height?: string
  note?: string
  noClick?: boolean
  children?: any
}

function DragDrop(props: DragDropProps) {
  const dropAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(() => false)
  const ctx = useContext(UppyContext)
  const { width, height, note, noClick, children } = props

  useEffect(() => {
    const element = dropAreaRef.current
    if (!element) return

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

    // eslint-disable-next-line consistent-return
    return () => {
      element.removeEventListener('drop', handleDrop)
      element.removeEventListener('dragover', handleDragOver)
      element.removeEventListener('dragenter', handleDragEnter)
      element.removeEventListener('dragleave', handleDragLeave)
      element.removeEventListener('click', handleClick)
    }
  }, [ctx.uppy, noClick])

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
          <>
            {children || (
              <p className="uppy:text-gray-600">
                Drop files here or click to add them
              </p>
            )}
          </>
          {note ?
            <div className="uppy:text-sm uppy:text-gray-500">{note}</div>
          : null}
        </div>
      </div>
    </div>
  )
}

export default DragDrop
