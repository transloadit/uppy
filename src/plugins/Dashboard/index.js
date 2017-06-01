const Plugin = require('../Plugin')
const Translator = require('../../core/Translator')
const dragDrop = require('drag-drop')
const Dashboard = require('./Dashboard')
const { getSpeed } = require('../../core/Utils')
const { getBytesRemaining } = require('../../core/Utils')
const { prettyETA } = require('../../core/Utils')
const { findDOMElement } = require('../../core/Utils')
const prettyBytes = require('prettier-bytes')
const { defaultTabIcon } = require('./icons')

/**
 * Modal Dialog & Dashboard
 */
module.exports = class DashboardUI extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'DashboardUI'
    this.title = 'Dashboard UI'
    this.type = 'orchestrator'

    const defaultLocale = {
      strings: {
        selectToUpload: 'Select files to upload',
        closeModal: 'Close Modal',
        upload: 'Upload',
        importFrom: 'Import files from',
        dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
        dashboardTitle: 'Uppy Dashboard',
        copyLinkToClipboardSuccess: 'Link copied to clipboard.',
        copyLinkToClipboardFallback: 'Copy the URL below',
        done: 'Done',
        localDisk: 'Local Disk',
        dropPasteImport: 'Drop files here, paste, import from one of the locations above or',
        dropPaste: 'Drop files here, paste or',
        browse: 'browse',
        fileProgress: 'File progress: upload speed and ETA',
        numberOfSelectedFiles: 'Number of selected files',
        uploadAllNewFiles: 'Upload all new files'
      }
    }

    // set default options
    const defaultOptions = {
      target: 'body',
      inline: false,
      width: 750,
      height: 550,
      semiTransparent: false,
      defaultTabIcon: defaultTabIcon(),
      showProgressDetails: false,
      locale: defaultLocale
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    this.translator = new Translator({locale: this.locale})
    this.containerWidth = this.translator.translate.bind(this.translator)

    this.hideModal = this.hideModal.bind(this)
    this.showModal = this.showModal.bind(this)

    this.addTarget = this.addTarget.bind(this)
    this.actions = this.actions.bind(this)
    this.hideAllPanels = this.hideAllPanels.bind(this)
    this.showPanel = this.showPanel.bind(this)
    this.initEvents = this.initEvents.bind(this)
    this.handleEscapeKeyPress = this.handleEscapeKeyPress.bind(this)
    this.handleFileCard = this.handleFileCard.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.pauseAll = this.pauseAll.bind(this)
    this.resumeAll = this.resumeAll.bind(this)
    this.cancelAll = this.cancelAll.bind(this)
    this.updateDashboardElWidth = this.updateDashboardElWidth.bind(this)
    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
  }

  addTarget (plugin) {
    const callerPluginId = plugin.id || plugin.constructor.name
    const callerPluginName = plugin.title || callerPluginId
    const callerPluginIcon = plugin.icon || this.opts.defaultTabIcon
    const callerPluginType = plugin.type

    if (callerPluginType !== 'acquirer' &&
        callerPluginType !== 'progressindicator' &&
        callerPluginType !== 'presenter') {
      let msg = 'Error: Modal can only be used by plugins of types: acquirer, progressindicator, presenter'
      this.core.log(msg)
      return
    }

    const target = {
      id: callerPluginId,
      name: callerPluginName,
      icon: callerPluginIcon,
      type: callerPluginType,
      focus: plugin.focus,
      render: plugin.render,
      isHidden: true
    }

    const modal = this.core.getState().modal
    const newTargets = modal.targets.slice()
    newTargets.push(target)

    this.core.setState({
      modal: Object.assign({}, modal, {
        targets: newTargets
      })
    })

    return this.target
  }

  hideAllPanels () {
    const modal = this.core.getState().modal

    this.core.setState({modal: Object.assign({}, modal, {
      activePanel: false
    })})
  }

  showPanel (id) {
    const modal = this.core.getState().modal

    const activePanel = modal.targets.filter((target) => {
      return target.type === 'acquirer' && target.id === id
    })[0]

    this.core.setState({modal: Object.assign({}, modal, {
      activePanel: activePanel
    })})
  }

  hideModal () {
    const modal = this.core.getState().modal

    this.core.setState({
      modal: Object.assign({}, modal, {
        isHidden: true
      })
    })

    document.body.classList.remove('is-UppyDashboard-open')
  }

  showModal () {
    const modal = this.core.getState().modal

    this.core.setState({
      modal: Object.assign({}, modal, {
        isHidden: false
      })
    })

    // add class to body that sets position fixed
    document.body.classList.add('is-UppyDashboard-open')
    // focus on modal inner block
    this.target.querySelector('.UppyDashboard-inner').focus()

    this.updateDashboardElWidth()
    // to be sure, sometimes when the function runs, container size is still 0
    setTimeout(this.updateDashboardElWidth, 300)
  }

  // Close the Modal on esc key press
  handleEscapeKeyPress (event) {
    if (event.keyCode === 27) {
      this.hideModal()
    }
  }

  initEvents () {
    // const dashboardEl = this.target.querySelector(`${this.opts.target} .UppyDashboard`)

    // Modal open button
    const showModalTrigger = findDOMElement(this.opts.trigger)
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.addEventListener('click', this.showModal)
    } else {
      this.core.log('Modal trigger wasn’t found')
    }

    document.body.addEventListener('keyup', this.handleEscapeKeyPress)

    // Drag Drop
    this.removeDragDropListener = dragDrop(this.el, (files) => {
      this.handleDrop(files)
    })
  }

  removeEvents () {
    const showModalTrigger = findDOMElement(this.opts.trigger)
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.removeEventListener('click', this.showModal)
    }

    this.removeDragDropListener()
    document.body.removeEventListener('keyup', this.handleEscapeKeyPress)
  }

  actions () {
    const bus = this.core.bus

    bus.on('core:file-add', this.hideAllPanels)
    bus.on('dashboard:file-card', this.handleFileCard)

    window.addEventListener('resize', this.updateDashboardElWidth)

    // bus.on('core:success', (uploadedCount) => {
    //   bus.emit(
    //     'informer',
    //     `${this.core.i18n('files', {'smart_count': uploadedCount})} successfully uploaded, Sir!`,
    //     'info',
    //     6000
    //   )
    // })
  }

  removeActions () {
    const bus = this.core.bus

    window.removeEventListener('resize', this.updateDashboardElWidth)

    bus.off('core:file-add', this.hideAllPanels)
    bus.off('dashboard:file-card', this.handleFileCard)
  }

  updateDashboardElWidth () {
    const dashboardEl = this.target.querySelector('.UppyDashboard-inner')
    // const containerWidth = dashboardEl.offsetWidth
    // console.log(containerWidth)

    const modal = this.core.getState().modal
    this.core.setState({
      modal: Object.assign({}, modal, {
        containerWidth: dashboardEl.offsetWidth
      })
    })
  }

  handleFileCard (fileId) {
    const modal = this.core.getState().modal

    this.core.setState({
      modal: Object.assign({}, modal, {
        fileCardFor: fileId || false
      })
    })
  }

  handleDrop (files) {
    this.core.log('All right, someone dropped something...')

    files.forEach((file) => {
      this.core.bus.emit('core:file-add', {
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  cancelAll () {
    this.core.bus.emit('core:cancel-all')
  }

  pauseAll () {
    this.core.bus.emit('core:pause-all')
  }

  resumeAll () {
    this.core.bus.emit('core:resume-all')
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

    const newFiles = Object.keys(files).filter((file) => {
      return !files[file].progress.uploadStarted
    })
    const uploadStartedFiles = Object.keys(files).filter((file) => {
      return files[file].progress.uploadStarted
    })
    const completeFiles = Object.keys(files).filter((file) => {
      return files[file].progress.uploadComplete
    })
    const inProgressFiles = Object.keys(files).filter((file) => {
      return !files[file].progress.uploadComplete &&
             files[file].progress.uploadStarted &&
             !files[file].isPaused
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

    const isAllComplete = state.totalProgress === 100
    const isAllPaused = inProgressFiles.length === 0 && !isAllComplete && uploadStartedFiles.length > 0
    const isUploadStarted = uploadStartedFiles.length > 0

    const acquirers = state.modal.targets.filter((target) => {
      return target.type === 'acquirer'
    })

    const progressindicators = state.modal.targets.filter((target) => {
      return target.type === 'progressindicator'
    })

    const addFile = (file) => {
      this.core.emitter.emit('core:file-add', file)
    }

    const removeFile = (fileID) => {
      this.core.emitter.emit('core:file-remove', fileID)
    }

    const startUpload = (ev) => {
      this.core.upload().catch((err) => {
        // Log error.
        console.error(err.stack || err.message)
      })
    }

    const pauseUpload = (fileID) => {
      this.core.emitter.emit('core:upload-pause', fileID)
    }

    const cancelUpload = (fileID) => {
      this.core.emitter.emit('core:upload-cancel', fileID)
      this.core.emitter.emit('core:file-remove', fileID)
    }

    const showFileCard = (fileID) => {
      this.core.emitter.emit('dashboard:file-card', fileID)
    }

    const fileCardDone = (meta, fileID) => {
      this.core.emitter.emit('core:update-meta', meta, fileID)
      this.core.emitter.emit('dashboard:file-card')
    }

    const info = (text, type, duration) => {
      this.core.emitter.emit('informer', text, type, duration)
    }

    const resumableUploads = this.core.getState().capabilities.resumableUploads || false

    return Dashboard({
      state: state,
      modal: state.modal,
      newFiles: newFiles,
      files: files,
      totalFileCount: Object.keys(files).length,
      isUploadStarted: isUploadStarted,
      inProgress: uploadStartedFiles.length,
      completeFiles: completeFiles,
      inProgressFiles: inProgressFiles,
      totalSpeed: totalSpeed,
      totalETA: totalETA,
      totalProgress: state.totalProgress,
      totalSize: totalSize,
      totalUploadedSize: totalUploadedSize,
      isAllComplete: isAllComplete,
      isAllPaused: isAllPaused,
      acquirers: acquirers,
      activePanel: state.modal.activePanel,
      progressindicators: progressindicators,
      autoProceed: this.core.opts.autoProceed,
      id: this.id,
      hideModal: this.hideModal,
      showProgressDetails: this.opts.showProgressDetails,
      inline: this.opts.inline,
      semiTransparent: this.opts.semiTransparent,
      onPaste: this.handlePaste,
      showPanel: this.showPanel,
      hideAllPanels: this.hideAllPanels,
      log: this.core.log,
      bus: this.core.emitter,
      i18n: this.containerWidth,
      pauseAll: this.pauseAll,
      resumeAll: this.resumeAll,
      cancelAll: this.cancelAll,
      addFile: addFile,
      removeFile: removeFile,
      info: info,
      metaFields: state.metaFields,
      resumableUploads: resumableUploads,
      startUpload: startUpload,
      pauseUpload: pauseUpload,
      cancelUpload: cancelUpload,
      fileCardFor: state.modal.fileCardFor,
      showFileCard: showFileCard,
      fileCardDone: fileCardDone,
      updateDashboardElWidth: this.updateDashboardElWidth,
      maxWidth: this.opts.maxWidth,
      maxHeight: this.opts.maxHeight,
      currentWidth: state.modal.containerWidth,
      isWide: state.modal.containerWidth > 400
    })
  }

  install () {
    // Set default state for Modal
    this.core.setState({modal: {
      isHidden: true,
      showFileCard: false,
      activePanel: false,
      targets: []
    }})

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    this.initEvents()
    this.actions()
  }

  uninstall () {
    this.unmount()
    this.removeActions()
    this.removeEvents()
  }
}
