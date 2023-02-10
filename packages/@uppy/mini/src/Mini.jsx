import { h, Fragment } from 'preact'
import { UIPlugin } from '@uppy/core'
import toArray from '@uppy/utils/lib/toArray'
import getDroppedFiles from '@uppy/utils/lib/getDroppedFiles'

import packageJson from '../package.json'
import locale from './locale.js'

const myDeviceIcon = (
  <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
    <g fill="none" fillRule="evenodd">
      <rect className="uppy-ProviderIconBg" width="32" height="32" rx="16" fill="#2275D7" />
      <path d="M21.973 21.152H9.863l-1.108-5.087h14.464l-1.246 5.087zM9.935 11.37h3.958l.886 1.444a.673.673 0 0 0 .585.316h6.506v1.37H9.935v-3.13zm14.898 3.44a.793.793 0 0 0-.616-.31h-.978v-2.126c0-.379-.275-.613-.653-.613H15.75l-.886-1.445a.673.673 0 0 0-.585-.316H9.232c-.378 0-.667.209-.667.587V14.5h-.782a.793.793 0 0 0-.61.303.795.795 0 0 0-.155.663l1.45 6.633c.078.36.396.618.764.618h13.354c.36 0 .674-.246.76-.595l1.631-6.636a.795.795 0 0 0-.144-.675z" fill="#FFF" />
    </g>
  </svg>
)

