import prettierBytes from '@transloadit/prettier-bytes'
import type { UppyFile } from '@uppy/core'
import type { I18n } from '@uppy/utils/lib/Translator'
import truncateString from '@uppy/utils/lib/truncateString'
import { h } from 'preact'
import type { DashboardState } from '../../../Dashboard.js'
import MetaErrorMessage from '../MetaErrorMessage.js'

const renderFileName = (props: {
  file: UppyFile<any, any>
  isSingleFile: boolean
  containerHeight: number
  containerWidth: number
}) => {
  const { author, name } = props.file.meta

  function getMaxNameLength() {
    if (props.isSingleFile && props.containerHeight >= 350) {
      return 90
    }
    if (props.containerWidth <= 352) {
      return 35
    }
    if (props.containerWidth <= 576) {
      return 60
    }
    // When `author` is present, we want to make sure
    // the file name fits on one line so we can place
    // the author on the second line.
    return author ? 20 : 30
  }

  return (
    <div className="uppy-Dashboard-Item-name" title={name}>
      {truncateString(name, getMaxNameLength())}
    </div>
  )
}

const renderAuthor = (props: { file: UppyFile<any, any> }) => {
  const { author } = props.file.meta
  const providerName = props.file.remote?.providerName
  const dot = `\u00B7`

  if (!author) {
    return null
  }

  return (
    <div className="uppy-Dashboard-Item-author">
      <a
        href={`${author.url}?utm_source=Companion&utm_medium=referral`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {truncateString(author.name, 13)}
      </a>
      {providerName ? (
        <>
          {` ${dot} `}
          {providerName}
          {` ${dot} `}
        </>
      ) : null}
    </div>
  )
}

const renderFileSize = (props: { file: UppyFile<any, any> }) =>
  props.file.size && (
    <div className="uppy-Dashboard-Item-statusSize">
      {prettierBytes(props.file.size)}
    </div>
  )

const ReSelectButton = (props: {
  file: UppyFile<any, any>
  toggleAddFilesPanel: (show: boolean) => void
  i18n: I18n
}) =>
  props.file.isGhost && (
    <span>
      {' \u2022 '}
      <button
        className="uppy-u-reset uppy-c-btn uppy-Dashboard-Item-reSelect"
        type="button"
        onClick={() => props.toggleAddFilesPanel(true)}
      >
        {props.i18n('reSelect')}
      </button>
    </span>
  )

const ErrorButton = ({
  file,
  onClick,
}: {
  file: UppyFile<any, any>
  onClick: () => void
}) => {
  if (file.error) {
    return (
      <button
        className="uppy-u-reset uppy-c-btn uppy-Dashboard-Item-errorDetails"
        aria-label={file.error}
        data-microtip-position="bottom"
        data-microtip-size="medium"
        onClick={onClick}
        type="button"
      >
        ?
      </button>
    )
  }
  return null
}

type FileInfoProps = {
  file: UppyFile<any, any>
  containerWidth: number
  containerHeight: number
  i18n: I18n
  toggleAddFilesPanel: (show: boolean) => void
  toggleFileCard: (show: boolean, fileId: string) => void
  metaFields: DashboardState<any, any>['metaFields']
  isSingleFile: boolean
}

export default function FileInfo(props: FileInfoProps) {
  const {
    file,
    i18n,
    toggleFileCard,
    metaFields,
    toggleAddFilesPanel,
    isSingleFile,
    containerHeight,
    containerWidth,
  } = props
  return (
    <div
      className="uppy-Dashboard-Item-fileInfo"
      data-uppy-file-source={file.source}
    >
      <div className="uppy-Dashboard-Item-fileName">
        {renderFileName({
          file,
          isSingleFile,
          containerHeight,
          containerWidth,
        })}
        {}
        <ErrorButton file={file} onClick={() => alert(file.error)} />
      </div>
      <div className="uppy-Dashboard-Item-status">
        {renderAuthor({ file })}
        {renderFileSize({ file })}
        {ReSelectButton({ file, toggleAddFilesPanel, i18n })}
      </div>
      <MetaErrorMessage
        file={file}
        i18n={i18n}
        toggleFileCard={toggleFileCard}
        metaFields={metaFields}
      />
    </div>
  )
}
