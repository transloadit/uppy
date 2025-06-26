import type { Body, Meta, UppyEventMap, UppyFile } from '@uppy/core'
import { clsx } from 'clsx'
import { Fragment, h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import prettyBytes from 'pretty-bytes'
import { Thumbnail } from './index.js'
import type { UppyContext } from './types.js'

export type FilesGridProps = {
  editFile?: (file: UppyFile<Meta, Body>) => void
  columns?: number
  ctx: UppyContext
}

export default function FilesGrid(props: FilesGridProps) {
  const [files, setFiles] = useState<UppyFile<Meta, Body>[]>(() => [])
  const { ctx, editFile } = props

  function gridColsClass() {
    return (
      {
        1: 'uppy:grid-cols-1',
        2: 'uppy:grid-cols-2',
        3: 'uppy:grid-cols-3',
        4: 'uppy:grid-cols-4',
        5: 'uppy:grid-cols-5',
        6: 'uppy:grid-cols-6',
      }[props.columns || 2] || 'uppy:grid-cols-2'
    )
  }

  useEffect(() => {
    const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
      prev,
      next,
      patch,
    ) => {
      if (patch?.files) {
        setFiles(Object.values(patch.files))
      }
    }
    ctx.uppy?.on('state-update', onStateUpdate)
    return () => {
      ctx.uppy?.off('state-update', onStateUpdate)
    }
  }, [ctx.uppy])

  return (
    <div
      data-uppy-element="files-grid"
      className={clsx(
        'uppy:reset uppy:my-4 uppy:grid uppy:gap-4',
        gridColsClass(),
      )}
    >
      {files?.map((file) => (
        <div
          className="uppy:flex uppy:flex-col uppy:items-center uppy:gap-2"
          key={file.id}
        >
          <Fragment>
            <Thumbnail images file={file} />
            <div className="uppy:w-full uppy-reset">
              <p className="uppy:font-medium uppy:truncate" title={file.name}>
                {file.name}
              </p>
              <div className="uppy:flex uppy:items-center uppy:gap-2">
                <p className=" uppy:text-gray-500 uppy:tabular-nums ">
                  {prettyBytes(file.size || 0)}
                </p>

                {editFile && (
                  <button
                    type="button"
                    className="uppy:flex uppy:rounded uppy:text-blue-500 uppy:hover:text-blue-700 uppy:bg-transparent uppy:transition-colors"
                    onClick={() => {
                      editFile(file)
                    }}
                  >
                    edit
                  </button>
                )}

                <button
                  type="button"
                  className="uppy:flex uppy:rounded uppy:text-blue-500 uppy:hover:text-blue-700 uppy:bg-transparent uppy:transition-colors"
                  onClick={() => {
                    ctx.uppy?.removeFile(file.id)
                  }}
                >
                  remove
                </button>
              </div>
            </div>
          </Fragment>
        </div>
      ))}
    </div>
  )
}
