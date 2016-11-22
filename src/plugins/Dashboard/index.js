import Plugin from '../Plugin'
import dragDrop from 'drag-drop'
import Dashboard from './Dashboard'
import { getSpeed, getETA, prettyETA } from '../../core/Utils'
import prettyBytes from 'pretty-bytes'
import { defaultTabIcon } from './icons'

/**
 * Modal Dialog & Dashboard
 */
export default class DashboardUI extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'DashboardUI'
    this.title = 'Dashboard UI'
    this.type = 'orchestrator'

    // set default options
    const defaultOptions = {
      target: 'body',
      inline: false,
      semiTransparent: false,
      defaultTabIcon: defaultTabIcon(),
      panelSelectorPrefix: 'UppyDashboardContent-panel',
      showProgressDetails: true
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.hideModal = this.hideModal.bind(this)
    this.showModal = this.showModal.bind(this)

    this.addTarget = this.addTarget.bind(this)
    this.actions = this.actions.bind(this)
    this.hideAllPanels = this.hideAllPanels.bind(this)
    this.showPanel = this.showPanel.bind(this)
    this.initEvents = this.initEvents.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.pauseAll = this.pauseAll.bind(this)
    this.resumeAll = this.resumeAll.bind(this)
    this.cancelAll = this.cancelAll.bind(this)
    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
  }

  addTarget (plugin) {
    const callerPluginId = plugin.constructor.name
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

    return this.opts.target
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
    document.querySelector('.UppyDashboard-inner').focus()
  }

  initEvents () {
    // const dashboardEl = document.querySelector(`${this.opts.target} .UppyDashboard`)

    // Modal open button
    const showModalTrigger = document.querySelector(this.opts.trigger)
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.addEventListener('click', this.showModal)
    } else {
      this.core.log('Modal trigger wasn’t found')
    }

    // Close the Modal on esc key press
    document.body.addEventListener('keyup', (event) => {
      if (event.keyCode === 27) {
        this.hideModal()
      }
    })

    // Drag Drop
    dragDrop(this.el, (files) => {
      this.handleDrop(files)
    })
  }

  actions () {
    const bus = this.core.bus

    bus.on('core:file-add', () => {
      this.hideAllPanels()
    })

    bus.on('dashboard:file-card', (fileId) => {
      const modal = this.core.getState().modal

      this.core.setState({
        modal: Object.assign({}, modal, {
          fileCardFor: fileId || false
        })
      })
    })

    // bus.on('core:success', (uploadedCount) => {
    //   bus.emit(
    //     'informer',
    //     `${this.core.i18n('files', {'smart_count': uploadedCount})} successfully uploaded, Sir!`,
    //     'info',
    //     6000
    //   )
    // })
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
    let totalSeconds = 0

    files.forEach((file) => {
      totalSeconds = totalSeconds + getETA(file.progress)
    })

    return totalSeconds
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
      this.core.emitter.emit('core:upload')
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
      isAllComplete: isAllComplete,
      isAllPaused: isAllPaused,
      acquirers: acquirers,
      activePanel: state.modal.activePanel,
      progressindicators: progressindicators,
      autoProceed: this.core.opts.autoProceed,
      id: this.id,
      container: this.opts.target,
      hideModal: this.hideModal,
      panelSelectorPrefix: this.opts.panelSelectorPrefix,
      showProgressDetails: this.opts.showProgressDetails,
      inline: this.opts.inline,
      semiTransparent: this.opts.semiTransparent,
      onPaste: this.handlePaste,
      showPanel: this.showPanel,
      hideAllPanels: this.hideAllPanels,
      log: this.core.log,
      bus: this.core.emitter,
      i18n: this.core.i18n,
      pauseAll: this.pauseAll,
      resumeAll: this.resumeAll,
      cancelAll: this.cancelAll,
      addFile: addFile,
      removeFile: removeFile,
      info: info,
      metaFields: state.metaFields,
      resumableUploads: this.core.getState().capabilities.resumableUploads || false,
      startUpload: startUpload,
      pauseUpload: pauseUpload,
      cancelUpload: cancelUpload,
      fileCardFor: state.modal.fileCardFor,
      showFileCard: showFileCard,
      fileCardDone: fileCardDone
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
}
