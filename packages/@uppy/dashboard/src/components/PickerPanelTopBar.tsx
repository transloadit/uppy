import type { State, Uppy, UppyFile } from '@uppy/core'
import type { Body, I18n, Meta } from '@uppy/core/utils'
import type { ComponentChildren } from 'preact'

const uploadStates = {
  STATE_ERROR: 'error',
  STATE_WAITING: 'waiting',
  STATE_PREPROCESSING: 'preprocessing',
  STATE_UPLOADING: 'uploading',
  STATE_POSTPROCESSING: 'postprocessing',
  STATE_COMPLETE: 'complete',
  STATE_PAUSED: 'paused',
} as const

export type UploadState = (typeof uploadStates)[keyof typeof uploadStates]

function getUploadingState(
  isAllErrored: boolean | undefined,
  isAllComplete: boolean,
  isAllPaused: boolean,
  files: Record<string, UppyFile<any, any>> = {},
): UploadState {
  if (isAllErrored) {
    return uploadStates.STATE_ERROR
  }

  if (isAllComplete) {
    return uploadStates.STATE_COMPLETE
  }

  if (isAllPaused) {
    return uploadStates.STATE_PAUSED
  }

  let state: UploadState = uploadStates.STATE_WAITING
  const fileIDs = Object.keys(files)
  for (let i = 0; i < fileIDs.length; i++) {
    const { progress } = files[fileIDs[i] as keyof typeof files]
    // If ANY files are being uploaded right now, show the uploading state.
    if (progress.uploadStarted && !progress.uploadComplete) {
      return uploadStates.STATE_UPLOADING
    }
    // If files are being preprocessed AND postprocessed at this time, we show the
    // preprocess state. The uploading state is handled by the early return above.
    if (progress.preprocess) {
      state = uploadStates.STATE_PREPROCESSING
    }
    // If NO files are being preprocessed or uploaded right now, but some files are
    // being postprocessed, show the postprocess state.
    if (progress.postprocess && state !== uploadStates.STATE_PREPROCESSING) {
      state = uploadStates.STATE_POSTPROCESSING
    }
  }
  return state
}

interface UploadStatusProps<M extends Meta, B extends Body> {
  files: State<M, B>['files']
  i18n: I18n
  isAllComplete: boolean
  isAllErrored?: boolean | undefined
  isAllPaused: boolean
  inProgressNotPausedFiles: UppyFile<M, B>[]
  newFiles: UppyFile<M, B>[]
  processingFiles: UppyFile<M, B>[]
}

function UploadStatus<M extends Meta, B extends Body>({
  files,
  i18n,
  isAllComplete,
  isAllErrored,
  isAllPaused,
  inProgressNotPausedFiles,
  newFiles,
  processingFiles,
}: UploadStatusProps<M, B>): ComponentChildren {
  const uploadingState = getUploadingState(
    isAllErrored,
    isAllComplete,
    isAllPaused,
    files,
  )

  switch (uploadingState) {
    case 'uploading':
      return i18n('uploadingXFiles', {
        smart_count: inProgressNotPausedFiles.length,
      })
    case 'preprocessing':
    case 'postprocessing':
      return i18n('processingXFiles', { smart_count: processingFiles.length })
    case 'paused':
      return i18n('uploadPaused')
    case 'waiting':
      return i18n('xFilesSelected', { smart_count: newFiles.length })
    case 'complete':
      return i18n('uploadComplete')
    case 'error':
      return i18n('error')
    default:
  }
}

interface PanelTopBarProps<M extends Meta, B extends Body>
  extends UploadStatusProps<M, B> {
  allowNewUpload: boolean
  i18n: I18n
  hideCancelButton: boolean
  maxNumberOfFiles: number | null
  totalFileCount: number
  toggleAddFilesPanel: (enabled: boolean) => void
  uppy: Uppy<M, B>
}

function PanelTopBar<M extends Meta, B extends Body>(
  props: PanelTopBarProps<M, B>,
): ComponentChildren {
  const {
    i18n,
    isAllComplete,
    hideCancelButton,
    maxNumberOfFiles,
    toggleAddFilesPanel,
    totalFileCount,
    uppy,
  } = props
  let { allowNewUpload } = props
  // TODO maybe this should be done in ../Dashboard.js, then just pass that down as `allowNewUpload`
  if (allowNewUpload && maxNumberOfFiles) {
    allowNewUpload = totalFileCount < maxNumberOfFiles
  }

  return (
    <div className="uppy-DashboardContent-bar">
      {!isAllComplete && !hideCancelButton ? (
        <button
          className="uppy-DashboardContent-back"
          type="button"
          onClick={() => uppy.cancelAll()}
        >
          {i18n('cancel')}
        </button>
      ) : (
        <div />
      )}

      <div className="uppy-DashboardContent-title">
        <UploadStatus {...props} />
      </div>

      {allowNewUpload ? (
        <button
          className="uppy-DashboardContent-addMore"
          type="button"
          aria-label={i18n('addMoreFiles')}
          title={i18n('addMoreFiles')}
          onClick={() => toggleAddFilesPanel(true)}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            className="uppy-c-icon"
            width="15"
            height="15"
            viewBox="0 0 15 15"
          >
            <path d="M8 6.5h6a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H8v6a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V8h-6a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h6v-6A.5.5 0 0 1 7 0h.5a.5.5 0 0 1 .5.5v6z" />
          </svg>
          <span className="uppy-DashboardContent-addMoreCaption">
            {i18n('addMore')}
          </span>
        </button>
      ) : (
        <div />
      )}
    </div>
  )
}

export default PanelTopBar
