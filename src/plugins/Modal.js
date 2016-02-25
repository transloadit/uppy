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
          <li>
            <button class="UppyModalTabs-tab"
               role="tab"
               aria-controls="${callerPluginName}"
               href="#${callerPluginName}">
              ${callerPluginName}
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

          <ul class="UppyModalTabs" role="tablist">
            <li><button class="UppyModalTabs-tab" role="tab" aria-controls="dragdrop" href="#dragdrop">Dizzy</button></li>
            <li><button class="UppyModalTabs-tab" role="tab" aria-controls="dropbox" href="#dropbox">Ninja</button></li>
            <li><button class="UppyModalTabs-tab" role="tab" aria-controls="instagram" href="#instagram">Missy</button></li>
          </ul>

          <div class="UppyModalСontent">
            <div class="UppyModalContent-panel" role="tabpanel" id="dragdrop">
              123
            </div>
            <div class="UppyModalContent-panel" role="tabpanel" id="dropbox">
              456
            </div>
            <div class="UppyModalContent-panel" role="tabpanel" id="instagram">
              789
            </div>
          </div>
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
    const tabs = Utils.qsa('.UppyModalTabs-tab')
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
