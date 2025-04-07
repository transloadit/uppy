/* eslint-disable react/destructuring-assignment */
import { h, type ComponentChild } from 'preact'
import { useState, useContext, useEffect } from 'preact/hooks'

import type { Meta, Body, UppyEventMap, UppyFile } from '@uppy/core'
import prettyBytes from 'pretty-bytes'
import { clsx } from 'clsx'
import { UppyContext, Thumbnail } from './index.js'

type FilesListProps = {
  editFile: (file: UppyFile<Meta, Body>) => void
  actions?: ComponentChild
  children: ComponentChild
}

function FilesList(props: FilesListProps) {
  const [files, setFiles] = useState<UppyFile<any, any>[]>(() => [])

  const ctx = useContext(UppyContext)

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
    <div className="uppy-reset uppy:my-4">
      <ul className="">
        {files?.map((file) => (
          <li key={file.id}>
            <>
              {props.children || (
                <>
                  <div className="uppy:flex uppy:items-center uppy:gap-2">
                    <div className="uppy:w-[32px] uppy:h-[32px]">
                      <Thumbnail width="32px" height="32px" file={file} />
                    </div>
                    <p className="uppy:truncate">{file.name}</p>
                    <p className="uppy:text-gray-500 uppy:tabular-nums uppy:min-w-18 uppy:text-right uppy:ml-auto">
                      {prettyBytes(file.size || 0)}
                    </p>
                    <>
                      {props.actions || (
                        <>
                          <button
                            type="button"
                            className="uppy:flex uppy:rounded uppy:text-blue-500 uppy:hover:text-blue-700 uppy:bg-transparent uppy:transition-colors"
                            onClick={() => {
                              props.editFile(file)
                            }}
                          >
                            edit
                          </button>
                          <button
                            type="button"
                            className="uppy:flex uppy:rounded uppy:text-blue-500 uppy:hover:text-blue-700 uppy:bg-transparent uppy:transition-colors"
                            onClick={() => {
                              ctx.uppy?.removeFile(file.id)
                            }}
                          >
                            remove
                          </button>
                        </>
                      )}
                    </>
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
                </>
              )}
            </>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FilesList
