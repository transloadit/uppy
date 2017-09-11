const Plugin = require('../Plugin')
const Translator = require('../../core/Translator')
const dragDrop = require('drag-drop')
const Dashboard = require('./Dashboard')
const StatusBar = require('../StatusBar')
const Informer = require('../Informer')
const { findAllDOMElements } = require('../../core/Utils')
const prettyBytes = require('prettier-bytes')
const { defaultTabIcon } = require('./icons')

/**
 * Modal Dialog & Dashboard
 */
module.exports = class DashboardUI extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'Dashboard'
    this.title = 'Dashboard'
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
        fileSource: 'File source',
        done: 'Done',
        localDisk: 'Local Disk',
        myDevice: 'My Device',
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
      getMetaFromForm: true,
      trigger: '#uppy-select-files',
      inline: false,
      width: 750,
      height: 550,
      semiTransparent: false,
      defaultTabIcon: defaultTabIcon(),
      showProgressDetails: false,
      hideUploadButton: false,
      note: false,
      closeModalOnClickOutside: false,
      locale: defaultLocale,
      onRequestCloseModal: () => this.closeModal()
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    this.translator = new Translator({locale: this.locale})
    this.containerWidth = this.translator.translate.bind(this.translator)

    this.closeModal = this.closeModal.bind(this)
    this.requestCloseModal = this.requestCloseModal.bind(this)
    this.openModal = this.openModal.bind(this)
    this.isModalOpen = this.isModalOpen.bind(this)

    this.addTarget = this.addTarget.bind(this)
    this.actions = this.actions.bind(this)
    this.hideAllPanels = this.hideAllPanels.bind(this)
    this.showPanel = this.showPanel.bind(this)
    this.initEvents = this.initEvents.bind(this)
    this.handleEscapeKeyPress = this.handleEscapeKeyPress.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
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
      let msg = 'Dashboard: Modal can only be used by plugins of types: acquirer, progressindicator, presenter'
      this.core.log(msg)
      return
    }

    const target = {
      id: callerPluginId,
      name: callerPluginName,
      icon: callerPluginIcon,
      type: callerPluginType,
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

  requestCloseModal () {
    if (this.opts.onRequestCloseModal) {
      return this.opts.onRequestCloseModal()
    } else {
      this.closeModal()
    }
  }

  openModal () {
    const modal = this.core.getState().modal

    this.core.setState({
      modal: Object.assign({}, modal, {
        isHidden: false
      })
    })

    // save scroll position
    this.savedDocumentScrollPosition = window.scrollY

    // add class to body that sets position fixed, move everything back
    // to scroll position
    document.body.classList.add('is-UppyDashboard-open')
    document.body.style.top = `-${this.savedDocumentScrollPosition}px`

    // focus on modal inner block
    this.target.querySelector('.UppyDashboard-inner').focus()

    // this.updateDashboardElWidth()
    // to be sure, sometimes when the function runs, container size is still 0
    setTimeout(this.updateDashboardElWidth, 500)
  }

  closeModal () {
    const modal = this.core.getState().modal

    this.core.setState({
      modal: Object.assign({}, modal, {
        isHidden: true
      })
    })

    document.body.classList.remove('is-UppyDashboard-open')

    window.scrollTo(0, this.savedDocumentScrollPosition)
  }

  isModalOpen () {
    return !this.core.getState().modal.isHidden || false
  }

  // Close the Modal on esc key press
  handleEscapeKeyPress (event) {
    if (event.keyCode === 27) {
      this.requestCloseModal()
    }
  }

  handleClickOutside () {
    if (this.opts.closeModalOnClickOutside) this.requestCloseModal()
  }

  initEvents () {
    // Modal open button
    const showModalTrigger = findAllDOMElements(this.opts.trigger)
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.forEach(trigger => trigger.addEventListener('click', this.openModal))
    }

    if (!this.opts.inline && !showModalTrigger) {
      this.core.log('Dashboard modal trigger not found, you won’t be able to select files. Make sure `trigger` is set correctly in Dashboard options', 'error')
    }

    document.body.addEventListener('keyup', this.handleEscapeKeyPress)

    // Drag Drop
    this.removeDragDropListener = dragDrop(this.el, (files) => {
      this.handleDrop(files)
    })
  }

  removeEvents () {
    const showModalTrigger = findAllDOMElements(this.opts.trigger)
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.forEach(trigger => trigger.removeEventListener('click', this.openModal))
    }

    this.removeDragDropListener()
    document.body.removeEventListener('keyup', this.handleEscapeKeyPress)
  }

  actions () {
    this.core.on('core:file-added', this.hideAllPanels)
    this.core.on('dashboard:file-card', this.handleFileCard)

    window.addEventListener('resize', this.updateDashboardElWidth)
  }

  removeActions () {
    window.removeEventListener('resize', this.updateDashboardElWidth)

    this.core.off('core:file-added', this.hideAllPanels)
    this.core.off('dashboard:file-card', this.handleFileCard)
  }

  updateDashboardElWidth () {
    const dashboardEl = this.target.querySelector('.UppyDashboard-inner')
    this.core.log(`Dashboard width: ${dashboardEl.offsetWidth}`)

    const modal = this.core.getState().modal
    this.core.setState({
      modal: Object.assign({}, modal, {
        containerWidth: dashboardEl.offsetWidth
      })
    })
  }

  handleFileCard (fileId) {
    const modal = this.core.state.modal

    this.core.setState({
      modal: Object.assign({}, modal, {
        fileCardFor: fileId || false
      })
    })
  }

  handleDrop (files) {
    this.core.log('[Dashboard] Files were dropped')

    files.forEach((file) => {
      this.core.addFile({
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
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

  render (state) {
    const files = state.files

    const newFiles = Object.keys(files).filter((file) => {
      return !files[file].progress.uploadStarted
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

    let totalSize = 0
    let totalUploadedSize = 0
    inProgressFilesArray.forEach((file) => {
      totalSize = totalSize + (file.progress.bytesTotal || 0)
      totalUploadedSize = totalUploadedSize + (file.progress.bytesUploaded || 0)
    })
    totalSize = prettyBytes(totalSize)
    totalUploadedSize = prettyBytes(totalUploadedSize)

    const acquirers = state.modal.targets.filter((target) => {
      return target.type === 'acquirer'
    })

    const progressindicators = state.modal.targets.filter((target) => {
      return target.type === 'progressindicator'
    })

    const startUpload = (ev) => {
      this.core.upload().catch((err) => {
        // Log error.
        this.core.log(err.stack || err.message || err)
      })
    }

    const pauseUpload = (fileID) => {
      this.core.emit('core:upload-pause', fileID)
    }

    const cancelUpload = (fileID) => {
      this.core.emit('core:upload-cancel', fileID)
      this.core.emit('core:file-remove', fileID)
    }

    const showFileCard = (fileID) => {
      this.core.emit('dashboard:file-card', fileID)
    }

    const fileCardDone = (meta, fileID) => {
      this.core.emit('core:update-meta', meta, fileID)
      this.core.emit('dashboard:file-card')
    }

    return Dashboard({
      state: state,
      modal: state.modal,
      newFiles: newFiles,
      files: files,
      totalFileCount: Object.keys(files).length,
      totalProgress: state.totalProgress,
      acquirers: acquirers,
      activePanel: state.modal.activePanel,
      progressindicators: progressindicators,
      autoProceed: this.core.opts.autoProceed,
      hideUploadButton: this.opts.hideUploadButton,
      id: this.id,
      closeModal: this.requestCloseModal,
      handleClickOutside: this.handleClickOutside,
      showProgressDetails: this.opts.showProgressDetails,
      inline: this.opts.inline,
      semiTransparent: this.opts.semiTransparent,
      showPanel: this.showPanel,
      hideAllPanels: this.hideAllPanels,
      log: this.core.log,
      i18n: this.containerWidth,
      pauseAll: this.pauseAll,
      resumeAll: this.resumeAll,
      addFile: this.core.addFile,
      removeFile: this.core.removeFile,
      info: this.core.info,
      note: this.opts.note,
      metaFields: state.metaFields,
      resumableUploads: this.core.state.capabilities.resumableUploads || false,
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

  discoverProviderPlugins () {
    this.core.iteratePlugins((plugin) => {
      if (plugin && !plugin.target && plugin.opts && plugin.opts.target === this.constructor) {
        this.addTarget(plugin)
      }
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

    if (target) {
      this.mount(target, this)
    }

    if (!this.opts.disableStatusBar) {
      this.core.use(StatusBar, {
        target: this.constructor
      })
    }

    if (!this.opts.disableInformer) {
      this.core.use(Informer, {
        target: this.constructor
      })
    }

    this.discoverProviderPlugins()

    this.initEvents()
    this.actions()
  }

  uninstall () {
    if (!this.opts.disableInformer) {
      const informer = this.core.getPlugin('Informer')
      if (informer) this.core.removePlugin(informer)
    }

    if (!this.opts.disableStatusBar) {
      const statusBar = this.core.getPlugin('StatusBarUI')
      // Checking if this plugin exists, in case it was removed by uppy-core
      // before the Dashboard was.
      if (statusBar) this.core.removePlugin(statusBar)
    }

    this.unmount()
    this.removeActions()
    this.removeEvents()
  }
}
