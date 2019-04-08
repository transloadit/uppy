const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const dragDrop = require('drag-drop')
const DashboardUI = require('./components/Dashboard')
const StatusBar = require('@uppy/status-bar')
const Informer = require('@uppy/informer')
const ThumbnailGenerator = require('@uppy/thumbnail-generator')
const findAllDOMElements = require('@uppy/utils/lib/findAllDOMElements')
const toArray = require('@uppy/utils/lib/toArray')
const cuid = require('cuid')
const ResizeObserver = require('resize-observer-polyfill').default || require('resize-observer-polyfill')
const { defaultPickerIcon } = require('./components/icons')

// Some code for managing focus was adopted from https://github.com/ghosh/micromodal
// MIT licence, https://github.com/ghosh/micromodal/blob/master/LICENSE.md
// Copyright (c) 2017 Indrashish Ghosh
const FOCUSABLE_ELEMENTS = [
  'a[href]:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  'area[href]:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  'input:not([disabled]):not([inert]):not([aria-hidden])',
  'select:not([disabled]):not([inert]):not([aria-hidden])',
  'textarea:not([disabled]):not([inert]):not([aria-hidden])',
  'button:not([disabled]):not([inert]):not([aria-hidden])',
  'iframe:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  'object:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  'embed:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  '[contenteditable]:not([tabindex^="-"]):not([inert]):not([aria-hidden])',
  '[tabindex]:not([tabindex^="-"]):not([inert]):not([aria-hidden])'
]

const TAB_KEY = 9
const ESC_KEY = 27

function createPromise () {
  const o = {}
  o.promise = new Promise((resolve, reject) => {
    o.resolve = resolve
    o.reject = reject
  })
  return o
}

/**
 * Dashboard UI with previews, metadata editing, tabs for various services and more
 */
