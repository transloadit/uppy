import { clsx } from 'clsx'
import { h } from 'preact'
import { useMemo } from 'preact/hooks'
import { createDropzone } from './hooks/dropzone.js'
import type { NonNullableUppyContext, UppyContext } from './types.js'

export type DropzoneProps = {
  width?: string
  height?: string
  note?: string
  noClick?: boolean
  ctx: UppyContext
}

export default function Dropzone(props: DropzoneProps) {
  const { width, height, note, noClick, ctx } = props

  if (!ctx.uppy) {
    throw new Error('Dropzone must be used within a UppyContextProvider')
  }

  const { getRootProps, getInputProps } = useMemo(
    () => createDropzone(ctx as NonNullableUppyContext, { noClick }),
    [ctx, noClick],
  )

  return (
    <div
      className="uppy-reset"
      data-uppy-element="dropzone"
      role="presentation"
      tabIndex={0}
    >
      <input
        {...getInputProps()}
        tabIndex={-1}
        name="uppy-dropzone-file-input"
        className="uppy:hidden"
      />
      <div
        {...getRootProps()}
        style={{
          width: width || '100%',
          height: height || '100%',
        }}
        className={clsx(
          'uppy:border-2 uppy:border-dashed uppy:border-gray-300',
          'uppy:rounded-lg uppy:p-6 uppy:bg-gray-50',
          'uppy:transition-colors uppy:duration-200',
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
        {note ? (
          <div className="uppy:text-sm uppy:text-gray-500">{note}</div>
        ) : null}
      </div>
    </div>
  )
}
