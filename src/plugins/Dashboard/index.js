const Plugin = require('../Plugin')
const Translator = require('../../core/Translator')
const dragDrop = require('drag-drop')
const Dashboard = require('./Dashboard')
const StatusBar = require('../StatusBar')
const Informer = require('../Informer')
const { findAllDOMElements } = require('../../core/Utils')
const prettyBytes = require('prettier-bytes')
const { defaultTabIcon } = require('./icons')

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex^="-"])'
]

/**
 * Dashboard UI with previews, metadata editing, tabs for various services and more
 */
module.exports = class DashboardUI extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = this.opts.id || 'Dashboard'
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
        uploadAllNewFiles: 'Upload all new files',
        emptyFolderAdded: 'No files were added from empty folder',
        folderAdded: {
          0: 'Added %{smart_count} file from %{folder}',
          1: 'Added %{smart_count} files from %{folder}'
        }
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
      note: null,
      closeModalOnClickOutside: false,
      locale: defaultLocale,
      onRequestCloseModal: () => this.closeModal()
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

    this.closeModal = this.closeModal.bind(this)
    this.requestCloseModal = this.requestCloseModal.bind(this)
    this.openModal = this.openModal.bind(this)
    this.isModalOpen = this.isModalOpen.bind(this)

    this.addTarget = this.addTarget.bind(this)
    this.actions = this.actions.bind(this)
    this.hideAllPanels = this.hideAllPanels.bind(this)
    this.showPanel = this.showPanel.bind(this)
    this.getFocusableNodes = this.getFocusableNodes.bind(this)
    this.setFocusToFirstNode = this.setFocusToFirstNode.bind(this)
    this.maintainFocus = this.maintainFocus.bind(this)

    this.initEvents = this.initEvents.bind(this)
    this.onKeydown = this.onKeydown.bind(this)
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
      type: callerPluginType,
      isHidden: true
    }

    const state = this.getPluginState()
    const newTargets = state.targets.slice()
    newTargets.push(target)

    this.setPluginState({
      targets: newTargets
    })

    return this.el
  }

  hideAllPanels () {
    this.setPluginState({
      activePanel: false
    })
  }

  showPanel (id) {
    const { targets } = this.getPluginState()

    const activePanel = targets.filter((target) => {
      return target.type === 'acquirer' && target.id === id
    })[0]

    this.setPluginState({
      activePanel: activePanel
    })
  }

  requestCloseModal () {
    if (this.opts.onRequestCloseModal) {
      return this.opts.onRequestCloseModal()
    } else {
      this.closeModal()
    }
  }

  getFocusableNodes () {
    const nodes = this.el.querySelectorAll(FOCUSABLE_ELEMENTS)
    return Object.keys(nodes).map((key) => nodes[key])
  }

  setFocusToFirstNode () {
    const focusableNodes = this.getFocusableNodes()
    // console.log(focusableNodes)
    // console.log(focusableNodes[0])
    if (focusableNodes.length) focusableNodes[0].focus()
  }

  maintainFocus (event) {
    var focusableNodes = this.getFocusableNodes()
    var focusedItemIndex = focusableNodes.indexOf(document.activeElement)

    if (event.shiftKey && focusedItemIndex === 0) {
      focusableNodes[focusableNodes.length - 1].focus()
      event.preventDefault()
    }

    if (!event.shiftKey && focusedItemIndex === focusableNodes.length - 1) {
      focusableNodes[0].focus()
      event.preventDefault()
    }
  }

  openModal () {
    this.setPluginState({
      isHidden: false
    })

    // save scroll position
    this.savedDocumentScrollPosition = window.scrollY

    // add class to body that sets position fixed, move everything back
    // to scroll position
    document.body.classList.add('is-UppyDashboard-open')
    document.body.style.top = `-${this.savedDocumentScrollPosition}px`

    // timeout is needed because yo-yo/morphdom/nanoraf; not needed without nanoraf
    setTimeout(this.setFocusToFirstNode, 4)
    setTimeout(this.updateDashboardElWidth, 4)
  }

  closeModal () {
    this.setPluginState({
      isHidden: true
    })

    document.body.classList.remove('is-UppyDashboard-open')

    window.scrollTo(0, this.savedDocumentScrollPosition)
  }

  isModalOpen () {
    return !this.getPluginState().isHidden || false
  }

  onKeydown (event) {
    // close modal on esc key press
    if (event.keyCode === 27) this.requestCloseModal(event)
    // maintainFocus on tab key press
    if (event.keyCode === 9) this.maintainFocus(event)
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

    if (!this.opts.inline) {
      document.addEventListener('keydown', this.onKeydown)
    }

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

    if (!this.opts.inline) {
      document.removeEventListener('keydown', this.onKeydown)
    }
  }

  actions () {
    this.core.on('dashboard:file-card', this.handleFileCard)

    window.addEventListener('resize', this.updateDashboardElWidth)
  }

  removeActions () {
    this.core.off('dashboard:file-card', this.handleFileCard)

    window.removeEventListener('resize', this.updateDashboardElWidth)
  }

  updateDashboardElWidth () {
    const dashboardEl = this.el.querySelector('.UppyDashboard-inner')
    this.core.log(`Dashboard width: ${dashboardEl.offsetWidth}`)

    this.setPluginState({
      containerWidth: dashboardEl.offsetWidth
    })
  }

  handleFileCard (fileId) {
    this.setPluginState({
      fileCardFor: fileId || false
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
    const pluginState = this.getPluginState()
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

    const attachRenderFunctionToTarget = (target) => {
      const plugin = this.core.getPlugin(target.id)
      return Object.assign({}, target, {
        icon: plugin.icon || this.opts.defaultTabIcon,
        render: plugin.render
      })
    }

    const isSupported = (target) => {
      const plugin = this.core.getPlugin(target.id)
      // If the plugin does not provide a `supported` check, assume the plugin works everywhere.
      if (typeof plugin.isSupported !== 'function') {
        return true
      }
      return plugin.isSupported()
    }

    const acquirers = pluginState.targets
      .filter(target => target.type === 'acquirer' && isSupported(target))
      .map(attachRenderFunctionToTarget)

    const progressindicators = pluginState.targets
      .filter(target => target.type === 'progressindicator')
      .map(attachRenderFunctionToTarget)

    const startUpload = (ev) => {
      this.core.upload().catch((err) => {
        // Log error.
        this.core.log(err.stack || err.message || err)
      })
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
      modal: pluginState,
      newFiles: newFiles,
      files: files,
      totalFileCount: Object.keys(files).length,
      totalProgress: state.totalProgress,
      acquirers: acquirers,
      activePanel: pluginState.activePanel,
      getPlugin: this.core.getPlugin,
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
      i18n: this.i18n,
      pauseAll: this.pauseAll,
      resumeAll: this.resumeAll,
      addFile: this.core.addFile,
      removeFile: this.core.removeFile,
      info: this.core.info,
      note: this.opts.note,
      metaFields: state.metaFields,
      resumableUploads: this.core.state.capabilities.resumableUploads || false,
      startUpload: startUpload,
      pauseUpload: this.core.pauseResume,
      retryUpload: this.core.retryUpload,
      cancelUpload: cancelUpload,
      fileCardFor: pluginState.fileCardFor,
      showFileCard: showFileCard,
      fileCardDone: fileCardDone,
      updateDashboardElWidth: this.updateDashboardElWidth,
      maxWidth: this.opts.maxWidth,
      maxHeight: this.opts.maxHeight,
      currentWidth: pluginState.containerWidth,
      isWide: pluginState.containerWidth > 400
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
    this.setPluginState({
      isHidden: true,
      showFileCard: false,
      activePanel: false,
      targets: []
    })

    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }

    const plugins = this.opts.plugins || []
    plugins.forEach((pluginID) => {
      const plugin = this.core.getPlugin(pluginID)
      if (plugin) plugin.mount(this, plugin)
    })

    if (!this.opts.disableStatusBar) {
      this.core.use(StatusBar, {
        target: this,
        hideUploadButton: this.opts.hideUploadButton
      })
    }

    if (!this.opts.disableInformer) {
      this.core.use(Informer, {
        target: this
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
      const statusBar = this.core.getPlugin('StatusBar')
      // Checking if this plugin exists, in case it was removed by uppy-core
      // before the Dashboard was.
      if (statusBar) this.core.removePlugin(statusBar)
    }

    const plugins = this.opts.plugins || []
    plugins.forEach((pluginID) => {
      const plugin = this.core.getPlugin(pluginID)
      if (plugin) plugin.unmount()
    })

    this.unmount()
    this.removeActions()
    this.removeEvents()
  }
}
