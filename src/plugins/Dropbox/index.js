import Plugin from '../Plugin'
import 'whatwg-fetch'
import html from '../../core/html'

import Provider from '../../uppy-base/src/plugins/Provider'

import View from '../../generic-provider-views/index'

export default class Dropbox extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'Dropbox'
    this.title = 'Dropbox'
    this.stateId = 'dropbox'
    this.icon = html`
      <svg class="UppyIcon UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16">
        <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z"/>
      </svg>
    `

    this.Dropbox = new Provider({
      host: this.opts.host,
      provider: 'dropbox'
    })

    this.files = []

    // Visual
    this.render = this.render.bind(this)

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  install () {
    this.view = new View(this)
    // Set default state for Google Drive
    this.core.setState({
      dropbox: {
        authenticated: false,
        files: [],
        folders: [],
        directories: [{
          title: 'My Drive',
          id: 'auto'
        }],
        activeRow: -1,
        filterInput: ''
      }
    })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    this.Dropbox.auth()
      .then((authenticated) => {
        this.updateState({authenticated})
        if (authenticated) {
          return this.view.getFolder()
        }

        return authenticated
      })
      .then((newState) => {
        this.updateState(newState)
      })

    return
  }

  /**
   * Little shorthand to update the state with my new state
   */
  updateState (newState) {
    const {state} = this.core
    const dropbox = Object.assign({}, state.dropbox, newState)

    this.core.setState({dropbox})
  }

  isFolder (item) {
    return item.is_dir
  }

  getFileData (file) {
    return Object.assign({}, file, {size: file.bytes})
  }

  getFileName (file) {
    return file.path.substring(1)
  }

  getMimeType (file) {
    return file.mime_type
  }

  getFileId (file) {
    return file.rev
  }

  getFileRequestPath (file) {
    return encodeURIComponent(this.getFileName(file))
  }

  getFileModifiedDate (file) {
    return file.modified
  }

  /**
   * Removes session token on client side.
   */
  logout () {
    this.Dropbox.logout(location.href)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          console.log('ok')
          const newState = {
            authenticated: false,
            files: [],
            folders: [],
            directories: [{
              title: 'My Drive',
              id: 'auto'
            }]
          }

          this.updateState(newState)
        }
      })
  }

  render (state) {
    return this.view.render(state)
  }
}
