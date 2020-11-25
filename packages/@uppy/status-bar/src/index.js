const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const StatusBarUI = require('./StatusBar')
const statusBarStates = require('./StatusBarStates')
const getSpeed = require('@uppy/utils/lib/getSpeed')
const getBytesRemaining = require('@uppy/utils/lib/getBytesRemaining')

/**
 * StatusBar: renders a status bar with upload/pause/resume/cancel/retry buttons,
 * progress percentage and time remaining.
 */
module.exports = class StatusBar extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'StatusBar'
    this.title = 'StatusBar'
    this.type = 'progressindicator'

    this.defaultLocale = {
      strings: {
        uploading: 'Uploading',
        upload: 'Upload',
        complete: 'Complete',
        uploadFailed: 'Upload failed',
        paused: 'Paused',
        retry: 'Retry',
        retryUpload: 'Retry upload',
        cancel: 'Cancel',
        pause: 'Pause',
        resume: 'Resume',
        done: 'Done',
        filesUploadedOfTotal: {
          0: '%{complete} of %{smart_count} file uploaded',
          1: '%{complete} of %{smart_count} files uploaded'
        },
        dataUploadedOfTotal: '%{complete} of %{total}',
        xTimeLeft: '%{time} left',
        uploadXFiles: {
          0: 'Upload %{smart_count} file',
          1: 'Upload %{smart_count} files'
        },
        uploadXNewFiles: {
          0: 'Upload +%{smart_count} file',
          1: 'Upload +%{smart_count} files'
        },
        xMoreFilesAdded: {
          0: '%{smart_count} more file added',
          1: '%{smart_count} more files added'
        }
      }
    }

    // set default options
    const defaultOptions = {
      target: 'body',
      hideUploadButton: false,
      hideRetryButton: false,
      hidePauseResumeButton: false,
      hideCancelButton: false,
      showProgressDetails: false,
      hideAfterFinish: true,
      doneButtonHandler: null
    }

    this.opts = { ...defaultOptions, ...opts }

    this.i18nInit()

    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
  }

  setOptions (newOpts) {
    super.setOptions(newOpts)
    this.i18nInit()
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    this.setPluginState() // so that UI re-renders and we see the updated locale
  }

  getTotalSpeed (files) {
    let totalSpeed = 0
    files.forEach((file) => {
      totalSpeed = totalSpeed + getSpeed(file.progress)
    })
    return totalSpeed
  }

  getTotalETA (files) {
    const totalSpeed = this.getTotalSpeed(files)
    if (totalSpeed === 0) {
      return 0
    }

    const totalBytesRemaining = files.reduce((total, file) => {
      return total + getBytesRemaining(file.progress)
    }, 0)

    return Math.round(totalBytesRemaining / totalSpeed * 10) / 10
  }

  startUpload = () => {
    return this.uppy.upload().catch(() => {
      // Error logged in Core
    })
  }

  getUploadingState (isAllErrored, isAllComplete, files) {
    if (isAllErrored) {
      return statusBarStates.STATE_ERROR
    }

    if (isAllComplete) {
      return statusBarStates.STATE_COMPLETE
    }

    let state = statusBarStates.STATE_WAITING
    const fileIDs = Object.keys(files)
    for (let i = 0; i < fileIDs.length; i++) {
      const progress = files[fileIDs[i]].progress
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
      if (progress.postprocess && state !== statusBarStates.STATE_UPLOADING && state !== statusBarStates.STATE_PREPROCESSING) {
        state = statusBarStates.STATE_POSTPROCESSING
      }
    }
    return state
  }

  render (state) {
    const {
      capabilities,
      files,
      allowNewUpload,
      totalProgress,
      error
    } = state

    // TODO: move this to Core, to share between Status Bar and Dashboard
    // (and any other plugin that might need it, too)

    const filesArray = Object.keys(files).map(file => files[file])

    const newFiles = filesArray.filter((file) => {
      return !file.progress.uploadStarted &&
        !file.progress.preprocess &&
        !file.progress.postprocess
    })

    const uploadStartedFiles = filesArray.filter(file => file.progress.uploadStarted)
    const pausedFiles = uploadStartedFiles.filter(file => file.isPaused)
    const completeFiles = filesArray.filter(file => file.progress.uploadComplete)
    const erroredFiles = filesArray.filter(file => file.error)

    const inProgressFiles = filesArray.filter((file) => {
      return !file.progress.uploadComplete &&
             file.progress.uploadStarted
    })

    const inProgressNotPausedFiles = inProgressFiles.filter(file => !file.isPaused)

    const startedFiles = filesArray.filter((file) => {
      return file.progress.uploadStarted ||
        file.progress.preprocess ||
        file.progress.postprocess
    })

    const processingFiles = filesArray.filter(file => file.progress.preprocess || file.progress.postprocess)

    const totalETA = this.getTotalETA(inProgressNotPausedFiles)

    let totalSize = 0
    let totalUploadedSize = 0
    startedFiles.forEach((file) => {
      totalSize = totalSize + (file.progress.bytesTotal || 0)
      totalUploadedSize = totalUploadedSize + (file.progress.bytesUploaded || 0)
    })

    const isUploadStarted = startedFiles.length > 0

    const isAllComplete = totalProgress === 100 &&
      completeFiles.length === Object.keys(files).length &&
      processingFiles.length === 0

    const isAllErrored = error && erroredFiles.length === filesArray.length

    const isAllPaused = inProgressFiles.length !== 0 &&
      pausedFiles.length === inProgressFiles.length

    const isUploadInProgress = inProgressFiles.length > 0
    const resumableUploads = capabilities.resumableUploads || false
    const supportsUploadProgress = capabilities.uploadProgress !== false

    return StatusBarUI({
      error,
      uploadState: this.getUploadingState(isAllErrored, isAllComplete, state.files || {}),
      allowNewUpload,
      totalProgress,
      totalSize,
      totalUploadedSize,
      isAllComplete,
      isAllPaused,
      isAllErrored,
      isUploadStarted,
      isUploadInProgress,
      complete: completeFiles.length,
      newFiles: newFiles.length,
      numUploads: startedFiles.length,
      totalETA,
      files,
      i18n: this.i18n,
      pauseAll: this.uppy.pauseAll,
      resumeAll: this.uppy.resumeAll,
      retryAll: this.uppy.retryAll,
      cancelAll: this.uppy.cancelAll,
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
      isTargetDOMEl: this.isTargetDOMEl
    })
  }

  install () {
    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }
}
