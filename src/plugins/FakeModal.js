import Plugin from './Plugin'
// import Utils from '../core/Utils'

function $$ (selector, context) {
  return Array.prototype.slice.call((context || document).querySelectorAll(selector) || [])
}

/**
 * FakeModal
 *
 */
export default class FakeModal extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'view'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.targets = {}

    this.targets.spinner = '.UppyDragDrop-One-Spinner'

    this.container = document.body
  }

  prepareTarget (callerPlugin) {
    const callerPluginName = callerPlugin.constructor.name

    // add tab panel
    const modalContent = document.querySelector('.UppyModal-content')
    const nodeForPlugin = document.createElement('div')

    modalContent.appendChild(nodeForPlugin)
    nodeForPlugin.outerHTML = `
      <div role="tabpanel"
           class="UppyModal-panel"
           id="${callerPluginName}">
      </div>
    `

    // add tab
    const modalTabs = document.querySelector('.UppyModal-tabList')
    const modalTab = document.createElement('div')

    modalTabs.appendChild(modalTab)
    modalTab.outerHTML = `
      <li><a role="tab"
         aria-controls="${callerPluginName}"
         class="UppyModal-tab"
         href="#${callerPluginName}">
         ${callerPluginName}
      </a></li>
    `

    console.log('yoyoyoyoy')

    this.initEvents()

    return document.querySelector(`#${callerPluginName}`)
  }

  render () {
    // http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog

    return `
      <div class="UppyModal"
           aria-hidden="true"
           aria-labelledby="modalTitle"
           aria-describedby="modalDescription"
           role="dialog">

        <button data-modal-hide class="UppyModal-close" title="Close uploader modal">×</button>

        <ul role="tablist" class="UppyModal-tabList">
          <li><a role="tab" aria-controls="dragdrop" class="UppyModal-tab" href="#dragdrop">Dizzy</a></li>
          <li><a role="tab" aria-controls="dropbox" class="UppyModal-tab" href="#dropbox">Ninja</a></li>
          <li><a role="tab" aria-controls="instagram" class="UppyModal-tab" href="#instagram">Missy</a></li>
        </ul>

        <div class="UppyModal-content">
          <div role="tabpanel" class="UppyModal-panel" id="dragdrop">
            123
          </div>
          <div role="tabpanel" class="UppyModal-panel" id="dropbox">
            456
          </div>
          <div role="tabpanel" class="UppyModal-panel" id="instagram">
            789
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
    const tabs = $$('.UppyModal-tab')
    this.tabPanels = []
    tabs.forEach(tab => {
      const tabId = tab.getAttribute('href')
      const tabPanel = document.querySelector(tabId)
      this.tabPanels.push(tabPanel)

      tab.addEventListener('click', event => {
        event.preventDefault()
        console.log(tabId)
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