export default class DragDrop extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'DashboardMini'
    this.title = 'Dashboard Mini'

    this.defaultLocale = locale

    // Default options, must be kept in sync with @uppy/react/src/DragDrop.js.
    const defaultOpts = {

    }

    // Merge default options with the ones set by user
    this.opts = { ...defaultOpts, ...opts }

    this.i18nInit()
  }

  addFiles = (files) => {
    const descriptors = files.map(file => ({
      source: this.id,
      name: file.name,
      type: file.type,
      data: file,
      meta: {
        // path of the file relative to the ancestor directory the user selected.
        // e.g. 'docs/Old Prague/airbnb.pdf'
        relativePath: file.relativePath || null,
      },
    }))

    try {
      this.uppy.addFiles(descriptors)
    } catch (err) {
      this.uppy.log(err)
    }
  }

  onInputChange = (event) => {
    const files = toArray(event.target.files)
    if (files.length > 0) {
      this.uppy.log('[DragDrop] Files selected through input')
      this.addFiles(files)
    }

    // We clear the input after a file is selected, because otherwise
    // change event is not fired in Chrome and Safari when a file
    // with the same name is selected.
    // ___Why not use value="" on <input/> instead?
    //    Because if we use that method of clearing the input,
    //    Chrome will not trigger change if we drop the same file twice (Issue #768).
    // eslint-disable-next-line no-param-reassign
    event.target.value = null
  }

  handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()

    // Check if the "type" of the datatransfer object includes files. If not, deny drop.
    const { types } = event.dataTransfer
    const hasFiles = types.some(type => type === 'Files')
    const { allowNewUpload } = this.uppy.getState()
    if (!hasFiles || !allowNewUpload) {
      // eslint-disable-next-line no-param-reassign
      event.dataTransfer.dropEffect = 'none'
      clearTimeout(this.removeDragOverClassTimeout)
      return
    }

    // Add a small (+) icon on drop
    // (and prevent browsers from interpreting this as files being _moved_ into the browser
    // https://github.com/transloadit/uppy/issues/1978)
    //
    // eslint-disable-next-line no-param-reassign
    event.dataTransfer.dropEffect = 'copy'

    clearTimeout(this.removeDragOverClassTimeout)
    this.setPluginState({ isDraggingOver: true })

    this.opts.onDragOver?.(event)
  }

  handleDragLeave = (event) => {
    event.preventDefault()
    event.stopPropagation()

    clearTimeout(this.removeDragOverClassTimeout)
    // Timeout against flickering, this solution is taken from drag-drop library.
    // Solution with 'pointer-events: none' didn't work across browsers.
    this.removeDragOverClassTimeout = setTimeout(() => {
      this.setPluginState({ isDraggingOver: false })
    }, 50)

    this.opts.onDragLeave?.(event)
  }

  handleDrop = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    clearTimeout(this.removeDragOverClassTimeout)

    // Remove dragover class
    this.setPluginState({ isDraggingOver: false })

    const logDropError = (error) => {
      this.uppy.log(error, 'error')
    }

    // Add all dropped files
    const files = await getDroppedFiles(event.dataTransfer, { logDropError })
    if (files.length > 0) {
      this.uppy.log('[Mini] Files dropped')
      this.addFiles(files)
    }

    this.opts.onDrop?.(event)
  }

  renderHiddenFileInput () {
    const { restrictions } = this.uppy.opts
    return (
      <input
        className="uppy-mini-hiddenInput"
        type="file"
        hidden
        ref={(ref) => { this.fileInputRef = ref }}
        name={this.opts.inputName}
        multiple={restrictions.maxNumberOfFiles !== 1}
        accept={restrictions.allowedFileTypes}
        onChange={this.onInputChange}
      />
    )
  }

  handleSelectChange = (ev) => {
    const selected = ev.target.value
    if (selected === 'myDevice') {
      this.fileInputRef.click()
      return
    }
    const dashboard = this.uppy.getPlugin('Dashboard')
    dashboard.showPanel(selected)
    dashboard.openModal()
  }

  toggleSourcesDropdown = () => {
    this.sourcesDropdown.toggleAttribute('hidden')
    this.sourcesDropdown.toggleAttribute('aria-expanded')
  }

  renderSelectControl = () => {
    return (
      <>
        Drag & drop or
        {' '}
        <button
          type="button"
          class="uppy-u-reset uppy-Mini-browse"
          onClick={this.toggleSourcesDropdown}
        >
          Browse...
        </button>
      </>
    )
  }

  renderSourcesDropdown () {
    const dashboard = this.uppy.getPlugin('Dashboard')
    const dashboardPlugins = dashboard
      .getPluginState().targets
      .filter(plugin => plugin.type === 'acquirer')
      .map(plugin => {
        const { icon } = this.uppy.getPlugin(plugin.id)
        return {
          ...plugin,
          icon: icon || dashboard.opts.defaultPickerIcon,
        }
      })

    return (
      <div
        class="uppy-Mini-sources"
        hidden="true"
        aria-haspopup="true"
        ref={(dom) => { this.sourcesDropdown = dom }}
      >
        <ul class="uppy-u-reset uppy-Mini-sourcesList">
          <li class="uppy-u-reset">
            <button
              class="uppy-u-reset"
              type="button"
              value="myDevice"
              onClick={this.handleSelectChange}
            >
              {myDeviceIcon}
              My Device
            </button>
          </li>
          {dashboardPlugins.map(plugin => {
            return (
              <li class="uppy-u-reset">
                <button
                  class="uppy-u-reset"
                  type="button"
                  value={plugin.id}
                  onClick={this.handleSelectChange}
                >
                  {plugin.icon()}
                  {plugin.name}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  renderSelected (files, complete) {
    const singleFile = () => {
      const file = files[0]
      return (
        <>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={file.preview} width="40" />
          <span class="uppy-Mini-selectedName">{file.name}</span>
        </>
      )
    }

    const multipleFiles = () => {
      const fileNames = files.map(file => file.name.substring(0, 15)).join(', ')
      const filesWithPreviewElements = files.map(file => {
        /* eslint-disable-next-line jsx-a11y/alt-text */
        return <img src={file.preview} width="40" />
      })
      return (
        <>
          {filesWithPreviewElements}
          <span class="uppy-Mini-selectedName">{files.length} files: {fileNames}</span>
        </>
      )
    }

    return (
      <div class="uppy-Mini-selected">
        {files.length === 1
          ? singleFile()
          : multipleFiles()}
        {' '}
        {!complete && (
          <button
            type="button"
            class="uppy-u-reset btn-close uppy-Mini-remove"
            onClick={() => this.uppy.cancelAll()}
          >
            Remove
          </button>
        )}
      </div>
    )
  }

  renderProgress = (totalProgress) => {
    const complete = totalProgress === 100
    return (
      <div
        class={`uppy-Mini-progress ${complete ? 'uppy-Mini-progress--complete' : ''}`}
        style={{ width: `${totalProgress}%` }}
      />
    )
  }

  render = () => {
    const files = this.uppy.getFiles()
    const { totalProgress } = this.uppy.getState()
    const complete = totalProgress === 100

    return (
      <div
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
        class={`uppy-Mini ${complete ? 'uppy-Mini--complete' : ''}`}
      >
        <div class="uppy-Mini-bar">
          {files.length === 0 && this.renderSelectControl()}
          {this.renderHiddenFileInput()}
          {files.length !== 0 && this.renderSelected(files, complete)}
          {this.renderProgress(totalProgress)}
        </div>
        {files.length === 0 && this.renderSourcesDropdown()}
      </div>
    )
  }

  install () {
    const { target } = this.opts

    if (target) {
      this.mount(target, this)
    }

    // document.addEventListener('click', (ev) => {
    //   if (ev.target !== this.sourcesDropdown && !this.sourcesDropdown.hidden) {
    //     this.toggleSourcesDropdown()
    //   }
    // })

    this.uppy.on('dashboard:hide-all-panels', () => {
      const dashboard = this.uppy.getPlugin('Dashboard')
      dashboard.closeModal()
    })
  }

  uninstall () {
    this.unmount()
  }
}
