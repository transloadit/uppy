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
      defaultTabIcon: yo`
        <svg class="UppyModalTab-icon" width="28" height="28" viewBox="0 0 101 58">
          <path d="M17.582.3L.915 41.713l32.94 13.295L17.582.3zm83.333 41.414L67.975 55.01 84.25.3l16.665 41.414zm-48.998 5.403L63.443 35.59H38.386l11.527 11.526v5.905l-3.063 3.32 1.474 1.36 2.59-2.806 2.59 2.807 1.475-1.357-3.064-3.32v-5.906zm16.06-26.702c-3.973 0-7.194-3.22-7.194-7.193 0-3.973 3.222-7.193 7.193-7.193 3.974 0 7.193 3.22 7.193 7.19 0 3.974-3.22 7.194-7.195 7.194zM70.48 8.682c-.737 0-1.336.6-1.336 1.337 0 .736.6 1.335 1.337 1.335.738 0 1.338-.598 1.338-1.336 0-.74-.6-1.338-1.338-1.338zM33.855 20.415c-3.973 0-7.193-3.22-7.193-7.193 0-3.973 3.22-7.193 7.195-7.193 3.973 0 7.192 3.22 7.192 7.19 0 3.974-3.22 7.194-7.192 7.194zM36.36 8.682c-.737 0-1.336.6-1.336 1.337 0 .736.6 1.335 1.337 1.335.738 0 1.338-.598 1.338-1.336 0-.74-.598-1.338-1.337-1.338z"/>
        </svg>
      `,
      panelSelectorPrefix: 'UppyModalContent-panel'
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.progressindicators = {}

    this.hideModal = this.hideModal.bind(this)
    this.showModal = this.showModal.bind(this)
  }

  update (state) {
    var newEl = this.render(state)
    yo.update(this.el, newEl)
  }

  prepareTarget (callerPlugin, el) {
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

    this.core.emitter.emit('modal-add-target', {
      id: callerPluginId,
      name: callerPluginName,
      icon: callerPluginIcon,
      type: callerPluginType,
      el: el,
      isVisible: false
    })
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

    return yo`<div class="UppyModal"
                   ${state.modal.isVisible ? '' : 'aria-hidden'}
                   aria-labelledby="modalTitle"
                   aria-describedby="modalDescription"
                   role="dialog">
      <div class="UppyModal-overlay js-UppyModal-close" tabindex="-1"></div>
      <div class="UppyModal-inner">
        <button class="UppyModal-close js-UppyModal-close" title="Close Uppy modal">×</button>
        <ul class="UppyModalTabs" role="tablist">
          ${acquirers.map((target) => {
            return yo`<li class="UppyModalTab">
              <button class="UppyModalTab-btn"
                      role="tab"
                      aria-controls="${target.id}"
                      ${target.isVisible ? 'aria-selected' : ''}
                      onclick=${() => {
                        this.showTabPanel(target.id)
                      }}}>
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
                           ${target.isVisible ? '' : 'aria-hidden'}>
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

  showTabPanel (id) {
    this.core.emitter.emit('modal-panel-show', id)
  }

  hideModal () {
    this.core.emitter.emit('modal-close')
  }

  showModal () {
    this.core.emitter.emit('modal-open')
  }
  //
  // hideAllTabPanels () {
  //   this.tabPanels.forEach((tabPanel) => tabPanel.setAttribute('aria-hidden', true))
  //   this.tabs.forEach((tab) => tab.removeAttribute('aria-selected'))
  // }
  //
  // showTabPanel (pluginSelector, pluginName) {
  //   this.hideAllTabPanels()
  //
  //   const tab = document.querySelector(`[aria-controls="${pluginName}"]`)
  //   const tabPanel = document.querySelector(`.${pluginSelector}`)
  //
  //   tabPanel.removeAttribute('aria-hidden')
  //   tab.setAttribute('aria-selected', 'true')
  //
  //   this.core.log(pluginName)
  //   this.core.getPlugin(pluginName).focus()
  // }

  events () {
    // Listen for allDone event to close all tabs
    // this.core.emitter.on('allDone', () => this.allDone())

    // this.core.emitter.on('file-add', (data) => {
    //   this.nextButton.classList.add('is-active')
    //
    //   const files = Object.keys(this.core.state.selectedFiles)
    //   const selectedFileCount = files.length
    //   this.nextButton.innerHTML = this.core.i18n('uploadFiles', {'smart_count': selectedFileCount})
    // })

    // this.core.emitter.on('reset', () => this.nextButton.classList.remove('is-active'))

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

  // initTabs () {
  //   // Get all tab buttons and loop through them, to determine which
  //   // tabPanel they trigger, set events
  //   this.tabs = Utils.qsa('.UppyModalTab-btn')
  //   this.tabs.forEach((tab) => {
  //     const pluginSelector = tab.getAttribute('data-open')
  //     const pluginName = tab.getAttribute('aria-controls')
  //     const tabPanel = document.querySelector(`.${pluginSelector}`)
  //     this.tabPanels.push(tabPanel)
  //
  //     tab.addEventListener('click', (event) => {
  //       event.preventDefault()
  //       this.showTabPanel(pluginSelector, pluginName)
  //     })
  //   })
  //
  //   // Select first tab right away
  //   this.tabs[0].click()
  // }

  install () {
    this.el = this.render(this.core.state)
    document.body.appendChild(this.el)

    // Add events for opening and closing the modal
    // const hideModalTrigger = Utils.qsa('.js-UppyModal-close')
    this.showModalTrigger = document.querySelector(this.opts.trigger)
    this.showModalTrigger.addEventListener('click', this.showModal)

    this.events()
  }
}
