import Plugin from './Plugin'
import yo from 'yo-yo'

/**
 * Modal
 *
 */
export default class Modal extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'orchestrator'

    // set default options
    const defaultOptions = {
      target: '.UppyModal',
      defaultTabIcon: yo`
        <svg class="UppyModalTab-icon" width="28" height="28" viewBox="0 0 101 58">
          <path d="M17.582.3L.915 41.713l32.94 13.295L17.582.3zm83.333 41.414L67.975 55.01 84.25.3l16.665 41.414zm-48.998 5.403L63.443 35.59H38.386l11.527 11.526v5.905l-3.063 3.32 1.474 1.36 2.59-2.806 2.59 2.807 1.475-1.357-3.064-3.32v-5.906zm16.06-26.702c-3.973 0-7.194-3.22-7.194-7.193 0-3.973 3.222-7.193 7.193-7.193 3.974 0 7.193 3.22 7.193 7.19 0 3.974-3.22 7.194-7.195 7.194zM70.48 8.682c-.737 0-1.336.6-1.336 1.337 0 .736.6 1.335 1.337 1.335.738 0 1.338-.598 1.338-1.336 0-.74-.6-1.338-1.338-1.338zM33.855 20.415c-3.973 0-7.193-3.22-7.193-7.193 0-3.973 3.22-7.193 7.195-7.193 3.973 0 7.192 3.22 7.192 7.19 0 3.974-3.22 7.194-7.192 7.194zM36.36 8.682c-.737 0-1.336.6-1.336 1.337 0 .736.6 1.335 1.337 1.335.738 0 1.338-.598 1.338-1.336 0-.74-.598-1.338-1.337-1.338z"/>
        </svg>
      `,
      panelSelectorPrefix: 'UppyModalContent-panel'
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // Set default state for Modal
    this.core.setState({modal: {
      isHidden: true,
      targets: []
    }})

    this.hideModal = this.hideModal.bind(this)
    this.showModal = this.showModal.bind(this)
  }

  update (state) {
    var newEl = this.render(state)
    yo.update(this.el, newEl)
  }

  addTarget (callerPlugin, el) {
    const callerPluginId = callerPlugin.constructor.name
    const callerPluginName = callerPlugin.name || callerPluginId
    const callerPluginIcon = callerPlugin.icon || this.opts.defaultTabIcon
    const callerPluginType = callerPlugin.type

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
      el: el,
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

  showTabPanel (id) {
    const modal = this.core.getState().modal

    // hide all panels, except the one that matches current id
    const newTargets = modal.targets.map((target) => {
      if (target.type === 'acquirer') {
        if (target.id === id) {
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
    this.core.setState({
      modal: Object.assign({}, modal, {
        isHidden: true
      })
    })

    document.body.classList.remove('is-UppyModal-open')
  }

  showModal () {
    const modal = this.core.getState().modal

    // Show first acquirer plugin when modal is open
    let found = false
    const newTargets = modal.targets.map((target) => {
      if (target.type === 'acquirer' && !found) {
        found = true

        return Object.assign({}, target, {
          isHidden: false
        })
      }
      return target
    })

    this.core.setState({
      modal: Object.assign({}, modal, {
        isHidden: false,
        targets: newTargets
      })
    })

    document.body.classList.add('is-UppyModal-open')
  }

  events () {
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

  install () {
    this.el = this.render(this.core.state)
    document.body.appendChild(this.el)

    this.events()
  }

  render (state) {
    // http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog

    const modalTargets = state.modal.targets

    const acquirers = modalTargets.filter((target) => {
      return target.type === 'acquirer'
    })

    const progressindicators = modalTargets.filter((target) => {
      return target.type === 'progressindicator'
    })

    const targetClassName = this.opts.target.substring(1)

    return yo`<div class="${targetClassName}"
                   aria-hidden="${state.modal.isHidden}"
                   aria-labelledby="modalTitle"
                   aria-describedby="modalDescription"
                   role="dialog">
      <div class="UppyModal-overlay"
                  tabindex="-1"
                  onclick=${this.hideModal}></div>
      <div class="UppyModal-inner">
        <button class="UppyModal-close"
                title="Close Uppy modal"
                onclick=${this.hideModal}>×</button>
        <ul class="UppyModalTabs" role="tablist">
          ${acquirers.map((target) => {
            return yo`<li class="UppyModalTab">
              <button class="UppyModalTab-btn"
                      role="tab"
                      aria-controls="${target.id}"
                      aria-selected="${target.isHidden ? 'false' : 'true'}"
                      onclick=${this.showTabPanel.bind(this, target.id)}>
                ${target.icon}
                <span class="UppyModalTab-name">${target.name}</span>
              </button>
            </li>`
          })}
        </ul>

        <div class="UppyModalContent">
          <div class="UppyModal-presenter"></div>
          ${acquirers.map((target) => {
            return yo`<div class="UppyModalContent-panel
                           ${this.opts.panelSelectorPrefix}--${target.id}"
                           role="tabpanel"
                           aria-hidden="${target.isHidden}">
              ${target.el}
            </div>`
          })}
        </div>
        <div class="UppyModal-progressindicators">
          ${progressindicators.map((target) => {
            return target.el
          })}
        </div>
      </div>
    </div>`
  }
}
