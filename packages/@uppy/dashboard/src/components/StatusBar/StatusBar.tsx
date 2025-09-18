import type { Body, Meta, State, Uppy, UppyFile } from '@uppy/core'
import type { I18n } from '@uppy/utils'
import { emaFilter } from '@uppy/utils'
import type { ComponentChild } from 'preact'
import { Component } from 'preact'
import statusBarStates from './StatusBarStates.js'
import StatusBarUI, { type StatusBarUIProps } from './StatusBarUI.js'

const speedFilterHalfLife = 2000
const ETAFilterHalfLife = 2000

type StatusBarProps<M extends Meta, B extends Body> = {
  uppy: Uppy<M, B>
  hideProgressDetails: boolean
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
  recoveredState: State<any, any>['recoveredState'],
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

export default class StatusBar<
  M extends Meta,
  B extends Body,
> extends Component<StatusBarProps<M, B>> {
  #lastUpdateTime!: ReturnType<typeof performance.now>

  #previousUploadedBytes!: number | null

  #previousSpeed!: number | null

  #previousETA!: number | null

  componentDidMount(): void {
    // Initialize ETA calculation variables
    this.#lastUpdateTime = performance.now()
    this.#previousUploadedBytes = this.props.uppy
      .getFiles()
      .reduce((pv, file) => pv + (file.progress.bytesUploaded || 0), 0)

    // Listen for upload start to reset ETA calculation
    this.props.uppy.on('upload', this.#onUploadStart)
  }

  componentWillUnmount(): void {
    this.props.uppy.off('upload', this.#onUploadStart)
  }

  #onUploadStart = (): void => {
    const { recoveredState } = this.props.uppy.getState()

    this.#previousSpeed = null
    this.#previousETA = null

    if (recoveredState) {
      this.#previousUploadedBytes = Object.values(recoveredState.files).reduce(
        (pv, { progress }) => pv + (progress.bytesUploaded || 0),
        0,
      )
      // We don't set `#lastUpdateTime` at this point because the upload won't
      // actually resume until the user asks for it.
      return
    }

    this.#lastUpdateTime = performance.now()
    this.#previousUploadedBytes = 0
  }

  #computeSmoothETA(totalBytes: {
    uploaded: number
    total: number | null // null means indeterminate
  }): number | null {
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

    // Initialize previousUploadedBytes if it's null
    if (this.#previousUploadedBytes == null) {
      this.#previousUploadedBytes = totalBytes.uploaded
      return null // Can't calculate speed on first call
    }

    const uploadedBytesSinceLastTick =
      totalBytes.uploaded - this.#previousUploadedBytes
    this.#previousUploadedBytes = totalBytes.uploaded

    // uploadedBytesSinceLastTick can be negative in some cases (packet loss?)
    // in which case, we wait for next tick to update ETA.
    if (uploadedBytesSinceLastTick <= 0) {
      return Math.round((this.#previousETA ?? 0) / 100) / 10
    }
    const currentSpeed = uploadedBytesSinceLastTick / dt

    // Guard against invalid speed values
    if (!Number.isFinite(currentSpeed) || currentSpeed <= 0) {
      return null
    }

    const filteredSpeed =
      this.#previousSpeed == null
        ? currentSpeed
        : emaFilter(currentSpeed, this.#previousSpeed, speedFilterHalfLife, dt)

    // Guard against invalid filtered speed
    if (!Number.isFinite(filteredSpeed) || filteredSpeed <= 0) {
      return null
    }

    this.#previousSpeed = filteredSpeed
    const instantETA = remaining / filteredSpeed

    // Guard against invalid instantETA
    if (!Number.isFinite(instantETA) || instantETA < 0) {
      return null
    }

    const updatedPreviousETA = Math.max((this.#previousETA ?? 0) - dt, 0)
    const filteredETA =
      this.#previousETA == null
        ? instantETA
        : emaFilter(instantETA, updatedPreviousETA, ETAFilterHalfLife, dt)

    // Guard against invalid filteredETA
    if (!Number.isFinite(filteredETA) || filteredETA < 0) {
      return null
    }

    this.#previousETA = filteredETA
    this.#lastUpdateTime = performance.now()

    return Math.round(filteredETA / 100) / 10
  }

  startUpload = (): void => {
    const { recoveredState } = this.props.uppy.getState()
    if (recoveredState) {
      this.props.uppy.emit('restore-confirmed')
    } else {
      this.props.uppy.upload().catch((() => {
        // Error logged in Core
      }) as () => undefined)
    }
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

    let totalSize: number | null = null
    let totalUploadedSize = 0

    // Only if all files have a known size, does it make sense to display a total size
    if (
      startedFiles.every(
        (f) => f.progress.bytesTotal != null && f.progress.bytesTotal !== 0,
      )
    ) {
      totalSize = 0
      startedFiles.forEach((file) => {
        totalSize! += file.progress.bytesTotal || 0
        totalUploadedSize += file.progress.bytesUploaded || 0
      })
    } else {
      // however uploaded size we will always have
      startedFiles.forEach((file) => {
        totalUploadedSize += file.progress.bytesUploaded || 0
      })
    }

    const totalETA = this.#computeSmoothETA({
      uploaded: totalUploadedSize,
      total: totalSize,
    })

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
        totalSize={totalSize}
        totalUploadedSize={totalUploadedSize}
        isAllComplete={isAllComplete}
        isAllPaused={isAllPaused}
        isUploadStarted={isUploadStarted}
        isUploadInProgress={isUploadInProgress}
        isSomeGhost={isSomeGhost}
        recoveredState={recoveredState}
        complete={completeFiles.length}
        newFiles={newFilesOrRecovered.length}
        numUploads={startedFiles.length}
        totalETA={totalETA}
        files={files}
        i18n={this.props.i18n}
        uppy={this.props.uppy}
        startUpload={this.startUpload}
        doneButtonHandler={this.props.doneButtonHandler}
        resumableUploads={resumableUploads}
        supportsUploadProgress={supportsUploadProgress}
        hideProgressDetails={this.props.hideProgressDetails}
        hideUploadButton={this.props.hideUploadButton}
        hideRetryButton={this.props.hideRetryButton}
        hidePauseResumeButton={this.props.hidePauseResumeButton}
        hideCancelButton={this.props.hideCancelButton}
        hideAfterFinish={this.props.hideAfterFinish}
      />
    )
  }
}
