import Plugin from './Plugin'
import yo from 'yo-yo'

/**
 * Progress drawer
 *
 */
export default class ProgressDrawer extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.name = 'Progress Drawer'
    this.type = 'progressindicator'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  update (state) {
    var newEl = this.render(state)
    yo.update(this.el, newEl)
  }

  render (state) {
    const selectedFiles = state.selectedFiles
    // this.core.log(selectedFiles)
    const selectedFileCount = Object.keys(selectedFiles).length
    const isSomethingSelected = selectedFileCount > 0

    const drawerItem = (fileID) => {
      const isUploaded = selectedFiles[fileID].progress === 100

      const remove = (ev) => {
        this.core.emitter.emit('file-remove', fileID)
      }

      const checkIcon = yo`<svg class="UppyProgressDrawer-itemCheck" width="16" height="16" viewBox="0 0 32 32" enable-background="new 0 0 32 32">
          <polygon points="2.836,14.708 5.665,11.878 13.415,19.628 26.334,6.712 29.164,9.54 13.415,25.288 "></polygon>
        </svg>`

      return yo`<li class="UppyProgressDrawer-item ${isUploaded ? 'is-uploaded' : ''}">
        <span class="UppyProgressDrawer-itemProgress"
              style="width: ${selectedFiles[fileID].progress}%"></span>
        <h4 class="UppyProgressDrawer-itemName">
          ${selectedFiles[fileID].name} (${selectedFiles[fileID].progress})</h4>
        ${checkIcon}
        <button class="UppyProgressDrawer-itemRemove" onclick=${remove}>×</button>
      </li>`
    }

    return yo`<div class="UppyProgressDrawer ${isSomethingSelected ? 'is-visible' : ''}">
      <div class="UppyProgressDrawer-status">
        ${isSomethingSelected ? this.core.i18n('uploadFiles', {'smart_count': selectedFileCount}) : ''}
      </div>
      <ul class="UppyProgressDrawer-list">
        ${Object.keys(selectedFiles).map((fileID) => {
          return drawerItem(fileID)
        })}
      </ul>
    </div>`
  }

  install () {
    this.el = this.render(this.core.state)
    const caller = this

    this.target = this.getTarget(this.opts.target, caller)
    document.querySelector(this.target).appendChild(this.el)

    return
  }
}