module.exports = class Dashboard extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Dashboard'
    this.title = 'Dashboard'
    this.type = 'orchestrator'
    this.modalName = `uppy-Dashboard-${cuid()}`

    const defaultLocale = {
      strings: {
        selectToUpload: 'Select files to upload',
        closeModal: 'Close Modal',
        upload: 'Upload',
        importFrom: 'Import from %{name}',
        addingMoreFiles: 'Adding more files',
        addMoreFiles: 'Add more files',
        dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
        dashboardTitle: 'Uppy Dashboard',
        copyLinkToClipboardSuccess: 'Link copied to clipboard',
        copyLinkToClipboardFallback: 'Copy the URL below',
        copyLink: 'Copy link',
        link: 'Link',
        fileSource: 'File source: %{name}',
        done: 'Done',
        back: 'Back',
        name: 'Name',
        removeFile: 'Remove file',
        editFile: 'Edit file',
        editing: 'Editing %{file}',
        edit: 'Edit',
        finishEditingFile: 'Finish editing file',
        saveChanges: 'Save changes',
        cancel: 'Cancel',
        localDisk: 'Local Disk',
        myDevice: 'My Device',
        dropPasteImport: 'Drop files here, paste, %{browse} or import from',
        dropPaste: 'Drop files here, paste or %{browse}',
        browse: 'browse',
        fileProgress: 'File progress: upload speed and ETA',
        numberOfSelectedFiles: 'Number of selected files',
        uploadAllNewFiles: 'Upload all new files',
        emptyFolderAdded: 'No files were added from empty folder',
        uploadComplete: 'Upload complete',
        uploadPaused: 'Upload paused',
        resumeUpload: 'Resume upload',
        pauseUpload: 'Pause upload',
        retryUpload: 'Retry upload',
        cancelUpload: 'Cancel upload',
        xFilesSelected: {
          0: '%{smart_count} file selected',
          1: '%{smart_count} files selected'
        },
        uploadXFiles: {
          0: 'Upload %{smart_count} file',
          1: 'Upload %{smart_count} files'
        },
        uploadingXFiles: {
          0: 'Uploading %{smart_count} file',
          1: 'Uploading %{smart_count} files'
        },
        processingXFiles: {
          0: 'Processing %{smart_count} file',
          1: 'Processing %{smart_count} files'
        },
        uploadXNewFiles: {
          0: 'Upload +%{smart_count} file',
          1: 'Upload +%{smart_count} files'
        },
        folderAdded: {
          0: 'Added %{smart_count} file from %{folder}',
          1: 'Added %{smart_count} files from %{folder}'
        }
      }
    }

    // set default options
    const defaultOptions = {
      target: 'body',
      metaFields: [],
      trigger: '#uppy-select-files',
      inline: false,
      width: 750,
      height: 550,
      thumbnailWidth: 280,
      defaultPickerIcon,
      showLinkToFileUploadResult: true,
      showProgressDetails: false,
      hideUploadButton: false,
      hideRetryButton: false,
      hidePauseResumeCancelButtons: false,
      hideProgressAfterFinish: false,
      note: null,
      closeModalOnClickOutside: false,
      closeAfterFinish: false,
      disableStatusBar: false,
      disableInformer: false,
      disableThumbnailGenerator: false,
      disablePageScrollWhenModalOpen: true,
      animateOpenClose: true,
      proudlyDisplayPoweredByUppy: true,
      onRequestCloseModal: () => this.closeModal(),
      showSelectedFiles: true,
      browserBackButtonClose: false
    }

    // merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    // i18n
    this.translator = new Translator([ defaultLocale, this.uppy.locale, this.opts.locale ])
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)

    this.openModal = this.openModal.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.requestCloseModal = this.requestCloseModal.bind(this)
    this.isModalOpen = this.isModalOpen.bind(this)

    this.addTarget = this.addTarget.bind(this)
    this.removeTarget = this.removeTarget.bind(this)
    this.hideAllPanels = this.hideAllPanels.bind(this)
    this.showPanel = this.showPanel.bind(this)
    this.getFocusableNodes = this.getFocusableNodes.bind(this)
    this.setFocusToFirstNode = this.setFocusToFirstNode.bind(this)
    this.handlePopState = this.handlePopState.bind(this)
    this.maintainFocus = this.maintainFocus.bind(this)

    this.initEvents = this.initEvents.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleFileAdded = this.handleFileAdded.bind(this)
    this.handleComplete = this.handleComplete.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
    this.toggleFileCard = this.toggleFileCard.bind(this)
    this.toggleAddFilesPanel = this.toggleAddFilesPanel.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handlePaste = this.handlePaste.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
  }

  removeTarget (plugin) {
    const pluginState = this.getPluginState()
    // filter out the one we want to remove
    const newTargets = pluginState.targets.filter(target => target.id !== plugin.id)

    this.setPluginState({
      targets: newTargets
    })
  }

  addTarget (plugin) {
    const callerPluginId = plugin.id || plugin.constructor.name
    const callerPluginName = plugin.title || callerPluginId
    const callerPluginType = plugin.type

    if (callerPluginType !== 'acquirer' &&
        callerPluginType !== 'progressindicator' &&
        callerPluginType !== 'presenter') {
      let msg = 'Dashboard: Modal can only be used by plugins of types: acquirer, progressindicator, presenter'
      this.uppy.log(msg)
      return
    }

    const target = {
      id: callerPluginId,
      name: callerPluginName,
      type: callerPluginType
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
      activePickerPanel: false,
      showAddFilesPanel: false,
      activeOverlayType: null
    })
  }

  showPanel (id) {
    const { targets } = this.getPluginState()

    const activePickerPanel = targets.filter((target) => {
      return target.type === 'acquirer' && target.id === id
    })[0]

    this.setPluginState({
      activePickerPanel: activePickerPanel,
      activeOverlayType: 'PickerPanel'
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
    // if an overlay is open, we should trap focus inside the overlay
    const activeOverlayType = this.getPluginState().activeOverlayType
    if (activeOverlayType) {
      const activeOverlay = this.el.querySelector(`[data-uppy-panelType="${activeOverlayType}"]`)
      const nodes = activeOverlay.querySelectorAll(FOCUSABLE_ELEMENTS)
      return Object.keys(nodes).map((key) => nodes[key])
    }

    const nodes = this.el.querySelectorAll(FOCUSABLE_ELEMENTS)
    return Object.keys(nodes).map((key) => nodes[key])
  }

  setFocusToFirstNode () {
    const focusableNodes = this.getFocusableNodes()
    if (focusableNodes.length) focusableNodes[0].focus()
  }

  updateBrowserHistory () {
    // Ensure history state does not already contain our modal name to avoid double-pushing
    if (!history.state || !history.state[this.modalName]) {
      // Push to history so that the page is not lost on browser back button press
      history.pushState({
        ...history.state,
        [this.modalName]: true
      }, '')
    }

    // Listen for back button presses
    window.addEventListener('popstate', this.handlePopState, false)
  }

  handlePopState (event) {
    // Close the modal if the history state no longer contains our modal name
    if (this.isModalOpen() && (!event.state || !event.state[this.modalName])) {
      this.closeModal({ manualClose: false })
    }

    // When the browser back button is pressed and uppy is now the latest entry in the history but the modal is closed, fix the history by removing the uppy history entry
    // This occurs when another entry is added into the history state while the modal is open, and then the modal gets manually closed
    // Solves PR #575 (https://github.com/transloadit/uppy/pull/575)
    if (!this.isModalOpen() && event.state && event.state[this.modalName]) {
      history.go(-1)
    }
  }

  setFocusToBrowse () {
    const browseBtn = this.el.querySelector('.uppy-Dashboard-browse')
    if (browseBtn) browseBtn.focus()
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
    const { promise, resolve } = createPromise()
    // save scroll position
    this.savedScrollPosition = window.scrollY
    // save active element, so we can restore focus when modal is closed
    this.savedActiveElement = document.activeElement

    if (this.opts.disablePageScrollWhenModalOpen) {
      document.body.classList.add('uppy-Dashboard-isFixed')
    }

    if (this.opts.animateOpenClose && this.getPluginState().isClosing) {
      const handler = () => {
        this.setPluginState({
          isHidden: false
        })
        this.el.removeEventListener('animationend', handler, false)
        resolve()
      }
      this.el.addEventListener('animationend', handler, false)
    } else {
      this.setPluginState({
        isHidden: false
      })
      resolve()
    }

    if (this.opts.browserBackButtonClose) {
      this.updateBrowserHistory()
    }

    // handle ESC and TAB keys in modal dialog
    document.addEventListener('keydown', this.handleKeyDown)

    // this.rerender(this.uppy.getState())
    this.setFocusToBrowse()

    return promise
  }

  closeModal (opts = {}) {
    const {
      manualClose = true // Whether the modal is being closed by the user (`true`) or by other means (e.g. browser back button)
    } = opts

    const { isHidden, isClosing } = this.getPluginState()
    if (isHidden || isClosing) {
      // short-circuit if animation is ongoing
      return
    }

    const { promise, resolve } = createPromise()

    if (this.opts.disablePageScrollWhenModalOpen) {
      document.body.classList.remove('uppy-Dashboard-isFixed')
    }

    if (this.opts.animateOpenClose) {
      this.setPluginState({
        isClosing: true
      })
      const handler = () => {
        this.setPluginState({
          isHidden: true,
          isClosing: false
        })
        this.el.removeEventListener('animationend', handler, false)
        resolve()
      }
      this.el.addEventListener('animationend', handler, false)
    } else {
      this.setPluginState({
        isHidden: true
      })
      resolve()
    }

    // handle ESC and TAB keys in modal dialog
    document.removeEventListener('keydown', this.handleKeyDown)

    this.savedActiveElement.focus()

    if (manualClose) {
      if (this.opts.browserBackButtonClose) {
        // Make sure that the latest entry in the history state is our modal name
        if (history.state && history.state[this.modalName]) {
          // Go back in history to clear out the entry we created (ultimately closing the modal)
          history.go(-1)
        }
      }
    }

    return promise
  }

  isModalOpen () {
    return !this.getPluginState().isHidden || false
  }

  handleKeyDown (event) {
    // close modal on esc key press
    if (event.keyCode === ESC_KEY) this.requestCloseModal(event)
    // maintainFocus on tab key press
    if (event.keyCode === TAB_KEY) this.maintainFocus(event)
  }

  handleClickOutside () {
    if (this.opts.closeModalOnClickOutside) this.requestCloseModal()
  }

  handlePaste (ev) {
    const files = toArray(ev.clipboardData.items)
    files.forEach((file) => {
      if (file.kind !== 'file') return

      const blob = file.getAsFile()
      if (!blob) {
        this.uppy.log('[Dashboard] File pasted, but the file blob is empty')
        this.uppy.info('Error pasting file', 'error')
        return
      }
      this.uppy.log('[Dashboard] File pasted')
      try {
        this.uppy.addFile({
          source: this.id,
          name: file.name,
          type: file.type,
          data: blob
        })
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    })
  }

  handleInputChange (ev) {
    ev.preventDefault()
    const files = toArray(ev.target.files)

    files.forEach((file) => {
      try {
        this.uppy.addFile({
          source: this.id,
          name: file.name,
          type: file.type,
          data: file
        })
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    })
  }

  // _Why make insides of Dashboard invisible until first ResizeObserver event is emitted?
  //  ResizeOberserver doesn't emit the first resize event fast enough, users can see the jump from one .uppy-size-- to another (e.g. in Safari)
  // _Why not apply visibility property to .uppy-Dashboard-inner?
  //  Because ideally, acc to specs, ResizeObserver should see invisible elements as of width 0. So even though applying invisibility to .uppy-Dashboard-inner works now, it may not work in the future.
  startListeningToResize () {
    // Watch for Dashboard container (`.uppy-Dashboard-inner`) resize
    // and update containerWidth/containerHeight in plugin state accordingly.
    // Emits first event on initialization.
    this.resizeObserver = new ResizeObserver((entries, observer) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect

        this.uppy.log(`[Dashboard] resized: ${width} / ${height}`)

        this.setPluginState({
          containerWidth: width,
          containerHeight: height,
          areInsidesReadyToBeVisible: true
        })
      }
    })
    this.resizeObserver.observe(this.el.querySelector('.uppy-Dashboard-inner'))

    // If ResizeObserver fails to emit an event telling us what size to use - default to the mobile view
    this.makeDashboardInsidesVisibleAnywayTimeout = setTimeout(() => {
      const pluginState = this.getPluginState()
      if (!pluginState.areInsidesReadyToBeVisible) {
        this.uppy.log("[Dashboard] resize event didn't fire on time: defaulted to mobile layout")

        this.setPluginState({
          areInsidesReadyToBeVisible: true
        })
      }
    }, 1000)
  }

  stopListeningToResize () {
    this.resizeObserver.disconnect()

    clearTimeout(this.makeDashboardInsidesVisibleAnywayTimeout)
  }

  initEvents () {
    // Modal open button
    const showModalTrigger = findAllDOMElements(this.opts.trigger)
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.forEach(trigger => trigger.addEventListener('click', this.openModal))
    }

    if (!this.opts.inline && !showModalTrigger) {
      this.uppy.log('Dashboard modal trigger not found. Make sure `trigger` is set in Dashboard options unless you are planning to call openModal() method yourself', 'error')
    }

    // Drag Drop
    this.removeDragDropListener = dragDrop(this.el, (files) => {
      this.handleDrop(files)
    })

    this.startListeningToResize()

    this.uppy.on('plugin-remove', this.removeTarget)
    this.uppy.on('file-added', this.handleFileAdded)
    this.uppy.on('complete', this.handleComplete)
  }

  handleFileAdded () {
    this.hideAllPanels()
  }

  handleComplete ({ failed, uploadID }) {
    if (this.opts.closeAfterFinish && failed.length === 0) {
      // All uploads are done
      this.requestCloseModal()
    }
  }

  removeEvents () {
    const showModalTrigger = findAllDOMElements(this.opts.trigger)
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.forEach(trigger => trigger.removeEventListener('click', this.openModal))
    }

    this.stopListeningToResize()

    this.removeDragDropListener()
    // window.removeEventListener('resize', this.throttledUpdateDashboardElWidth)
    window.removeEventListener('popstate', this.handlePopState, false)
    this.uppy.off('plugin-remove', this.removeTarget)
    this.uppy.off('file-added', this.handleFileAdded)
    this.uppy.off('complete', this.handleComplete)
  }

  toggleFileCard (fileId) {
    this.setPluginState({
      fileCardFor: fileId || null,
      activeOverlayType: fileId ? 'FileCard' : null
    })
  }

  toggleAddFilesPanel (show) {
    this.setPluginState({
      showAddFilesPanel: show,
      activeOverlayType: show ? 'AddFiles' : null
    })
  }

  handleDrop (files) {
    this.uppy.log('[Dashboard] Files were dropped')

    files.forEach((file) => {
      try {
        this.uppy.addFile({
          source: this.id,
          name: file.name,
          type: file.type,
          data: file
        })
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    })
  }

  render (state) {
    const pluginState = this.getPluginState()
    const { files, capabilities, allowNewUpload } = state

    // TODO: move this to Core, to share between Status Bar and Dashboard
    // (and any other plugin that might need it, too)
    const newFiles = Object.keys(files).filter((file) => {
      return !files[file].progress.uploadStarted
    })

    const uploadStartedFiles = Object.keys(files).filter((file) => {
      return files[file].progress.uploadStarted
    })

    const pausedFiles = Object.keys(files).filter((file) => {
      return files[file].isPaused
    })

    const completeFiles = Object.keys(files).filter((file) => {
      return files[file].progress.uploadComplete
    })

    const erroredFiles = Object.keys(files).filter((file) => {
      return files[file].error
    })

    const inProgressFiles = Object.keys(files).filter((file) => {
      return !files[file].progress.uploadComplete &&
             files[file].progress.uploadStarted
    })

    const inProgressNotPausedFiles = inProgressFiles.filter((file) => {
      return !files[file].isPaused
    })

    const processingFiles = Object.keys(files).filter((file) => {
      return files[file].progress.preprocess || files[file].progress.postprocess
    })

    const isUploadStarted = uploadStartedFiles.length > 0

    const isAllComplete = state.totalProgress === 100 &&
      completeFiles.length === Object.keys(files).length &&
      processingFiles.length === 0

    const isAllErrored = isUploadStarted &&
      erroredFiles.length === uploadStartedFiles.length

    const isAllPaused = inProgressFiles.length !== 0 &&
      pausedFiles.length === inProgressFiles.length

    const attachRenderFunctionToTarget = (target) => {
      const plugin = this.uppy.getPlugin(target.id)
      return Object.assign({}, target, {
        icon: plugin.icon || this.opts.defaultPickerIcon,
        render: plugin.render
      })
    }

    const isSupported = (target) => {
      const plugin = this.uppy.getPlugin(target.id)
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
      this.uppy.upload().catch((err) => {
        // Log error.
        this.uppy.log(err.stack || err.message || err)
      })
    }

    const cancelUpload = (fileID) => {
      this.uppy.removeFile(fileID)
    }

    const saveFileCard = (meta, fileID) => {
      this.uppy.setFileMeta(fileID, meta)
      this.toggleFileCard()
    }

    return DashboardUI({
      state,
      isHidden: pluginState.isHidden,
      files,
      newFiles,
      uploadStartedFiles,
      completeFiles,
      erroredFiles,
      inProgressFiles,
      inProgressNotPausedFiles,
      processingFiles,
      isUploadStarted,
      isAllComplete,
      isAllErrored,
      isAllPaused,
      totalFileCount: Object.keys(files).length,
      totalProgress: state.totalProgress,
      allowNewUpload,
      acquirers,
      activePickerPanel: pluginState.activePickerPanel,
      animateOpenClose: this.opts.animateOpenClose,
      isClosing: pluginState.isClosing,
      getPlugin: this.uppy.getPlugin,
      progressindicators: progressindicators,
      autoProceed: this.uppy.opts.autoProceed,
      id: this.id,
      closeModal: this.requestCloseModal,
      handleClickOutside: this.handleClickOutside,
      handleInputChange: this.handleInputChange,
      handlePaste: this.handlePaste,
      inline: this.opts.inline,
      showPanel: this.showPanel,
      hideAllPanels: this.hideAllPanels,
      log: this.uppy.log,
      i18n: this.i18n,
      i18nArray: this.i18nArray,
      addFile: this.uppy.addFile,
      removeFile: this.uppy.removeFile,
      info: this.uppy.info,
      note: this.opts.note,
      metaFields: pluginState.metaFields,
      resumableUploads: capabilities.resumableUploads || false,
      bundled: capabilities.bundled || false,
      startUpload,
      pauseUpload: this.uppy.pauseResume,
      retryUpload: this.uppy.retryUpload,
      cancelUpload,
      cancelAll: this.uppy.cancelAll,
      fileCardFor: pluginState.fileCardFor,
      toggleFileCard: this.toggleFileCard,
      toggleAddFilesPanel: this.toggleAddFilesPanel,
      showAddFilesPanel: pluginState.showAddFilesPanel,
      saveFileCard,
      width: this.opts.width,
      height: this.opts.height,
      showLinkToFileUploadResult: this.opts.showLinkToFileUploadResult,
      proudlyDisplayPoweredByUppy: this.opts.proudlyDisplayPoweredByUppy,
      currentWidth: pluginState.containerWidth,
      isWide: pluginState.containerWidth > 400,
      containerWidth: pluginState.containerWidth,
      areInsidesReadyToBeVisible: pluginState.areInsidesReadyToBeVisible,
      isTargetDOMEl: this.isTargetDOMEl,
      parentElement: this.el,
      allowedFileTypes: this.uppy.opts.restrictions.allowedFileTypes,
      maxNumberOfFiles: this.uppy.opts.restrictions.maxNumberOfFiles,
      showSelectedFiles: this.opts.showSelectedFiles
    })
  }

  discoverProviderPlugins () {
    this.uppy.iteratePlugins((plugin) => {
      if (plugin && !plugin.target && plugin.opts && plugin.opts.target === this.constructor) {
        this.addTarget(plugin)
      }
    })
  }

  install () {
    // Set default state for Dashboard
    this.setPluginState({
      isHidden: true,
      fileCardFor: null,
      activeOverlayType: null,
      showAddFilesPanel: false,
      activePickerPanel: false,
      metaFields: this.opts.metaFields,
      targets: [],
      // We'll make them visible once .containerWidth is determined
      areInsidesReadyToBeVisible: false
    })

    const { inline, closeAfterFinish } = this.opts
    if (inline && closeAfterFinish) {
      throw new Error('[Dashboard] `closeAfterFinish: true` cannot be used on an inline Dashboard, because an inline Dashboard cannot be closed at all. Either set `inline: false`, or disable the `closeAfterFinish` option.')
    }

    const { allowMultipleUploads } = this.uppy.opts
    if (allowMultipleUploads && closeAfterFinish) {
      this.uppy.log('[Dashboard] When using `closeAfterFinish`, we recommended setting the `allowMultipleUploads` option to `false` in the Uppy constructor. See https://uppy.io/docs/uppy/#allowMultipleUploads-true', 'warning')
    }

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }

    const plugins = this.opts.plugins || []
    plugins.forEach((pluginID) => {
      const plugin = this.uppy.getPlugin(pluginID)
      if (plugin) {
        plugin.mount(this, plugin)
      }
    })

    if (!this.opts.disableStatusBar) {
      this.uppy.use(StatusBar, {
        id: `${this.id}:StatusBar`,
        target: this,
        hideUploadButton: this.opts.hideUploadButton,
        hideRetryButton: this.opts.hideRetryButton,
        hidePauseResumeButton: this.opts.hidePauseResumeButton,
        hideCancelButton: this.opts.hideCancelButton,
        showProgressDetails: this.opts.showProgressDetails,
        hideAfterFinish: this.opts.hideProgressAfterFinish,
        locale: this.opts.locale
      })
    }

    if (!this.opts.disableInformer) {
      this.uppy.use(Informer, {
        id: `${this.id}:Informer`,
        target: this
      })
    }

    if (!this.opts.disableThumbnailGenerator) {
      this.uppy.use(ThumbnailGenerator, {
        id: `${this.id}:ThumbnailGenerator`,
        thumbnailWidth: this.opts.thumbnailWidth
      })
    }

    this.discoverProviderPlugins()

    this.initEvents()
  }

  uninstall () {
    if (!this.opts.disableInformer) {
      const informer = this.uppy.getPlugin(`${this.id}:Informer`)
      // Checking if this plugin exists, in case it was removed by uppy-core
      // before the Dashboard was.
      if (informer) this.uppy.removePlugin(informer)
    }

    if (!this.opts.disableStatusBar) {
      const statusBar = this.uppy.getPlugin(`${this.id}:StatusBar`)
      if (statusBar) this.uppy.removePlugin(statusBar)
    }

    if (!this.opts.disableThumbnailGenerator) {
      const thumbnail = this.uppy.getPlugin(`${this.id}:ThumbnailGenerator`)
      if (thumbnail) this.uppy.removePlugin(thumbnail)
    }

    const plugins = this.opts.plugins || []
    plugins.forEach((pluginID) => {
      const plugin = this.uppy.getPlugin(pluginID)
      if (plugin) plugin.unmount()
    })

    this.unmount()
    this.removeEvents()
  }
}
