import { UIPlugin } from '@uppy/core'
import emaFilter from '@uppy/utils/lib/emaFilter'
import getTextDirection from '@uppy/utils/lib/getTextDirection'
import statusBarStates from './StatusBarStates.js'
import StatusBarUI from './StatusBarUI.jsx'

import packageJson from '../package.json'
import locale from './locale.js'

const speedFilterHalfLife = 2000
const ETAFilterHalfLife = 2000

function* generateSmoothETA (uploadStarted) {
  let totalBytes = yield 0 // we wait for the first render
  let lastUpdateTime = uploadStarted
  let previousUploadedBytes = 0
  let previousSpeed
  let previousETA
  while (true) {
    const dt = Date.now() - lastUpdateTime
    if (dt === 0) {
      totalBytes = yield Math.round((previousETA ?? 0) / 100) / 10
      continue // eslint-disable-line no-continue
    }

    if (totalBytes.total === 0) {
      totalBytes = yield 0
      continue // eslint-disable-line no-continue
    }
    totalBytes.remaining = totalBytes.total - totalBytes.uploaded
    if (totalBytes.remaining === 0) {
      totalBytes = yield 0
      continue // eslint-disable-line no-continue
    }

    const uploadedBytesSinceLastTick = totalBytes.uploaded - previousUploadedBytes
    previousUploadedBytes = totalBytes.uploaded
    // uploadedBytesSinceLastTick can be negative in some cases (packet loss?)
    // in which case, we wait for next tick to update ETA.
    if (uploadedBytesSinceLastTick <= 0) {
      totalBytes = yield Math.round((previousETA ?? 0) / 100) / 10
      continue // eslint-disable-line no-continue
    }
    const currentSpeed = uploadedBytesSinceLastTick / dt
    const filteredSpeed = previousSpeed == null
      ? currentSpeed
      : emaFilter(currentSpeed, previousSpeed, speedFilterHalfLife, dt)
    previousSpeed = filteredSpeed
    const instantETA = totalBytes.remaining / filteredSpeed

    const updatedPreviousETA = Math.max(previousETA - dt, 0)
    const filteredETA = previousETA == null
      ? instantETA
      : emaFilter(instantETA, updatedPreviousETA, ETAFilterHalfLife, dt)
    previousETA = filteredETA
    lastUpdateTime = Date.now()

    totalBytes = yield Math.round(filteredETA / 100) / 10
  }
}

function getUploadingState (error, isAllComplete, recoveredState, files) {
  if (error) {
    return statusBarStates.STATE_ERROR
  }

  if (isAllComplete) {
    return statusBarStates.STATE_COMPLETE
  }

  if (recoveredState) {
    return statusBarStates.STATE_WAITING
  }

  let state = statusBarStates.STATE_WAITING
  const fileIDs = Object.keys(files)
  for (let i = 0; i < fileIDs.length; i++) {
    const { progress } = files[fileIDs[i]]
    // If ANY files are being uploaded right now, show the uploading state.
    if (progress.uploadStarted && !progress.uploadComplete) {
      return statusBarStates.STATE_UPLOADING
    }
    // If files are being preprocessed AND postprocessed at this time, we show the
    // preprocess state. If any files are being uploaded we show uploading.
    if (progress.preprocess && state !== statusBarStates.STATE_UPLOADING) {
      state = statusBarStates.STATE_PREPROCESSING
    }
    // If NO files are being preprocessed or uploaded right now, but some files are
    // being postprocessed, show the postprocess state.
    if (
      progress.postprocess
      && state !== statusBarStates.STATE_UPLOADING
      && state !== statusBarStates.STATE_PREPROCESSING
    ) {
      state = statusBarStates.STATE_POSTPROCESSING
    }
  }
  return state
}

/**
 * StatusBar: renders a status bar with upload/pause/resume/cancel/retry buttons,
 * progress percentage and time remaining.
 */
export default class StatusBar extends UIPlugin {
  static VERSION = packageJson.version

  #etaGenerator

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'StatusBar'
    this.title = 'StatusBar'
    this.type = 'progressindicator'

    this.defaultLocale = locale

    // set default options, must be kept in sync with @uppy/react/src/StatusBar.js
    const defaultOptions = {
      target: 'body',
      hideUploadButton: false,
      hideRetryButton: false,
      hidePauseResumeButton: false,
      hideCancelButton: false,
      showProgressDetails: false,
      hideAfterFinish: true,
      doneButtonHandler: null,
    }

    this.opts = { ...defaultOptions, ...opts }

    this.i18nInit()

    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
  }

  startUpload = () => {
    const { recoveredState } = this.uppy.getState()

    if (recoveredState) {
      this.uppy.emit('restore-confirmed')
      return undefined
    }
    this.#etaGenerator = generateSmoothETA(Date.now())
    return this.uppy.upload().catch(() => {
      // Error logged in Core
    })
  }

  render (state) {
    const {
      capabilities,
      files,
      allowNewUpload,
      totalProgress,
      error,
      recoveredState,
    } = state

    const {
      newFiles,
      startedFiles,
      completeFiles,

      isUploadStarted,
      isAllComplete,
      isAllErrored,
      isAllPaused,
      isUploadInProgress,
      isSomeGhost,
    } = this.uppy.getObjectOfFilesPerState()

    // If some state was recovered, we want to show Upload button/counter
    // for all the files, because in this case it’s not an Upload button,
    // but “Confirm Restore Button”
    const newFilesOrRecovered = recoveredState
      ? Object.values(files)
      : newFiles
    const resumableUploads = !!capabilities.resumableUploads
    const supportsUploadProgress = capabilities.uploadProgress !== false

    let totalSize = 0
    let totalUploadedSize = 0

    startedFiles.forEach((file) => {
      totalSize += file.progress.bytesTotal || 0
      totalUploadedSize += file.progress.bytesUploaded || 0
    })
    const totalETA = totalSize && this.#etaGenerator.next({
      uploaded: totalUploadedSize,
      total: totalSize,
      remaining: totalSize - totalUploadedSize,
    }).value

    return StatusBarUI({
      error,
      uploadState: getUploadingState(
        error,
        isAllComplete,
        recoveredState,
        state.files || {},
      ),
      allowNewUpload,
      totalProgress,
      totalSize,
      totalUploadedSize,
      isAllComplete: false,
      isAllPaused,
      isAllErrored,
      isUploadStarted,
      isUploadInProgress,
      isSomeGhost,
      recoveredState,
      complete: completeFiles.length,
      newFiles: newFilesOrRecovered.length,
      numUploads: startedFiles.length,
      totalETA,
      files,
      i18n: this.i18n,
      uppy: this.uppy,
      startUpload: this.startUpload,
      doneButtonHandler: this.opts.doneButtonHandler,
      resumableUploads,
      supportsUploadProgress,
      showProgressDetails: this.opts.showProgressDetails,
      hideUploadButton: this.opts.hideUploadButton,
      hideRetryButton: this.opts.hideRetryButton,
      hidePauseResumeButton: this.opts.hidePauseResumeButton,
      hideCancelButton: this.opts.hideCancelButton,
      hideAfterFinish: this.opts.hideAfterFinish,
      isTargetDOMEl: this.isTargetDOMEl,
    })
  }

  onMount () {
    // Set the text direction if the page has not defined one.
    const element = this.el
    const direction = getTextDirection(element)
    if (!direction) {
      element.dir = 'ltr'
    }
  }

  install () {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }
}
