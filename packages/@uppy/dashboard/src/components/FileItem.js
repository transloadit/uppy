const getFileNameAndExtension = require('@uppy/utils/lib/getFileNameAndExtension')
const truncateString = require('../utils/truncateString')
const copyToClipboard = require('../utils/copyToClipboard')
const prettyBytes = require('prettier-bytes')
const FileItemProgress = require('./FileItemProgress')
const getFileTypeIcon = require('../utils/getFileTypeIcon')
const FilePreview = require('./FilePreview')
const { iconRetry } = require('./icons')
const classNames = require('classnames')
const { h } = require('preact')

function FileItemProgressWrapper (props) {
  if (props.hideRetryButton && props.error) {
    return
  }

  if (props.isUploaded ||
      props.bundled ||
      (props.hidePauseResumeCancelButtons && !props.error)) {
    return <div class="uppy-DashboardItem-progressIndicator">
      <FileItemProgress
        progress={props.file.progress.percentage}
        fileID={props.file.id}
        hidePauseResumeCancelButtons={props.hidePauseResumeCancelButtons}
        bundled={props.bundled}
      />
    </div>
  }

  return <button
    class="uppy-DashboardItem-progressIndicator"
    type="button"
    aria-label={props.progressIndicatorTitle}
    title={props.progressIndicatorTitle}
    onclick={props.onPauseResumeCancelRetry}>
    {props.error
      ? props.hideRetryButton ? null : iconRetry()
      : <FileItemProgress
        progress={props.file.progress.percentage}
        fileID={props.file.id}
        hidePauseResumeCancelButtons={props.hidePauseResumeCancelButtons}
      />
    }
  </button>
}

module.exports = function fileItem (props) {
  const file = props.file
  const acquirers = props.acquirers

  const isProcessing = file.progress.preprocess || file.progress.postprocess
  const isUploaded = file.progress.uploadComplete && !isProcessing && !file.error
  const uploadInProgressOrComplete = file.progress.uploadStarted || isProcessing
  const uploadInProgress = (file.progress.uploadStarted && !file.progress.uploadComplete) || isProcessing
  const isPaused = file.isPaused || false
  const error = file.error || false

  const fileName = getFileNameAndExtension(file.meta.name).name
  const truncatedFileName = props.isWide ? truncateString(fileName, 30) : fileName

  function onPauseResumeCancelRetry (ev) {
    if (isUploaded) return

    if (error && !props.hideRetryButton) {
      props.retryUpload(file.id)
      return
    }

    if (props.hidePauseResumeCancelButtons) {
      return
    }

    if (props.resumableUploads) {
      props.pauseUpload(file.id)
    } else {
      props.cancelUpload(file.id)
    }
  }

  function progressIndicatorTitle (props) {
    if (isUploaded) {
      return props.i18n('uploadComplete')
    }

    if (error) {
      return props.i18n('retryUpload')
    }

    if (props.resumableUploads) {
      if (file.isPaused) {
        return props.i18n('resumeUpload')
      }
      return props.i18n('pauseUpload')
    } else {
      return props.i18n('cancelUpload')
    }
  }

  const dashboardItemClass = classNames(
    'uppy-DashboardItem',
    { 'is-inprogress': uploadInProgress },
    { 'is-processing': isProcessing },
    { 'is-complete': isUploaded },
    { 'is-paused': isPaused },
    { 'is-error': error },
    { 'is-resumable': props.resumableUploads },
    { 'is-bundled': props.bundledUpload }
  )

  return <li class={dashboardItemClass} id={`uppy_${file.id}`} title={file.meta.name}>
    <div class="uppy-DashboardItem-preview">
      <div class="uppy-DashboardItem-previewInnerWrap" style={{ backgroundColor: getFileTypeIcon(file.type).color }}>
        {props.showLinkToFileUploadResult && file.uploadURL
          ? <a class="uppy-DashboardItem-previewLink" href={file.uploadURL} rel="noreferrer noopener" target="_blank" />
          : null
        }
        <FilePreview file={file} />
      </div>
      <div class="uppy-DashboardItem-progress">
        <FileItemProgressWrapper
          progressIndicatorTitle={progressIndicatorTitle(props)}
          onPauseResumeCancelRetry={onPauseResumeCancelRetry}
          file={file}
          error={error}
          {...props} />
      </div>
    </div>
    <div class="uppy-DashboardItem-info">
      <div class="uppy-DashboardItem-name" title={fileName}>
        {props.showLinkToFileUploadResult && file.uploadURL
          ? <a href={file.uploadURL} rel="noreferrer noopener" target="_blank">
            {file.extension ? truncatedFileName + '.' + file.extension : truncatedFileName}
          </a>
          : file.extension ? truncatedFileName + '.' + file.extension : truncatedFileName
        }
      </div>
      <div class="uppy-DashboardItem-status">
        {file.data.size ? <div class="uppy-DashboardItem-statusSize">{prettyBytes(file.data.size)}</div> : null}
        {(file.source && file.source !== props.id) && <div class="uppy-DashboardItem-sourceIcon">
            {acquirers.map(acquirer => {
              if (acquirer.id === file.source) {
                return <span title={props.i18n('fileSource', { name: acquirer.name })}>
                  {acquirer.icon()}
                </span>
              }
            })}
          </div>
        }
        {(!uploadInProgressOrComplete && props.metaFields && props.metaFields.length)
          ? <button class="uppy-u-reset uppy-DashboardItem-edit"
            type="button"
            aria-label={props.i18n('editFile')}
            title={props.i18n('editFile')}
            onclick={(e) => props.toggleFileCard(file.id)}>
            {props.i18n('edit')}
          </button>
          : null
        }
        {props.showLinkToFileUploadResult && file.uploadURL
          ? <button class="uppy-u-reset uppy-DashboardItem-copyLink"
            type="button"
            aria-label={props.i18n('copyLink')}
            title={props.i18n('copyLink')}
            onclick={() => {
              copyToClipboard(file.uploadURL, props.i18n('copyLinkToClipboardFallback'))
                .then(() => {
                  props.log('Link copied to clipboard.')
                  props.info(props.i18n('copyLinkToClipboardSuccess'), 'info', 3000)
                })
                .catch(props.log)
            }}>{props.i18n('link')}</button>
          : ''
        }
      </div>
    </div>
    <div class="uppy-DashboardItem-action">
      {!isUploaded &&
        <button class="uppy-DashboardItem-remove"
          type="button"
          aria-label={props.i18n('removeFile')}
          title={props.i18n('removeFile')}
          onclick={() => props.removeFile(file.id)}>
          <svg aria-hidden="true" class="UppyIcon" width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <path stroke="#FFF" stroke-width="1" fill-rule="nonzero" vector-effect="non-scaling-stroke" d="M30 1C14 1 1 14 1 30s13 29 29 29 29-13 29-29S46 1 30 1z" />
            <path fill="#FFF" vector-effect="non-scaling-stroke" d="M42 39.667L39.667 42 30 32.333 20.333 42 18 39.667 27.667 30 18 20.333 20.333 18 30 27.667 39.667 18 42 20.333 32.333 30z" />
          </svg>
        </button>
      }
    </div>
  </li>
}
