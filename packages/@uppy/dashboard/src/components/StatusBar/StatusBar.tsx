import type { Body, Meta, Uppy, UppyFile } from '@uppy/core'
import { h, Component } from 'preact'
import type { ComponentChild } from 'preact'
import type { I18n } from '@uppy/utils/lib/Translator'
import statusBarStates from './StatusBarStates.js'
import StatusBarUI, { type StatusBarUIProps } from './StatusBarUI.js'
import type { StatusBarOptions } from './StatusBarOptions.js'
import emaFilter from '@uppy/utils/lib/emaFilter'

const speedFilterHalfLife = 2000
const ETAFilterHalfLife = 2000


type StatusBarProps<M extends Meta, B extends Body> = {
  uppy: Uppy<M, B>
  showProgressDetails: boolean
  hideUploadButton: boolean
  hideRetryButton: boolean
  hidePauseResumeButton: boolean
  hideCancelButton: boolean
  hideAfterFinish: boolean
  doneButtonHandler: (() => void) | null
  i18n: I18n
}

function getUploadingState(
  error: unknown,
  isAllComplete: boolean,
  recoveredState: any,
  files: Record<string, UppyFile<any, any>>,
): StatusBarUIProps<any, any>['uploadState'] {
  if (error) {
    return statusBarStates.STATE_ERROR
  }

  if (isAllComplete) {
    return statusBarStates.STATE_COMPLETE
  }

  if (recoveredState) {
    return statusBarStates.STATE_WAITING
  }

  let state: StatusBarUIProps<any, any>['uploadState'] =
    statusBarStates.STATE_WAITING
  const fileIDs = Object.keys(files)
  for (let i = 0; i < fileIDs.length; i++) {
    const { progress } = files[fileIDs[i]]
    // If ANY files are being uploaded right now, show the uploading state.
    if (progress.uploadStarted && !progress.uploadComplete) {
      return statusBarStates.STATE_UPLOADING
    }
    // If files are being preprocessed AND postprocessed at this time, we show the
    // preprocess state. If any files are being uploaded we show uploading.
    if (progress.preprocess) {
      state = statusBarStates.STATE_PREPROCESSING
    }
    // If NO files are being preprocessed or uploaded right now, but some files are
    // being postprocessed, show the postprocess state.
    if (progress.postprocess && state !== statusBarStates.STATE_PREPROCESSING) {
      state = statusBarStates.STATE_POSTPROCESSING
    }
  }
  return state
}



const defaultOptions = {
  hideUploadButton: false,
  hideRetryButton: false,
  hidePauseResumeButton: false,
  hideCancelButton: false,
  showProgressDetails: false,
  hideAfterFinish: true,
  doneButtonHandler: null,
} satisfies StatusBarOptions

export default class StatusBar<
  M extends Meta,
  B extends Body,
> extends Component<StatusBarProps<M, B>> {

  #lastUpdateTime!: ReturnType<typeof performance.now>

  #previousUploadedBytes!: number | null

  #previousSpeed!: number | null

  #previousETA!: number | null


  #computeSmoothETA(totalBytes: {
    uploaded: number
    total: number | null // null means indeterminate
  }) {
    if (totalBytes.total == null || totalBytes.total === 0) {
      return null
    }

    const remaining = totalBytes.total - totalBytes.uploaded
    if (remaining <= 0) {
      return null
    }

    // When state is restored, lastUpdateTime is still nullish at this point.
    this.#lastUpdateTime ??= performance.now()
    const dt = performance.now() - this.#lastUpdateTime
    if (dt === 0) {
      return Math.round((this.#previousETA ?? 0) / 100) / 10
    }

    const uploadedBytesSinceLastTick =
      totalBytes.uploaded - this.#previousUploadedBytes!
    this.#previousUploadedBytes = totalBytes.uploaded

    // uploadedBytesSinceLastTick can be negative in some cases (packet loss?)
    // in which case, we wait for next tick to update ETA.
    if (uploadedBytesSinceLastTick <= 0) {
      return Math.round((this.#previousETA ?? 0) / 100) / 10
    }
    const currentSpeed = uploadedBytesSinceLastTick / dt
    const filteredSpeed =
      this.#previousSpeed == null
        ? currentSpeed
        : emaFilter(currentSpeed, this.#previousSpeed, speedFilterHalfLife, dt)
    this.#previousSpeed = filteredSpeed
    const instantETA = remaining / filteredSpeed

    const updatedPreviousETA = Math.max(this.#previousETA! - dt, 0)
    const filteredETA =
      this.#previousETA == null
        ? instantETA
        : emaFilter(instantETA, updatedPreviousETA, ETAFilterHalfLife, dt)
    this.#previousETA = filteredETA
    this.#lastUpdateTime = performance.now()

    return Math.round(filteredETA / 100) / 10
  }

  startUpload = (): ReturnType<Uppy<M, B>['upload']> => {
    return this.props.uppy.upload().catch((() => {
      // Error logged in Core
    }) as () => undefined)
  }
  render(): ComponentChild {
    const {
      capabilities,
      files,
      allowNewUpload,
      totalProgress,
      error,
      recoveredState,
    } = this.props.uppy.getState()

    const {
      newFiles,
      startedFiles,
      completeFiles,
      isUploadStarted,
      isAllComplete,
      isAllPaused,
      isUploadInProgress,
      isSomeGhost,
    } = this.props.uppy.getObjectOfFilesPerState()

    const newFilesOrRecovered = recoveredState ? Object.values(files) : newFiles
    const resumableUploads = !!capabilities.resumableUploads
    const supportsUploadProgress = capabilities.uploadProgress !== false

    return (
      <StatusBarUI
        error={error}
        uploadState={getUploadingState(
          error,
          isAllComplete,
          recoveredState,
          files || {},
        )}
        allowNewUpload={allowNewUpload}
        totalProgress={totalProgress}
        totalSize={null}
        totalUploadedSize={0}
        isAllComplete={isAllComplete}
        isAllPaused={isAllPaused}
        isUploadStarted={isUploadStarted}
        isUploadInProgress={isUploadInProgress}
        isSomeGhost={isSomeGhost}
        recoveredState={recoveredState}
        complete={completeFiles.length}
        newFiles={newFilesOrRecovered.length}
        numUploads={startedFiles.length}
        totalETA={0}
        files={files}
        i18n={this.props.i18n}
        uppy={this.props.uppy}
        startUpload={this.startUpload}
        doneButtonHandler={this.props.doneButtonHandler}
        resumableUploads={resumableUploads}
        supportsUploadProgress={supportsUploadProgress}
        showProgressDetails={this.props.showProgressDetails}
        hideUploadButton={this.props.hideUploadButton}
        hideRetryButton={this.props.hideRetryButton}
        hidePauseResumeButton={this.props.hidePauseResumeButton}
        hideCancelButton={this.props.hideCancelButton}
        hideAfterFinish={this.props.hideAfterFinish}
      />
    )
  }
}