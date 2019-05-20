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
      (props.hidePauseResumeCancelButtons && !props.error)) {
    return <div class="uppy-DashboardItem-progressIndicator">
      <FileItemProgress
        progress={props.file.progress.percentage}
        fileID={props.file.id}
        hidePauseResumeCancelButtons={props.hidePauseResumeCancelButtons}
        individualCancellation={props.individualCancellation}
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
        individualCancellation={props.individualCancellation}
        hidePauseResumeCancelButtons={props.hidePauseResumeCancelButtons}
      />
    }
  </button>
}

module.exports = function FileItem (props) {
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
    } else if (props.individualCancellation) {
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
    } else if (props.individualCancellation) {
      return props.i18n('cancelUpload')
    }

    return ''
  }

  const dashboardItemClass = classNames(
    'uppy-DashboardItem',
    { 'is-inprogress': uploadInProgress },
    { 'is-processing': isProcessing },
    { 'is-complete': isUploaded },
    { 'is-paused': isPaused },
    { 'is-error': error },
    { 'is-resumable': props.resumableUploads },
    { 'is-noIndividualCancellation': !props.individualCancellation }
  )

  const showRemoveButton = props.individualCancellation
    ? !isUploaded
    : !uploadInProgress && !isUploaded

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
      <div class="uppy-DashboardItem-file">
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
        </div>
      </div>
      <div className="uppy-DashboardItem-actionWrapper">
        {(!uploadInProgressOrComplete && props.metaFields && props.metaFields.length)
          ? <button class="uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--edit"
            type="button"
            aria-label={props.i18n('editFile')}
            title={props.i18n('editFile')}
            onclick={(e) => props.toggleFileCard(file.id)
            }>
            <svg aria-hidden="true" class="UppyIcon" width="14" height="14" viewBox="0 0 14 14">
              <g fill-rule="evenodd"><path d="M1.5 10.793h2.793A1 1 0 0 0 5 10.5L11.5 4a1 1 0 0 0 0-1.414L9.707.793a1 1 0 0 0-1.414 0l-6.5 6.5A1 1 0 0 0 1.5 8v2.793zm1-1V8L9 1.5l1.793 1.793-6.5 6.5H2.5z" fill-rule="nonzero" /><rect x="1" y="12.293" width="11" height="1" rx=".5" /><path fill-rule="nonzero" d="M6.793 2.5L9.5 5.207l.707-.707L7.5 1.793z" /></g>
            </svg>
          </button>
          : null
        }
        {props.showLinkToFileUploadResult && file.uploadURL
          ? <button class="uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--copyLink"
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
            }}>
            <svg aria-hidden="true" class="UppyIcon" width="14" height="14" viewBox="0 0 14 14">
              <path d="M7.94 7.703a2.613 2.613 0 0 1-.626 2.681l-.852.851a2.597 2.597 0 0 1-1.849.766A2.616 2.616 0 0 1 2.764 7.54l.852-.852a2.596 2.596 0 0 1 2.69-.625L5.267 7.099a1.44 1.44 0 0 0-.833.407l-.852.851a1.458 1.458 0 0 0 1.03 2.486c.39 0 .755-.152 1.03-.426l.852-.852c.231-.231.363-.522.406-.824l1.04-1.038zm4.295-5.937A2.596 2.596 0 0 0 10.387 1c-.698 0-1.355.272-1.849.766l-.852.851a2.614 2.614 0 0 0-.624 2.688l1.036-1.036c.041-.304.173-.6.407-.833l.852-.852c.275-.275.64-.426 1.03-.426a1.458 1.458 0 0 1 1.03 2.486l-.852.851a1.442 1.442 0 0 1-.824.406l-1.04 1.04a2.596 2.596 0 0 0 2.683-.628l.851-.85a2.616 2.616 0 0 0 0-3.697zm-6.88 6.883a.577.577 0 0 0 .82 0l3.474-3.474a.579.579 0 1 0-.819-.82L5.355 7.83a.579.579 0 0 0 0 .819z" />
            </svg>
          </button>
          : ''
        }
        {showRemoveButton &&
          <button class="uppy-DashboardItem-action uppy-DashboardItem-action--remove"
            type="button"
            aria-label={props.i18n('removeFile')}
            title={props.i18n('removeFile')}
            onclick={() => props.removeFile(file.id)}>
            <svg aria-hidden="true" class="UppyIcon" width="18" height="18" viewBox="0 0 18 18">
              <path d="M9 0C4.034 0 0 4.034 0 9s4.034 9 9 9 9-4.034 9-9-4.034-9-9-9z" />
              <path fill="#FFF" d="M13 12.222l-.778.778L9 9.778 5.778 13 5 12.222 8.222 9 5 5.778 5.778 5 9 8.222 12.222 5l.778.778L9.778 9z" />
            </svg>
          </button>
        }
      </div>
    </div>
  </li>
}
