import Plugin from './Plugin'
import Utils from '../core/Utils'

/**
 * Modal
 *
 */
export default class Modal extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'view'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.container = document.body
  }

  prepareTarget (callerPlugin) {
    const callerPluginName = callerPlugin.constructor.name

    switch (callerPlugin.type) {
      case 'progress':
        return '.UppyModal-progressContainer'
      case 'selecter':

        // add tab panel, where plugin will render
        const modalContent = document.querySelector('.UppyModalСontent')
        const nodeForPlugin = document.createElement('div')

        modalContent.appendChild(nodeForPlugin)
        nodeForPlugin.outerHTML = `
          <div class="UppyModalContent-panel"
               role="tabpanel"
               id="${callerPluginName}">
          </div>
        `

        // add tab switch button
        const modalTabs = document.querySelector('.UppyModalTabs')
        const modalTab = document.createElement('div')

        modalTabs.appendChild(modalTab)
        modalTab.outerHTML = `
          <li class="UppyModalTab">
            <button class="UppyModalTab-btn"
               role="tab"
               aria-controls="${callerPluginName}"
               href="#${callerPluginName}">
               <svg class="UppyModalTab-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414">
                 <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z"></path>
               </svg>
              <span class="UppyModalTab-name">${callerPluginName}</span>
            </button>
          </li>
        `

        this.initEvents()

        return `#${callerPluginName}`
      default:
        let msg = 'Error: Modal can only be used by plugins of types: selecter, progress'
        this.core.log(msg)
        break
    }
  }

  render () {
    // http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog

    return `
      <div class="UppyModal">
        <div class="UppyModal-inner"
             aria-hidden="true"
             aria-labelledby="modalTitle"
             aria-describedby="modalDescription"
             role="dialog">

          <button class="UppyModal-close" title="Close uploader modal" data-modal-hide>×</button>

          <ul class="UppyModalTabs" role="tablist"></ul>

          <div class="UppyModalСontent"></div>

          <div class="UppyModal-progressContainer">
            progress here
          </div>
        </div>
      </div>
    `
  }

  hideAllTabPanels () {
    this.tabPanels.forEach(tabPanel => {
      tabPanel.style.display = 'none'
    })
  }

  showTabPanel (id) {
    const tabPanel = document.querySelector(id)
    tabPanel.style.display = 'block'
  }

  initEvents () {
    const tabs = Utils.qsa('.UppyModalTab-btn')
    this.tabPanels = []
    tabs.forEach(tab => {
      const tabId = tab.getAttribute('href')
      const tabPanel = document.querySelector(tabId)
      this.tabPanels.push(tabPanel)

      tab.addEventListener('click', event => {
        event.preventDefault()
        console.log(tabId)
        // this.core.getPlugin(tabId.substr(1)).focus()
        this.hideAllTabPanels()
        this.showTabPanel(tabId)
      })
    })

    this.hideAllTabPanels()
  }

  install () {
    const node = document.createElement('div')
    node.innerHTML = this.render()
    this.container.appendChild(node)
    this.initEvents()
  }
}
