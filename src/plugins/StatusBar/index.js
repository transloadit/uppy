const Plugin = require('../Plugin')
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
    this.id = 'StatusBar'
    this.title = 'StatusBar'
    this.type = 'progressindicator'

    // set default options
    const defaultOptions = {
      target: 'body',
      showProgressDetails: false
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.pauseAll = this.pauseAll.bind(this)
    this.resumeAll = this.resumeAll.bind(this)
    this.retryAll = this.retryAll.bind(this)
    this.cancelAll = this.cancelAll.bind(this)
    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
  }

  cancelAll () {
    this.core.emit('core:cancel-all')
  }

  pauseAll () {
    this.core.emit('core:pause-all')
  }

  resumeAll () {
    this.core.emit('core:resume-all')
  }

  retryAll () {
    this.core.emit('core:retry-all')
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
      pauseAll: this.pauseAll,
      resumeAll: this.resumeAll,
      retryAll: this.retryAll,
      cancelAll: this.cancelAll,
      complete: completeFiles.length,
      inProgress: uploadStartedFiles.length,
      totalSpeed: totalSpeed,
      totalETA: totalETA,
      files: state.files,
      resumableUploads: resumableUploads
    })
  }

  install () {
    const target = this.opts.target
    const plugin = this
    if (target) {
      this.mount(target, plugin)
    }
  }

  uninstall () {
    this.unmount()
  }
}
