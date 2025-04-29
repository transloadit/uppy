/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/jsx-props-no-spreading */
import { h } from 'preact'
import { useRef, useEffect, useState } from 'preact/hooks'
import { clsx } from 'clsx'
import type { UppyContext } from './types.js'
import { createDropzone } from './hooks/dropzone.js'

export type DropzoneProps = {
  width?: string
  height?: string
  note?: string
  noClick?: boolean
  ctx: UppyContext
}

export default function Dropzone(props: DropzoneProps) {
  const { width, height, note, noClick, ctx } = props
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { rootProps, inputProps, setFileInputRef } = createDropzone(ctx, {
    noClick,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDrop: () => setIsDragging(false),
  })

  useEffect(() => {
    setFileInputRef(fileInputRef.current)
  }, [setFileInputRef])

  return (
    <div className="uppy-reset" data-uppy-element="dropzone">
      <input {...inputProps} className="uppy:hidden" ref={fileInputRef} />
      <div
        {...rootProps}
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
