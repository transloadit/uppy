const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const DriveProviderViews = require('./DriveProviderViews')
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
    this.view = new DriveProviderViews(this)
    // Set default state for Google Drive
    this.setPluginState({
      authenticated: false,
      files: [],
      folders: [],
      directories: [],
      activeRow: -1,
      filterInput: '',
      isSearchVisible: false,
      hasTeamDrives: false,
      teamDrives: [],
      teamDriveId: ''
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
      this.getTeamDrives()
    }
  }

  getTeamDrives () {
    this[this.id].get(`${this.GoogleDrive.id}/list/?listTeamDrives=true`)
      .then((payload) => {
        if (payload.teamDrives && payload.teamDrives.length) {
          this.setPluginState({hasTeamDrives: true, teamDrives: payload.teamDrives})
        }
      })
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
    // If it's from a Team Drive, add the Team Drive ID as a query param.
    // The server needs the Team Drive ID to list files in a Team Drive folder.
    if (item.teamDriveId) {
      item.id += `?teamDriveId=${item.teamDriveId}`
      delete item.teamDriveId
    }

    return this.getItemId(item)
  }

  getItemModifiedDate (item) {
    return item.modifiedTime
  }

  getItemThumbnailUrl (item) {
    return `${this.opts.serverUrl}/${this.GoogleDrive.id}/thumbnail/${this.getItemRequestPath(item)}`
  }

  render (state) {
    let pluginState = this.getPluginState()

    // If the user has access to any Team Drives, handle them as needed.
    if (pluginState.hasTeamDrives) {
      let folders = pluginState.folders

      // Remove any Team Drives we've previously pushed into the list of folders.
      folders = folders.filter((folder) => {
        return folder.kind !== 'drive#teamDrive'
      })

      // If viewing the Google Drive root, add Team Drives to the top of the list.
      if (pluginState.directories.length === 1) {
        pluginState.teamDrives.forEach((teamDrive) => {
          folders.splice(0, 0, {
            // Instead of a "normal" id, set it as a query param which will be handled by the server.
            id: '?teamDriveId=' + teamDrive.id,
            name: teamDrive.name,
            kind: teamDrive.kind,
            // Team Drives don't offer an icon, but do have a background image.
            // The extra bit added onto the end crops/resizes the background image, yielding the same icon
            // which is shown in the list of Team Drives within the Google Drive web UI.
            iconLink: teamDrive.backgroundImageLink + '=w16-h16-n'
          })
        })
      }
      pluginState.folders = folders
    }
    return this.view.render(state)
  }
}
