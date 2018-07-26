const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const DriveProviderViews = require('./DriveProviderViews')
const { h } = require('preact')

module.exports = class GoogleDrive extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'GoogleDrive'
    Provider.initPlugin(this, opts)
    this.title = 'Google Drive'
    this.icon = () =>
      <svg aria-hidden="true" class="UppyIcon UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16">
        <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z" />
      </svg>

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
    return <img src={item.iconLink} />
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
    // If the user has access to any Team Drives, handle them as needed.
    if (state.plugins[this.id].hasTeamDrives) {
      let folders = state.plugins[this.id].folders

      // Add Team Drive id parameter to any folders within Team Drives.
      // This is needed in order to retrieve file lists.
      folders.forEach((folder) => {
        if (folder.teamDriveId) {
          folder.id += `?teamDriveId=${folder.teamDriveId}`
          delete folder.teamDriveId
        }
      })

      // Remove any Team Drives we've previously pushed into the list of folders.
      folders = folders.filter((folder) => {
        return folder.kind !== 'drive#teamDrive'
      })

      // If viewing the Google Drive root, add Team Drives to the top of the list.
      if (state.plugins[this.id].directories.length === 1) {
        state.plugins[this.id].teamDrives.forEach((teamDrive) => {
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
      state.plugins[this.id].folders = folders
    }
    return this.view.render(state)
  }
}
