import Plugin from './Plugin'
import yo from 'yo-yo'

/**
 * Progress drawer
 *
 */
export default class ProgressDrawer extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'ProgressDrawer'
    this.title = 'Progress Drawer'
    this.type = 'progressindicator'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  drawerItem (file) {
    const isUploaded = file.progress === 100

    const remove = (ev) => {
      this.core.emitter.emit('file-remove', file.id)
    }

    const checkIcon = yo`<svg class="UppyProgressDrawer-itemCheck" width="16" height="16" viewBox="0 0 32 32" enable-background="new 0 0 32 32">
        <polygon points="2.836,14.708 5.665,11.878 13.415,19.628 26.334,6.712 29.164,9.54 13.415,25.288 "></polygon>
      </svg>`

    return yo`<li id="${file.id}" class="UppyProgressDrawer-item"
                  title="${file.name}">
      <div class="UppyProgressDrawer-itemInfo">
        <svg width="34" height="44" viewBox="0 0 21 29">
          <path d="M2.473.31C1.44.31.59 1.21.59 2.307V26.31c0 1.097.85 2 1.883 2H18.71c1.03 0 1.88-.903 1.88-2V7.746a.525.525 0 0 0-.014-.108v-.015a.51.51 0 0 0-.014-.03v-.017a.51.51 0 0 0-.015-.03.482.482 0 0 0-.014-.016v-.015a.482.482 0 0 0-.015-.015.51.51 0 0 0-.014-.03.482.482 0 0 0-.014-.017.51.51 0 0 0-.015-.03.483.483 0 0 0-.03-.03L13.636.45a.47.47 0 0 0-.118-.093.448.448 0 0 0-.044-.015.448.448 0 0 0-.044-.016.448.448 0 0 0-.045-.015.44.44 0 0 0-.073 0H2.474zm0 .99h10.372v4.943c0 1.097.85 2 1.88 2h4.932V26.31c0 .56-.42 1.007-.948 1.007H2.472c-.527 0-.95-.446-.95-1.007V2.308c0-.56.423-1.008.95-1.008zm11.305.667l4.843 4.927.352.357h-4.246c-.527 0-.948-.446-.948-1.007V1.967z"
                fill="#F6A623"
                fill-rule="evenodd" />
          <text font-family="ArialMT, Arial"
                font-size="5"
                font-weight="bold"
                fill="#F6A623"
                text-anchor="middle"
                x="11"
                y="22">
            ${file.type.specific ? file.type.specific.toUpperCase() : '?'}
          </text>
          </svg>
      </div>
      <div class="UppyProgressDrawer-itemInner">
        <h4 class="UppyProgressDrawer-itemName">
          ${file.uploadURL
            ? yo`<a href="${file.uploadURL}" target="_blank">${file.name}</a>`
            : yo`<span>${file.name}</span>`
          }
          <br>
        </h4>
        <h5 class="UppyProgressDrawer-itemStatus">
          ${file.progress > 0 && file.progress < 100 ? 'Uploading… ' + file.progress + '%' : ''}
          ${file.progress === 100 ? 'Completed' : ''}
        </h5>
          ${isUploaded ? checkIcon : ''}
          ${isUploaded
            ? ''
            : yo`<button class="UppyProgressDrawer-itemRemove" onclick=${remove}>×</button>`
          }
          <div class="UppyProgressDrawer-itemProgress"
               style="width: ${file.progress}%"></div>
      </div>
    </li>`
  }

  render (state) {
    const files = state.files

    const selectedFiles = Object.keys(files).filter((file) => {
      return files[file].progress !== 100
    })

    const uploadedFiles = Object.keys(files).filter((file) => {
      return files[file].progress === 100
    })

    const selectedFileCount = Object.keys(selectedFiles).length
    const uploadedFileCount = Object.keys(uploadedFiles).length

    const isSomethingSelected = selectedFileCount > 0
    const isSomethingUploaded = uploadedFileCount > 0
    const isSomethingSelectedOrUploaded = isSomethingSelected || isSomethingUploaded

    const autoProceed = this.core.opts.autoProceed

    const next = (ev) => {
      this.core.emitter.emit('next')
    }

    return yo`<div class="UppyProgressDrawer ${isSomethingSelectedOrUploaded ? 'is-visible' : ''}">
      <ul class="UppyProgressDrawer-list">
        ${Object.keys(files).map((fileID) => {
          return this.drawerItem(files[fileID])
        })}
      </ul>
      ${autoProceed
        ? ''
        : yo`<button class="UppyProgressDrawer-upload ${isSomethingSelected ? 'is-active' : ''}"
                     type="button"
                     onclick=${next}>
          ${isSomethingSelected
            ? this.core.i18n('uploadFiles', {'smart_count': selectedFileCount})
            : this.core.i18n('selectToUpload')
          }
        </button>`
      }
    </div>`

    // TODO: add this info to the upload button?
    //    <div class="UppyProgressDrawer-status">
    //      ${isSomethingSelected ? this.core.i18n('filesChosen', {'smart_count': selectedFileCount}) : ''}
    //      ${isSomethingSelected && isSomethingUploaded ? ', ' : ''}
    //      ${isSomethingUploaded ? this.core.i18n('filesUploaded', {'smart_count': uploadedFileCount}) : ''}
    //    </div>
  }

  install () {
    this.el = this.render(this.core.state)
    this.target = this.getTarget(this.opts.target, this, this.el, this.render.bind(this))
  }
}
