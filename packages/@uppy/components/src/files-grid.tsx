/* eslint-disable react/destructuring-assignment */
import { h } from 'preact'
import { useState, useContext, useEffect } from 'preact/hooks'

import type { Body, Meta, UppyEventMap, UppyFile } from '@uppy/core'
import prettyBytes from 'pretty-bytes'
import { clsx } from 'clsx'
import { UppyContext, Thumbnail } from './index.js'

type FilesGridProps = {
  children: (file: UppyFile<any, any>) => any
  columns?: number
}

function FilesGrid(props: FilesGridProps) {
  const [files, setFiles] = useState<UppyFile<Meta, Body>[]>(() => [])

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
      <div className={clsx('uppy:grid uppy:gap-4', gridColsClass())}>
        {files?.map((file) => (
          <div
            className="uppy:flex uppy:flex-col uppy:items-center uppy:gap-2"
            key={file.id}
          >
            <>
              {props.children || (
                <>
                  <Thumbnail images file={file} />
                  <div className="uppy:w-full">
                    <p
                      className="uppy:font-medium uppy:truncate"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <div className="uppy:flex uppy:items-center uppy:gap-2">
                      <p className=" uppy:text-gray-500 uppy:tabular-nums ">
                        {prettyBytes(file.size || 0)}
                      </p>
                      <button
                        type="button"
                        className="uppy:flex uppy:rounded uppy:text-blue-500 uppy:hover:text-blue-700 uppy:bg-transparent uppy:transition-colors"
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
                    </div>
                  </div>
                </>
              )}
            </>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FilesGrid
