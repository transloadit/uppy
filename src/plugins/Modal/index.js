import Plugin from '../Plugin'
import Dashboard from './Dashboard.js'
import { defaultTabIcon, closeIcon } from './icons'
import dragDrop from 'drag-drop'
import yo from 'yo-yo'

/**
 * Modal Dialog & Dashboard
 */
export default class Modal extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'Modal'
    this.title = 'Modal'
    this.type = 'orchestrator'

    // set default options
    const defaultOptions = {
      target: 'body',
      defaultTabIcon: defaultTabIcon(),
      panelSelectorPrefix: 'UppyModalContent-panel'
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

    this.core.setState({
      modal: Object.assign({}, modal, {
        targets: modal.targets.concat([target])
      })
    })

    return this.opts.target
  }

  hideAllPanels () {
    const modal = this.core.getState().modal
    const newModalTargets = modal.targets.slice()

    newModalTargets.forEach((target) => {
      if (target.type === 'acquirer') {
        target.isHidden = true
      }
    })

    this.core.setState({modal: Object.assign({}, modal, {
      targets: newModalTargets
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
    // Straightforward simple way
    // this.core.state.modal.isHidden = true
    // this.core.updateAll()

    // The “right way”
    const modal = this.core.getState().modal

    // const newTargets = modal.targets.map((target) => {
    //   target.isHidden = true
    //   return target
    // })

    // this.hideTabPanel()

    this.core.setState({
      modal: Object.assign({}, modal, {
        isHidden: true
        // targets: newTargets
      })
    })

    document.body.classList.remove('is-UppyModal-open')
  }

  showModal () {
    const modal = this.core.getState().modal

    // Show first acquirer plugin when modal is open
    // let found = false
    // const newTargets = modal.targets.map((target) => {
    //   if (target.type === 'acquirer' && !found) {
    //     found = true
    //     target.focus()
    //
    //     return Object.assign({}, target, {
    //       isHidden: false
    //     })
    //   }
    //   return target
    // })

    this.core.setState({
      modal: Object.assign({}, modal, {
        isHidden: false
        // targets: newTargets
      })
    })

    // add class to body that sets position fixed
    document.body.classList.add('is-UppyModal-open')
    // focus on modal inner block
    document.querySelector('*[tabindex="0"]').focus()
  }

  initEvents () {
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
      if (e.target.classList.contains('js-UppyModal-close')) {
        this.hideModal()
      }
    })
  }

  actions () {
    this.core.emitter.on('file-add', () => {
      this.hideAllPanels()
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

    this.core.addMeta({bla: 'bla'})
  }

  render (state) {
    // http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog

    const autoProceed = this.core.opts.autoProceed
    const files = state.files
    const bus = this.core.emitter

    const modalTargets = state.modal.targets

    const acquirers = modalTargets.filter((target) => {
      return target.type === 'acquirer'
    })

    const progressindicators = modalTargets.filter((target) => {
      return target.type === 'progressindicator'
    })

    return yo`<div class="Uppy UppyTheme--default UppyModal"
                   aria-hidden="${state.modal.isHidden}"
                   aria-label="Uppy Dialog Window (Press escape to close)"
                   role="dialog">
      <div class="UppyModal-overlay"
                  onclick=${this.hideModal}></div>
        <div class="UppyModal-inner" tabindex="0">
          <div class="UppyModal-dashboard">
            ${Dashboard(files, bus, autoProceed)}
          </div>
          <ul class="UppyModalTabs" role="tablist">
            ${acquirers.map((target) => {
              return yo`<li class="UppyModalTab">
                <button class="UppyModalTab-btn"
                        role="tab"
                        tabindex="0"
                        aria-controls="${this.opts.panelSelectorPrefix}--${target.id}"
                        aria-selected="${target.isHidden ? 'false' : 'true'}"
                        onclick=${this.showPanel.bind(this, target.id)}>
                  ${target.icon}
                  <h5 class="UppyModalTab-name">${target.name}</h5>
                </button>
              </li>`
            })}
          </ul>

          ${acquirers.map((target) => {
            return yo`<div class="UppyModalContent-panel"
                           id="${this.opts.panelSelectorPrefix}--${target.id}"
                           role="tabpanel"
                           aria-hidden="${target.isHidden}">
               <div class="UppyModalContent-bar">
                 <h2 class="UppyModalContent-title">Import From ${target.name}</h2>
                 <button class="UppyModalContent-back"
                         onclick=${this.hideAllPanels}>Back</button>
               </div>
              ${target.render(state)}
            </div>`
          })}

          <div class="UppyModal-progressindicators">
            ${progressindicators.map((target) => {
              return target.render(state)
            })}
          </div>
          <button class="UppyModal-close"
                  title="Close Uppy modal"
                  onclick=${this.hideModal}>${closeIcon()}
          </button>
      </div>
    </div>`
  }

  install () {
    // Set default state for Modal
    this.core.setState({modal: {
      isHidden: true,
      targets: []
    }})

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    this.initEvents()
    this.actions()

    dragDrop(this.opts.target, (files) => {
      this.handleDrop(files)
      this.core.log(files)
    })
  }
}
