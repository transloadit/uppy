const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const DashboardUI = require('./components/Dashboard')
const StatusBar = require('@uppy/status-bar')
const Informer = require('@uppy/informer')
const ThumbnailGenerator = require('@uppy/thumbnail-generator')
const findAllDOMElements = require('@uppy/utils/lib/findAllDOMElements')
const toArray = require('@uppy/utils/lib/toArray')
const getDroppedFiles = require('@uppy/utils/lib/getDroppedFiles')
const trapFocus = require('./utils/trapFocus')
const cuid = require('cuid')
const ResizeObserver = require('resize-observer-polyfill').default || require('resize-observer-polyfill')
const { defaultPickerIcon } = require('./components/icons')
const createSuperFocus = require('./utils/createSuperFocus')
const memoize = require('memoize-one').default || require('memoize-one')

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
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Dashboard'
    this.title = 'Dashboard'
    this.type = 'orchestrator'
    this.modalName = `uppy-Dashboard-${cuid()}`

    this.defaultLocale = {
      strings: {
        closeModal: 'Close Modal',
        importFrom: 'Import from %{name}',
        addingMoreFiles: 'Adding more files',
        addMoreFiles: 'Add more files',
        dashboardWindowTitle: 'File Uploader Window (Press escape to close)',
        dashboardTitle: 'File Uploader',
        copyLinkToClipboardSuccess: 'Link copied to clipboard',
        copyLinkToClipboardFallback: 'Copy the URL below',
        copyLink: 'Copy link',
        link: 'Link',
        fileSource: 'File source: %{name}',
        done: 'Done',
        back: 'Back',
        addMore: 'Add more',
        removeFile: 'Remove file',
        editFile: 'Edit file',
        editing: 'Editing %{file}',
        edit: 'Edit',
        finishEditingFile: 'Finish editing file',
        saveChanges: 'Save changes',
        cancel: 'Cancel',
        myDevice: 'My Device',
        dropPasteImport: 'Drop files here, paste, %{browse} or import from',
        dropPaste: 'Drop files here, paste or %{browse}',
        dropHint: 'Drop your files here',
        browse: 'browse',
        uploadComplete: 'Upload complete',
        uploadPaused: 'Upload paused',
        resumeUpload: 'Resume upload',
        pauseUpload: 'Pause upload',
        retryUpload: 'Retry upload',
        cancelUpload: 'Cancel upload',
        xFilesSelected: {
          0: '%{smart_count} file selected',
          1: '%{smart_count} files selected',
          2: '%{smart_count} files selected'
        },
        uploadingXFiles: {
          0: 'Uploading %{smart_count} file',
          1: 'Uploading %{smart_count} files',
          2: 'Uploading %{smart_count} files'
        },
        processingXFiles: {
          0: 'Processing %{smart_count} file',
          1: 'Processing %{smart_count} files',
          2: 'Processing %{smart_count} files'
        },
        poweredBy: 'Powered by'
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
      waitForThumbnailsBeforeUpload: false,
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

    this.i18nInit()

    this.openModal = this.openModal.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.requestCloseModal = this.requestCloseModal.bind(this)
    this.isModalOpen = this.isModalOpen.bind(this)

    this.addTarget = this.addTarget.bind(this)
    this.removeTarget = this.removeTarget.bind(this)
    this.hideAllPanels = this.hideAllPanels.bind(this)
    this.showPanel = this.showPanel.bind(this)
    this.toggleFileCard = this.toggleFileCard.bind(this)
    this.toggleAddFilesPanel = this.toggleAddFilesPanel.bind(this)

    this.initEvents = this.initEvents.bind(this)
    this.handlePopState = this.handlePopState.bind(this)
    this.handleKeyDownInModal = this.handleKeyDownInModal.bind(this)
    this.handleKeyDownInInline = this.handleKeyDownInInline.bind(this)
    this.handleComplete = this.handleComplete.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
    this.handlePaste = this.handlePaste.bind(this)
    this.handlePasteOnBody = this.handlePasteOnBody.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)

    this.superFocusOnEachUpdate = this.superFocusOnEachUpdate.bind(this)
    this.recordIfFocusedOnUppyRecently = this.recordIfFocusedOnUppyRecently.bind(this)

    this.render = this.render.bind(this)
    this.install = this.install.bind(this)

    this.superFocus = createSuperFocus()
    this.ifFocusedOnUppyRecently = false

    // Timeouts
    this.makeDashboardInsidesVisibleAnywayTimeout = null
    this.removeDragOverClassTimeout = null
  }

  setOptions (newOpts) {
    super.setOptions(newOpts)
    this.i18nInit()
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)
    this.setPluginState() // so that UI re-renders and we see the updated locale
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
      const msg = 'Dashboard: Modal can only be used by plugins of types: acquirer, progressindicator, presenter'
      this.uppy.log(msg, 'error')
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

  openModal () {
    const { promise, resolve } = createPromise()
    // save scroll position
    this.savedScrollPosition = window.pageYOffset
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
    document.addEventListener('keydown', this.handleKeyDownInModal)

    this.uppy.emit('dashboard:modal-open')

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

        this.superFocus.cancel()
        this.savedActiveElement.focus()

        this.el.removeEventListener('animationend', handler, false)
        resolve()
      }
      this.el.addEventListener('animationend', handler, false)
    } else {
      this.setPluginState({
        isHidden: true
      })

      this.superFocus.cancel()
      this.savedActiveElement.focus()

      resolve()
    }

    // handle ESC and TAB keys in modal dialog
    document.removeEventListener('keydown', this.handleKeyDownInModal)

    if (manualClose) {
      if (this.opts.browserBackButtonClose) {
        // Make sure that the latest entry in the history state is our modal name
        if (history.state && history.state[this.modalName]) {
          // Go back in history to clear out the entry we created (ultimately closing the modal)
          history.go(-1)
        }
      }
    }

    this.uppy.emit('dashboard:modal-closed')

    return promise
  }

  isModalOpen () {
    return !this.getPluginState().isHidden || false
  }

  requestCloseModal () {
    if (this.opts.onRequestCloseModal) {
      return this.opts.onRequestCloseModal()
    }
    return this.closeModal()
  }

  toggleFileCard (fileId) {
    if (fileId) {
      this.uppy.emit('dashboard:file-edit-start')
    } else {
      this.uppy.emit('dashboard:file-edit-complete')
    }

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

  addFile (file) {
    try {
      this.uppy.addFile({
        source: this.id,
        name: file.name,
        type: file.type,
        data: file,
        meta: {
          // path of the file relative to the ancestor directory the user selected.
          // e.g. 'docs/Old Prague/airbnb.pdf'
          relativePath: file.relativePath || null
        }
      })
    } catch (err) {
      if (!err.isRestriction) {
        this.uppy.log(err)
      }
    }
  }

  // ___Why make insides of Dashboard invisible until first ResizeObserver event is emitted?
  //    ResizeOberserver doesn't emit the first resize event fast enough, users can see the jump from one .uppy-size-- to another (e.g. in Safari)
  // ___Why not apply visibility property to .uppy-Dashboard-inner?
  //    Because ideally, acc to specs, ResizeObserver should see invisible elements as of width 0. So even though applying invisibility to .uppy-Dashboard-inner works now, it may not work in the future.
  startListeningToResize () {
    // Watch for Dashboard container (`.uppy-Dashboard-inner`) resize
    // and update containerWidth/containerHeight in plugin state accordingly.
    // Emits first event on initialization.
    this.resizeObserver = new ResizeObserver((entries, observer) => {
      const uppyDashboardInnerEl = entries[0]

      const { width, height } = uppyDashboardInnerEl.contentRect

      this.uppy.log(`[Dashboard] resized: ${width} / ${height}`, 'debug')

      this.setPluginState({
        containerWidth: width,
        containerHeight: height,
        areInsidesReadyToBeVisible: true
      })
    })
    this.resizeObserver.observe(this.el.querySelector('.uppy-Dashboard-inner'))

    // If ResizeObserver fails to emit an event telling us what size to use - default to the mobile view
    this.makeDashboardInsidesVisibleAnywayTimeout = setTimeout(() => {
      const pluginState = this.getPluginState()
      const isModalAndClosed = !this.opts.inline && pluginState.isHidden
      if (
        // if ResizeObserver hasn't yet fired,
        !pluginState.areInsidesReadyToBeVisible &&
        // and it's not due to the modal being closed
        !isModalAndClosed
      ) {
        this.uppy.log("[Dashboard] resize event didn't fire on time: defaulted to mobile layout", 'debug')

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

  // Records whether we have been interacting with uppy right now, which is then used to determine whether state updates should trigger a refocusing.
  recordIfFocusedOnUppyRecently (event) {
    if (this.el.contains(event.target)) {
      this.ifFocusedOnUppyRecently = true
    } else {
      this.ifFocusedOnUppyRecently = false
      // ___Why run this.superFocus.cancel here when it already runs in superFocusOnEachUpdate?
      //    Because superFocus is debounced, when we move from Uppy to some other element on the page,
      //    previously run superFocus sometimes hits and moves focus back to Uppy.
      this.superFocus.cancel()
    }
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

  handleKeyDownInModal (event) {
    // close modal on esc key press
    if (event.keyCode === ESC_KEY) this.requestCloseModal(event)
    // trap focus on tab key press
    if (event.keyCode === TAB_KEY) trapFocus.forModal(event, this.getPluginState().activeOverlayType, this.el)
  }

  handleClickOutside () {
    if (this.opts.closeModalOnClickOutside) this.requestCloseModal()
  }

  handlePaste (event) {
    // 1. Let any acquirer plugin (Url/Webcam/etc.) handle pastes to the root
    this.uppy.iteratePlugins((plugin) => {
      if (plugin.type === 'acquirer') {
        // Every Plugin with .type acquirer can define handleRootPaste(event)
        plugin.handleRootPaste && plugin.handleRootPaste(event)
      }
    })

    // 2. Add all dropped files
    const files = toArray(event.clipboardData.files)
    files.forEach((file) => {
      this.uppy.log('[Dashboard] File pasted')
      this.addFile(file)
    })
  }

  handleInputChange (event) {
    event.preventDefault()
    const files = toArray(event.target.files)
    files.forEach((file) =>
      this.addFile(file)
    )
  }

  handleDragOver (event) {
    event.preventDefault()
    event.stopPropagation()

    // 1. Add a small (+) icon on drop
    // (and prevent browsers from interpreting this as files being _moved_ into the browser, https://github.com/transloadit/uppy/issues/1978)
    event.dataTransfer.dropEffect = 'copy'

    clearTimeout(this.removeDragOverClassTimeout)
    this.setPluginState({ isDraggingOver: true })
  }

  handleDragLeave (event) {
    event.preventDefault()
    event.stopPropagation()

    clearTimeout(this.removeDragOverClassTimeout)
    // Timeout against flickering, this solution is taken from drag-drop library. Solution with 'pointer-events: none' didn't work across browsers.
    this.removeDragOverClassTimeout = setTimeout(() => {
      this.setPluginState({ isDraggingOver: false })
    }, 50)
  }

  handleDrop (event, dropCategory) {
    event.preventDefault()
    event.stopPropagation()
    clearTimeout(this.removeDragOverClassTimeout)

    // 2. Remove dragover class
    this.setPluginState({ isDraggingOver: false })

    // 3. Let any acquirer plugin (Url/Webcam/etc.) handle drops to the root
    this.uppy.iteratePlugins((plugin) => {
      if (plugin.type === 'acquirer') {
        // Every Plugin with .type acquirer can define handleRootDrop(event)
        plugin.handleRootDrop && plugin.handleRootDrop(event)
      }
    })

    // 4. Add all dropped files
    let executedDropErrorOnce = false
    const logDropError = (error) => {
      this.uppy.log(error, 'error')

      // In practice all drop errors are most likely the same, so let's just show one to avoid overwhelming the user
      if (!executedDropErrorOnce) {
        this.uppy.info(error.message, 'error')
        executedDropErrorOnce = true
      }
    }
    getDroppedFiles(event.dataTransfer, { logDropError })
      .then((files) => {
        if (files.length > 0) {
          this.uppy.log('[Dashboard] Files were dropped')
          files.forEach((file) =>
            this.addFile(file)
          )
        }
      })
  }

  handleKeyDownInInline (event) {
    // Trap focus on tab key press.
    if (event.keyCode === TAB_KEY) trapFocus.forInline(event, this.getPluginState().activeOverlayType, this.el)
  }

  // ___Why do we listen to the 'paste' event on a document instead of onPaste={props.handlePaste} prop, or this.el.addEventListener('paste')?
  //    Because (at least) Chrome doesn't handle paste if focus is on some button, e.g. 'My Device'.
  //    => Therefore, the best option is to listen to all 'paste' events, and only react to them when we are focused on our particular Uppy instance.
  // ___Why do we still need onPaste={props.handlePaste} for the DashboardUi?
  //    Because if we click on the 'Drop files here' caption e.g., `document.activeElement` will be 'body'. Which means our standard determination of whether we're pasting into our Uppy instance won't work.
  //    => Therefore, we need a traditional onPaste={props.handlePaste} handler too.
  handlePasteOnBody (event) {
    const isFocusInOverlay = this.el.contains(document.activeElement)
    if (isFocusInOverlay) {
      this.handlePaste(event)
    }
  }

  handleComplete ({ failed, uploadID }) {
    if (this.opts.closeAfterFinish && failed.length === 0) {
      // All uploads are done
      this.requestCloseModal()
    }
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

    this.startListeningToResize()
    document.addEventListener('paste', this.handlePasteOnBody)

    this.uppy.on('plugin-remove', this.removeTarget)
    this.uppy.on('file-added', this.hideAllPanels)
    this.uppy.on('dashboard:modal-closed', this.hideAllPanels)
    this.uppy.on('complete', this.handleComplete)

    // ___Why fire on capture?
    //    Because this.ifFocusedOnUppyRecently needs to change before onUpdate() fires.
    document.addEventListener('focus', this.recordIfFocusedOnUppyRecently, true)
    document.addEventListener('click', this.recordIfFocusedOnUppyRecently, true)

    if (this.opts.inline) {
      this.el.addEventListener('keydown', this.handleKeyDownInInline)
    }
  }

  removeEvents () {
    const showModalTrigger = findAllDOMElements(this.opts.trigger)
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.forEach(trigger => trigger.removeEventListener('click', this.openModal))
    }

    this.stopListeningToResize()
    document.removeEventListener('paste', this.handlePasteOnBody)

    window.removeEventListener('popstate', this.handlePopState, false)
    this.uppy.off('plugin-remove', this.removeTarget)
    this.uppy.off('file-added', this.hideAllPanels)
    this.uppy.off('dashboard:modal-closed', this.hideAllPanels)
    this.uppy.off('complete', this.handleComplete)

    document.removeEventListener('focus', this.recordIfFocusedOnUppyRecently)
    document.removeEventListener('click', this.recordIfFocusedOnUppyRecently)

    if (this.opts.inline) {
      this.el.removeEventListener('keydown', this.handleKeyDownInInline)
    }
  }

  superFocusOnEachUpdate () {
    const isFocusInUppy = this.el.contains(document.activeElement)
    // When focus is lost on the page (== focus is on body for most browsers, or focus is null for IE11)
    const isFocusNowhere = document.activeElement === document.querySelector('body') || document.activeElement === null
    const isInformerHidden = this.uppy.getState().info.isHidden
    const isModal = !this.opts.inline

    if (
      // If update is connected to showing the Informer - let the screen reader calmly read it.
      isInformerHidden &&
      (
        // If we are in a modal - always superfocus without concern for other elements on the page (user is unlikely to want to interact with the rest of the page)
        isModal ||
        // If we are already inside of Uppy, or
        isFocusInUppy ||
        // If we are not focused on anything BUT we have already, at least once, focused on uppy
        //   1. We focus when isFocusNowhere, because when the element we were focused on disappears (e.g. an overlay), - focus gets lost. If user is typing something somewhere else on the page, - focus won't be 'nowhere'.
        //   2. We only focus when focus is nowhere AND this.ifFocusedOnUppyRecently, to avoid focus jumps if we do something else on the page.
        //   [Practical check] Without '&& this.ifFocusedOnUppyRecently', in Safari, in inline mode, when file is uploading, - navigate via tab to the checkbox, try to press space multiple times. Focus will jump to Uppy.
        (isFocusNowhere && this.ifFocusedOnUppyRecently)
      )
    ) {
      this.superFocus(this.el, this.getPluginState().activeOverlayType)
    } else {
      this.superFocus.cancel()
    }
  }

  afterUpdate () {
    this.superFocusOnEachUpdate()
  }

  cancelUpload = (fileID) => {
    this.uppy.removeFile(fileID)
  }

  saveFileCard = (meta, fileID) => {
    this.uppy.setFileMeta(fileID, meta)
    this.toggleFileCard()
  }

  _attachRenderFunctionToTarget = (target) => {
    const plugin = this.uppy.getPlugin(target.id)
    return {
      ...target,
      icon: plugin.icon || this.opts.defaultPickerIcon,
      render: plugin.render
    }
  }

  _isTargetSupported = (target) => {
    const plugin = this.uppy.getPlugin(target.id)
    // If the plugin does not provide a `supported` check, assume the plugin works everywhere.
    if (typeof plugin.isSupported !== 'function') {
      return true
    }
    return plugin.isSupported()
  }

  _getAcquirers = memoize((targets) => {
    return targets
      .filter(target => target.type === 'acquirer' && this._isTargetSupported(target))
      .map(this._attachRenderFunctionToTarget)
  })

  _getProgressIndicators = memoize((targets) => {
    return targets
      .filter(target => target.type === 'progressindicator')
      .map(this._attachRenderFunctionToTarget)
  })

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

    const acquirers = this._getAcquirers(pluginState.targets)
    const progressindicators = this._getProgressIndicators(pluginState.targets)

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
      individualCancellation: capabilities.individualCancellation,
      pauseUpload: this.uppy.pauseResume,
      retryUpload: this.uppy.retryUpload,
      cancelUpload: this.cancelUpload,
      cancelAll: this.uppy.cancelAll,
      fileCardFor: pluginState.fileCardFor,
      toggleFileCard: this.toggleFileCard,
      toggleAddFilesPanel: this.toggleAddFilesPanel,
      showAddFilesPanel: pluginState.showAddFilesPanel,
      saveFileCard: this.saveFileCard,
      width: this.opts.width,
      height: this.opts.height,
      showLinkToFileUploadResult: this.opts.showLinkToFileUploadResult,
      proudlyDisplayPoweredByUppy: this.opts.proudlyDisplayPoweredByUppy,
      hideCancelButton: this.opts.hideCancelButton,
      containerWidth: pluginState.containerWidth,
      containerHeight: pluginState.containerHeight,
      areInsidesReadyToBeVisible: pluginState.areInsidesReadyToBeVisible,
      isTargetDOMEl: this.isTargetDOMEl,
      parentElement: this.el,
      allowedFileTypes: this.uppy.opts.restrictions.allowedFileTypes,
      maxNumberOfFiles: this.uppy.opts.restrictions.maxNumberOfFiles,
      showSelectedFiles: this.opts.showSelectedFiles,
      // drag props
      isDraggingOver: pluginState.isDraggingOver,
      handleDragOver: this.handleDragOver,
      handleDragLeave: this.handleDragLeave,
      handleDrop: this.handleDrop
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
      areInsidesReadyToBeVisible: false,
      isDraggingOver: false
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
        thumbnailWidth: this.opts.thumbnailWidth,
        waitForThumbnailsBeforeUpload: this.opts.waitForThumbnailsBeforeUpload
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
