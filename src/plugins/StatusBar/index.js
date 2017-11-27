const Plugin = require('../Plugin')
const Translator = require('../../core/Translator')
const StatusBar = require('./StatusBar')
const { getSpeed } = require('../../core/Utils')
const { getBytesRemaining } = require('../../core/Utils')
const { prettyETA } = require('../../core/Utils')
const prettyBytes = require('prettier-bytes')

/**
 * A status bar.
 */
module.exports = class StatusBarUI extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = this.opts.id || 'StatusBar'
    this.title = 'StatusBar'
    this.type = 'progressindicator'

    const defaultLocale = {
      strings: {
        uploading: 'Uploading',
        uploadComplete: 'Upload complete',
        uploadFailed: 'Upload failed',
        pleasePressRetry: 'Please press Retry to upload again',
        paused: 'Paused',
        error: 'Error',
        retry: 'Retry',
        pressToRetry: 'Press to retry',
        retryUpload: 'Retry upload',
        resumeUpload: 'Resume upload',
        cancelUpload: 'Cancel upload',
        pauseUpload: 'Pause upload',
        uploadXFiles: {
          0: 'Upload %{smart_count} file',
          1: 'Upload %{smart_count} files'
        },
        uploadXNewFiles: {
          0: 'Upload +%{smart_count} file',
          1: 'Upload +%{smart_count} files'
        }
      }
    }

    // set default options
    const defaultOptions = {
      target: 'body',
      showProgressDetails: false,
      locale: defaultLocale
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
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

  render (state) {
    const files = state.files

    const uploadStartedFiles = Object.keys(files).filter((file) => {
      return files[file].progress.uploadStarted
    })
    const newFiles = Object.keys(files).filter((file) => {
      return !files[file].progress.uploadStarted
    })
    const completeFiles = Object.keys(files).filter((file) => {
      return files[file].progress.uploadComplete
    })
    const erroredFiles = Object.keys(files).filter((file) => {
      return files[file].error
    })
    const inProgressFiles = Object.keys(files).filter((file) => {
      return !files[file].progress.uploadComplete &&
             files[file].progress.uploadStarted &&
             !files[file].isPaused
    })
    const processingFiles = Object.keys(files).filter((file) => {
      return files[file].progress.preprocess || files[file].progress.postprocess
    })

    let inProgressFilesArray = []
    inProgressFiles.forEach((file) => {
      inProgressFilesArray.push(files[file])
    })

    const totalSpeed = prettyBytes(this.getTotalSpeed(inProgressFilesArray))
    const totalETA = prettyETA(this.getTotalETA(inProgressFilesArray))

    // total size and uploaded size
    let totalSize = 0
    let totalUploadedSize = 0
    inProgressFilesArray.forEach((file) => {
      totalSize = totalSize + (file.progress.bytesTotal || 0)
      totalUploadedSize = totalUploadedSize + (file.progress.bytesUploaded || 0)
    })
    totalSize = prettyBytes(totalSize)
    totalUploadedSize = prettyBytes(totalUploadedSize)

    const isUploadStarted = uploadStartedFiles.length > 0

    const isAllComplete = state.totalProgress === 100 &&
      completeFiles.length === Object.keys(files).length &&
      processingFiles.length === 0

    const isAllErrored = isUploadStarted &&
      erroredFiles.length === uploadStartedFiles.length

    const isAllPaused = inProgressFiles.length === 0 &&
      !isAllComplete &&
      !isAllErrored &&
      uploadStartedFiles.length > 0

    const resumableUploads = this.core.getState().capabilities.resumableUploads || false

    return StatusBar({
      error: state.error,
      totalProgress: state.totalProgress,
      totalSize: totalSize,
      totalUploadedSize: totalUploadedSize,
      uploadStartedFiles: uploadStartedFiles,
      isAllComplete: isAllComplete,
      isAllPaused: isAllPaused,
      isAllErrored: isAllErrored,
      isUploadStarted: isUploadStarted,
      i18n: this.i18n,
      pauseAll: this.core.pauseAll,
      resumeAll: this.core.resumeAll,
      retryAll: this.core.retryAll,
      cancelAll: this.core.cancelAll,
      startUpload: this.core.upload,
      complete: completeFiles.length,
      newFiles: newFiles.length,
      inProgress: uploadStartedFiles.length,
      totalSpeed: totalSpeed,
      totalETA: totalETA,
      files: state.files,
      resumableUploads: resumableUploads
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
