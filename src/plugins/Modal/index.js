import Plugin from '../Plugin'
import Utils from '../../core/Utils'
import dragDrop from 'drag-drop'
import yo from 'yo-yo'
import FileItem from './FileItem'
import FileCard from './FileCard'
import { defaultTabIcon, closeIcon, localIcon, uploadIcon, dashboardBgIcon } from './icons'

/**
 * Modal Dialog & Dashboard
 */
export default class Dashboard extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'Dashboard'
    this.title = 'Dashboard'
    this.type = 'orchestrator'

    // set default options
    const defaultOptions = {
      target: 'body',
      defaultTabIcon: defaultTabIcon(),
      panelSelectorPrefix: 'UppyDashboardContent-panel'
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

    const newTargets = modal.targets.map((target) => {
      const isAcquirer = target.type === 'acquirer'
      return Object.assign({}, target, {
        isHidden: isAcquirer
      })
    })

    this.core.setState({modal: Object.assign({}, modal, {
      targets: newTargets
    })})
  }

  showPanel (id) {
    const modal = this.core.getState().modal

    // hide all panels, except the one that matches current id
    const newTargets = modal.targets.map((target) => {
      if (target.type === 'acquirer') {
        if (target.id === id) {
          target.focus()
          return Object.assign({}, target, {
            isHidden: false
          })
        }
        return Object.assign({}, target, {
          isHidden: true
        })
      }
      return target
    })

    this.core.setState({modal: Object.assign({}, modal, {
      targets: newTargets
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
    document.querySelector('*[tabindex="0"]').focus()
  }

  initEvents () {
    const modal = document.querySelector(`${this.opts.target} .UppyDashboard`)
    // Modal open button
    const showModalTrigger = document.querySelector(this.opts.trigger)
    showModalTrigger.addEventListener('click', this.showModal)

    // Close the Modal on esc key press
    document.body.addEventListener('keyup', (event) => {
      if (event.keyCode === 27) {
        this.hideModal()
      }
    })

    // Close on click outside modal or close buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('js-UppyDashboard-close')) {
        this.hideModal()
      }
    })

    // Drag Drop
    dragDrop(`${this.opts.target} .UppyDashboard`, (files) => {
      this.handleDrop(files)
      this.core.log(files)
    })

    // @TODO Exprimental, work in progress
    // Paste from clipboard
    modal.addEventListener('paste', this.handlePaste.bind(this))
  }

  // @TODO Exprimental, work in progress
  handlePaste (ev) {
    // console.log(ev)
    const files = Array.from(ev.clipboardData.items)
    // console.log(files)
    files.shift()
    files.forEach((file) => {
      const fileBlob = file.getAsFile()
      this.core.emitter.emit('file-add', {
        source: this.id,
        name: file.name,
        type: file.type,
        data: fileBlob
      })
    })
  }

  actions () {
    const emitter = this.core.emitter
    emitter.on('file-add', () => {
      this.hideAllPanels()
    })

    emitter.on('file-card-open', (fileId) => {
      const modal = this.core.getState().modal

      this.core.setState({
        modal: Object.assign({}, modal, {
          showFileCard: fileId
        })
      })
    })

    emitter.on('file-card-close', () => {
      const modal = this.core.getState().modal

      this.core.setState({
        modal: Object.assign({}, modal, {
          showFileCard: false
        })
      })
    })
  }

  handleDrop (files) {
    this.core.log('All right, someone dropped something...')

    files.forEach((file) => {
      this.core.emitter.emit('file-add', {
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })

    // this.core.updateMeta({bla: 'bla'})
  }

  handleInputChange (ev) {
    this.core.log('All right, something selected through input...')

    const files = Utils.toArray(ev.target.files)

    files.forEach((file) => {
      this.core.log(file)
      this.core.emitter.emit('file-add', {
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  render (state) {
    // http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog

    const autoProceed = this.core.opts.autoProceed
    const files = state.files
    const bus = this.core.emitter
    const updateMeta = this.core.updateMeta

    const showFileCard = state.modal.showFileCard

    const modalTargets = state.modal.targets.slice()

    const acquirers = modalTargets.filter((target) => {
      return target.type === 'acquirer'
    })

    const progressindicators = modalTargets.filter((target) => {
      return target.type === 'progressindicator'
    })

    const isTouchDevice = Utils.isTouchDevice()

    const onSelect = (ev) => {
      const input = document.querySelector(`${this.opts.target} .UppyDashboard-input`)
      input.click()
    }

    const next = (ev) => {
      bus.emit('next')
    }

    const selectedFiles = Object.keys(files).filter((file) => {
      return files[file].progress === 0
      // return files[file].progress !== 100
    })
    const totalFileCount = Object.keys(files).length
    const selectedFileCount = Object.keys(selectedFiles).length
    const isSomethingSelected = selectedFileCount > 0

    return yo`<div class="Uppy UppyTheme--default UppyDashboard ${isTouchDevice ? 'Uppy--isTouchDevice' : ''}"
                   aria-hidden="${state.modal.isHidden}"
                   aria-label="Uppy Dialog Window (Press escape to close)"
                   role="dialog">

      <div class="UppyDashboard-overlay"
                  onclick=${this.hideModal}></div>

      <div class="UppyDashboard-inner" tabindex="0">
        <div class="UppyDashboard-bar">
          <h1 class="UppyDashboard-title">Upload files</h1>
        </div>

        <button class="UppyDashboard-close" title="Close Uppy modal"
                onclick=${this.hideModal}>${closeIcon()}</button>

        <div class="UppyDashboardTabs">
          <h3 class="UppyDashboardTabs-title">Drop files here, paste or import from</h3>
          <nav>
            <ul class="UppyDashboardTabs-list" role="tablist">
              <li class="UppyDashboardTab">
                <button class="UppyDashboardTab-btn UppyDashboard-focus"
                        role="tab"
                        tabindex="0"
                        onclick=${onSelect}>
                  ${localIcon()}
                  <h5 class="UppyDashboardTab-name">Local Disk</h5>
                </button>
                <input class="UppyDashboard-input"
                       type="file"
                       name="files[]"
                       multiple="true"
                       value=""
                       onchange=${this.handleInputChange.bind(this)} />
              </li>
              ${acquirers.map((target) => {
                return yo`<li class="UppyDashboardTab">
                  <button class="UppyDashboardTab-btn"
                          role="tab"
                          tabindex="0"
                          aria-controls="${this.opts.panelSelectorPrefix}--${target.id}"
                          aria-selected="${target.isHidden ? 'false' : 'true'}"
                          onclick=${this.showPanel.bind(this, target.id)}>
                    ${target.icon}
                    <h5 class="UppyDashboardTab-name">${target.name}</h5>
                  </button>
                </li>`
              })}
            </ul>
          </nav>
        </div>

        ${FileCard(state, showFileCard, state.metaFields, bus, updateMeta)}

        <div class="UppyDashboard-files">
          <ul class="UppyDashboard-filesInner">
            ${totalFileCount === 0
              ? yo`<div class="UppyDashboard-bgIcon">${dashboardBgIcon()}</div>`
              : ''
            }
            ${Object.keys(files).map((fileID) => {
              return FileItem(files[fileID], bus)
            })}
          </ul>
          ${!autoProceed && isSomethingSelected
            ? yo`<button class="UppyDashboard-upload"
                           type="button"
                           title="Upload"
                           onclick=${next}>
                      ${uploadIcon()}
                      <sup class="UppyDashboard-uploadCount">${selectedFileCount}</sup>
                   </button>`
            : null
          }
        </div>

        ${acquirers.map((target) => {
          return yo`<div class="UppyDashboardContent-panel"
                         id="${this.opts.panelSelectorPrefix}--${target.id}"
                         role="tabpanel"
                         aria-hidden="${target.isHidden}">
             <div class="UppyDashboardContent-bar">
               <h2 class="UppyDashboardContent-title">Import From ${target.name}</h2>
               <button class="UppyDashboardContent-back"
                       onclick=${this.hideAllPanels}>Done</button>
             </div>
            ${target.render(state)}
          </div>`
        })}

        <div class="UppyDashboard-progressindicators">
          ${progressindicators.map((target) => {
            return target.render(state)
          })}
        </div>

      </div>
    </div>`
  }

  // <div class="UppyDashboard-fileCard" aria-hidden="${showFileCard ? 'false' : 'true'}">
  //   ${showFileCard ? FileCard(state.files[showFileCard], state.metaFields, bus, updateMeta) : null}
  // </div>

  install () {
    // Set default state for Modal
    this.core.setState({modal: {
      isHidden: true,
      showFileCard: false,
      targets: []
    }})

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    this.initEvents()
    this.actions()
  }
}
