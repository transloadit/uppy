const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const ProviderViews = require('@uppy/provider-views')
const { h } = require('preact')

module.exports = class GoogleDrive extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'GoogleDrive'
    this.title = this.opts.title || 'Google Drive'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'Google Drive'
    this.icon = () => (
      <svg aria-hidden="true" width="18px" height="16px" viewBox="0 0 18 16" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <g fill-rule="evenodd">
          <polygon fill="#3089FC" points="6.32475 10.2 18 10.2 14.999625 15.3 3.324375 15.3" />
          <polygon fill="#00A85D" points="3.000375 15.3 0 10.2 5.83875 0.275974026 8.838 5.37597403 5.999625 10.2" />
          <polygon fill="#FFD024" points="11.838375 9.92402597 5.999625 0 12.000375 0 17.839125 9.92402597" />
        </g>
      </svg>
    )

    this[this.id] = new Provider(uppy, {
      serverUrl: this.opts.serverUrl,
      serverHeaders: this.opts.serverHeaders,
      provider: 'drive',
      authProvider: 'google'
    })

    this.onAuth = this.onAuth.bind(this)
    this.render = this.render.bind(this)
  }

  install () {
    this.view = new ProviderViews(this)
    // Set default state for Google Drive
    this.setPluginState({
      authenticated: false,
      files: [],
      folders: [],
      directories: [],
      activeRow: -1,
      filterInput: '',
      isSearchVisible: false
    })

    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.view.tearDown()
    this.unmount()
  }

  onAuth (authenticated) {
    this.setPluginState({ authenticated })
    if (authenticated) {
      this.view.getFolder('root')
    }
  }

  getUsername (data) {
    for (const item of data.files) {
      if (item.ownedByMe) {
        for (const permission of item.permissions) {
          if (permission.role === 'owner') {
            return permission.emailAddress
          }
        }
      }
    }
  }

  isFolder (item) {
    return item.mimeType === 'application/vnd.google-apps.folder'
  }

  getItemData (item) {
    return Object.assign({}, item, {size: parseFloat(item.size)})
  }

  getItemIcon (item) {
    return item.iconLink
  }

  getItemSubList (item) {
    return item.files.filter((i) => {
      return this.isFolder(i) || !i.mimeType.startsWith('application/vnd.google')
    })
  }

  getItemName (item) {
    return item.name ? item.name : '/'
  }

  getMimeType (item) {
    return item.mimeType
  }

  getItemId (item) {
    return item.id
  }

  getItemRequestPath (item) {
    return this.getItemId(item)
  }

  getItemModifiedDate (item) {
    return item.modifiedTime
  }

  getItemThumbnailUrl (item) {
    return `${this.opts.serverUrl}/${this.GoogleDrive.id}/thumbnail/${this.getItemRequestPath(item)}`
  }

  render (state) {
    return this.view.render(state)
  }
}
