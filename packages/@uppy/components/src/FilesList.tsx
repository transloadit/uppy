import type { Body, Meta, UppyEventMap, UppyFile } from '@uppy/core'
import { clsx } from 'clsx'
import { Fragment, h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import prettyBytes from 'pretty-bytes'
import { Thumbnail, type UppyContext } from './index.js'

export type FilesListProps = {
  editFile?: (file: UppyFile<Meta, Body>) => void
  ctx: UppyContext
}

export default function FilesList(props: FilesListProps) {
  const [files, setFiles] = useState<UppyFile<any, any>[]>(() => [])
  const { ctx, editFile } = props

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
    <ul data-uppy-element="files-list" className="uppy-reset uppy:my-4">
      {files?.map((file) => (
        <li key={file.id}>
          <Fragment>
            <div className="uppy:flex uppy:items-center uppy:gap-2">
              <div className="uppy:w-[32px] uppy:h-[32px]">
                <Thumbnail width="32px" height="32px" file={file} />
              </div>

              <p className="uppy:truncate">{file.name}</p>
              <p className="uppy:text-gray-500 uppy:tabular-nums uppy:min-w-18 uppy:text-right uppy:ml-auto">
                {prettyBytes(file.size || 0)}
              </p>

              <Fragment>
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
              </Fragment>
            </div>
            <progress
              max="100"
              className={clsx(
                'uppy:w-full uppy:h-[2px] uppy:appearance-none uppy:bg-gray-100 uppy:rounded-full uppy:overflow-hidden uppy:[&::-webkit-progress-bar]:bg-gray-100 uppy:block uppy:my-2',
                {
                  'uppy:[&::-webkit-progress-value]:bg-green-500 uppy:[&::-moz-progress-bar]:bg-green-500':
                    file.progress?.uploadComplete,
                  'uppy:[&::-webkit-progress-value]:bg-red-500 uppy:[&::-moz-progress-bar]:bg-red-500':
                    file.error,
                  'uppy:[&::-webkit-progress-value]:bg-blue-500 uppy:[&::-moz-progress-bar]:bg-blue-500':
                    !file.progress?.uploadComplete && !file.error,
                },
              )}
              value={file.progress?.percentage || 0}
            />
          </Fragment>
        </li>
      ))}
    </ul>
  )
}
