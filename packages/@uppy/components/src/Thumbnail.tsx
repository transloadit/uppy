import type { Body, Meta, UppyFile } from '@uppy/core'
import { h } from 'preact'
import { useEffect, useMemo } from 'preact/hooks'
import type { UppyContext } from './types.js'

export type ThumbnailProps = {
  file: UppyFile<Meta, Body>
  width?: string
  height?: string
  images?: boolean
  ctx?: UppyContext
}

export default function Thumbnail(props: ThumbnailProps) {
  const width = props.width || '100%'
  const height = props.height || '100%'
  const fileTypeGeneral = props.file.type?.split('/')[0] || ''
  const fileTypeSpecific = props.file.type?.split('/')[1] || ''
  const isImage = props.file.type.startsWith('image/')
  const isArchive =
    fileTypeGeneral === 'application' &&
    [
      'zip',
      'x-7z-compressed',
      'x-zip-compressed',
      'x-rar-compressed',
      'x-tar',
      'x-gzip',
      'x-apple-diskimage',
    ].includes(fileTypeSpecific)
  const isPDF = fileTypeGeneral === 'application' && fileTypeSpecific === 'pdf'

  const objectUrl = useMemo(() => {
    if (!props.images) {
      return ''
    }
    if (props.file.isRemote) {
      return props.file.preview
    }
    return URL.createObjectURL(props.file.data)
  }, [props.file.data, props.images, props.file.isRemote, props.file.preview])

  const showThumbnail = props.images && isImage && objectUrl

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  return (
    <div
      data-uppy-element="thumbnail"
      className="uppy:relative uppy:overflow-hidden uppy:bg-gray-100 uppy:rounded-lg uppy:flex uppy:items-center uppy:justify-center"
      style={{
        width,
        height,
        aspectRatio: '1',
      }}
    >
      {showThumbnail ? (
        <img
          className="uppy:w-full uppy:h-full uppy:object-cover"
          src={objectUrl}
          alt={props.file.name}
        />
      ) : null}
      {!showThumbnail ? (
        <div className="uppy:flex uppy:flex-col uppy:items-center uppy:justify-center uppy:w-full uppy:h-full">
          <div className="uppy:flex-1 uppy:flex uppy:items-center uppy:justify-center uppy:w-full">
            {!props.file.type ? (
              <svg
                aria-hidden="true"
                className="uppy:w-3/4 uppy:h-3/4"
                viewBox="0 0 25 25"
              >
                <g fill="#A7AFB7" fill-rule="nonzero">
                  <path d="M5.5 22a.5.5 0 0 1-.5-.5v-18a.5.5 0 0 1 .5-.5h10.719a.5.5 0 0 1 .367.16l3.281 3.556a.5.5 0 0 1 .133.339V21.5a.5.5 0 0 1-.5.5h-14zm.5-1h13V7.25L16 4H6v17z" />
                  <path d="M15 4v3a1 1 0 0 0 1 1h3V7h-3V4h-1z" />
                </g>
              </svg>
            ) : null}
            {fileTypeGeneral === 'text' ? (
              <svg
                aria-hidden="true"
                className="uppy:w-3/4 uppy:h-3/4"
                viewBox="0 0 25 25"
              >
                <path
                  d="M4.5 7h13a.5.5 0 1 1 0 1h-13a.5.5 0 0 1 0-1zm0 3h15a.5.5 0 1 1 0 1h-15a.5.5 0 1 1 0-1zm0 3h15a.5.5 0 1 1 0 1h-15a.5.5 0 1 1 0-1zm0 3h10a.5.5 0 1 1 0 1h-10a.5.5 0 1 1 0-1z"
                  fill="#5A5E69"
                  fill-rule="nonzero"
                />
              </svg>
            ) : null}
            {fileTypeGeneral === 'image' && !showThumbnail ? (
              <svg
                aria-hidden="true"
                className="uppy:w-3/4 uppy:h-3/4"
                viewBox="0 0 25 25"
              >
                <g fill="#686DE0" fill-rule="evenodd">
                  <path
                    d="M5 7v10h15V7H5zm0-1h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
                    fill-rule="nonzero"
                  />
                  <path
                    d="M6.35 17.172l4.994-5.026a.5.5 0 0 1 .707 0l2.16 2.16 3.505-3.505a.5.5 0 0 1 .707 0l2.336 2.31-.707.72-1.983-1.97-3.505 3.505a.5.5 0 0 1-.707 0l-2.16-2.159-3.938 3.939-1.409.026z"
                    fill-rule="nonzero"
                  />
                  <circle cx="7.5" cy="9.5" r="1.5" />
                </g>
              </svg>
            ) : null}
            {fileTypeGeneral === 'audio' ? (
              <svg
                aria-hidden="true"
                className="uppy:w-3/4 uppy:h-3/4"
                viewBox="0 0 25 25"
              >
                <path
                  d="M9.5 18.64c0 1.14-1.145 2-2.5 2s-2.5-.86-2.5-2c0-1.14 1.145-2 2.5-2 .557 0 1.079.145 1.5.396V7.25a.5.5 0 0 1 .379-.485l9-2.25A.5.5 0 0 1 18.5 5v11.64c0 1.14-1.145 2-2.5 2s-2.5-.86-2.5-2c0-1.14 1.145-2 2.5-2 .557 0 1.079.145 1.5.396V8.67l-8 2v7.97zm8-11v-2l-8 2v2l8-2zM7 19.64c.855 0 1.5-.484 1.5-1s-.645-1-1.5-1-1.5.484-1.5 1 .645 1 1.5 1zm9-2c.855 0 1.5-.484 1.5-1s-.645-1-1.5-1-1.5.484-1.5 1 .645 1 1.5 1z"
                  fill="#049BCF"
                  fill-rule="nonzero"
                />
              </svg>
            ) : null}
            {fileTypeGeneral === 'video' ? (
              <svg
                aria-hidden="true"
                className="uppy:w-3/4 uppy:h-3/4"
                viewBox="0 0 25 25"
              >
                <path
                  d="M16 11.834l4.486-2.691A1 1 0 0 1 22 10v6a1 1 0 0 1-1.514.857L16 14.167V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2.834zM15 9H5v8h10V9zm1 4l5 3v-6l-5 3z"
                  fill="#19AF67"
                  fill-rule="nonzero"
                />
              </svg>
            ) : null}
            {isPDF ? (
              <svg
                aria-hidden="true"
                className="uppy:w-3/4 uppy:h-3/4"
                viewBox="0 0 25 25"
              >
                <path
                  d="M9.766 8.295c-.691-1.843-.539-3.401.747-3.726 1.643-.414 2.505.938 2.39 3.299-.039.79-.194 1.662-.537 3.148.324.49.66.967 1.055 1.51.17.231.382.488.629.757 1.866-.128 3.653.114 4.918.655 1.487.635 2.192 1.685 1.614 2.84-.566 1.133-1.839 1.084-3.416.249-1.141-.604-2.457-1.634-3.51-2.707a13.467 13.467 0 0 0-2.238.426c-1.392 4.051-4.534 6.453-5.707 4.572-.986-1.58 1.38-4.206 4.914-5.375.097-.322.185-.656.264-1.001.08-.353.306-1.31.407-1.737-.678-1.059-1.2-2.031-1.53-2.91zm2.098 4.87c-.033.144-.068.287-.104.427l.033-.01-.012.038a14.065 14.065 0 0 1 1.02-.197l-.032-.033.052-.004a7.902 7.902 0 0 1-.208-.271c-.197-.27-.38-.526-.555-.775l-.006.028-.002-.003c-.076.323-.148.632-.186.8zm5.77 2.978c1.143.605 1.832.632 2.054.187.26-.519-.087-1.034-1.113-1.473-.911-.39-2.175-.608-3.55-.608.845.766 1.787 1.459 2.609 1.894zM6.559 18.789c.14.223.693.16 1.425-.413.827-.648 1.61-1.747 2.208-3.206-2.563 1.064-4.102 2.867-3.633 3.62zm5.345-10.97c.088-1.793-.351-2.48-1.146-2.28-.473.119-.564 1.05-.056 2.405.213.566.52 1.188.908 1.859.18-.858.268-1.453.294-1.984z"
                  fill="#E2514A"
                  fill-rule="nonzero"
                />
              </svg>
            ) : null}
            {isArchive ? (
              <svg
                aria-hidden="true"
                className="uppy:w-3/4 uppy:h-3/4"
                viewBox="0 0 25 25"
              >
                <path
                  d="M10.45 2.05h1.05a.5.5 0 0 1 .5.5v.024a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5V2.55a.5.5 0 0 1 .5-.5zm2.05 1.024h1.05a.5.5 0 0 1 .5.5V3.6a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5v-.001zM10.45 0h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5-.5zm2.05 1.025h1.05a.5.5 0 0 1 .5.5v.024a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.024a.5.5 0 0 1 .5-.5zm-2.05 3.074h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5zm2.05 1.025h1.05a.5.5 0 0 1 .5.5v.024a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.024a.5.5 0 0 1 .5-.5zm-2.05 1.024h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5zm2.05 1.025h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5zm-2.05 1.025h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5zm2.05 1.025h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5zm-2.05 1.025h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5zm2.05 1.025h1.05a.5.5 0 0 1 .5.5v.024a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.024a.5.5 0 0 1 .5-.5zm-1.656 3.074l-.82 5.946c.52.302 1.174.458 1.976.458.803 0 1.455-.156 1.975-.458l-.82-5.946h-2.311zm0-1.025h2.312c.512 0 .946.378 1.015.885l.82 5.946c.056.412-.142.817-.501 1.026-.686.398-1.515.597-2.49.597-.974 0-1.804-.199-2.49-.597a1.025 1.025 0 0 1-.5-1.026l.819-5.946c.07-.507.503-.885 1.015-.885zm.545 6.6a.5.5 0 0 1-.397-.561l.143-.999a.5.5 0 0 1 .495-.429h.74a.5.5 0 0 1 .495.43l.143.998a.5.5 0 0 1-.397.561c-.404.08-.819.08-1.222 0z"
                  fill="#00C469"
                  fill-rule="nonzero"
                />
              </svg>
            ) : null}
            {props.file.type && !fileTypeGeneral && !isPDF && !isArchive ? (
              <svg
                aria-hidden="true"
                className="uppy:w-3/4 uppy:h-3/4"
                viewBox="0 0 25 25"
              >
                <g fill="#A7AFB7" fill-rule="nonzero">
                  <path d="M5.5 22a.5.5 0 0 1-.5-.5v-18a.5.5 0 0 1 .5-.5h10.719a.5.5 0 0 1 .367.16l3.281 3.556a.5.5 0 0 1 .133.339V21.5a.5.5 0 0 1-.5.5h-14zm.5-1h13V7.25L16 4H6v17z" />
                  <path d="M15 4v3a1 1 0 0 0 1 1h3V7h-3V4h-1z" />
                </g>
              </svg>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
