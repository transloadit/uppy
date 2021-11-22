const { UIPlugin } = require('@uppy/core')
const getSpeed = require('@uppy/utils/lib/getSpeed')
const getBytesRemaining = require('@uppy/utils/lib/getBytesRemaining')
const getTextDirection = require('@uppy/utils/lib/getTextDirection')
const statusBarStates = require('./StatusBarStates')
const StatusBarUI = require('./StatusBar')

const locale = require('./locale.js')

/**
 * StatusBar: renders a status bar with upload/pause/resume/cancel/retry buttons,
 * progress percentage and time remaining.
 */
module.exports = class StatusBar extends UIPlugin {
  // eslint-disable-next-line global-require
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'StatusBar'
    this.title = 'StatusBar'
    this.type = 'progressindicator'

    this.defaultLocale = locale

    // set default options
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
      inProgressNotPausedFiles,

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
    const totalETA = getTotalETA(inProgressNotPausedFiles)
    const resumableUploads = !!capabilities.resumableUploads
    const supportsUploadProgress = capabilities.uploadProgress !== false

    let totalSize = 0
    let totalUploadedSize = 0

    startedFiles.forEach((file) => {
      totalSize += file.progress.bytesTotal || 0
      totalUploadedSize += file.progress.bytesUploaded || 0
    })

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

function getTotalSpeed (files) {
  let totalSpeed = 0
  files.forEach((file) => {
    totalSpeed += getSpeed(file.progress)
  })
  return totalSpeed
}

function getTotalETA (files) {
  const totalSpeed = getTotalSpeed(files)
  if (totalSpeed === 0) {
    return 0
  }

  const totalBytesRemaining = files.reduce((total, file) => {
    return total + getBytesRemaining(file.progress)
  }, 0)

  return Math.round((totalBytesRemaining / totalSpeed) * 10) / 10
}

function getUploadingState (error, isAllComplete, recoveredState, files) {
  if (error && !isAllComplete) {
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
