const { h } = require('preact')
const AuthView = require('./AuthView')
const Header = require('./Header')
const Browser = require('../Browser')
const LoaderView = require('../Loader')
const generateFileID = require('@uppy/utils/lib/generateFileID')
const getFileType = require('@uppy/utils/lib/getFileType')
const isPreviewSupported = require('@uppy/utils/lib/isPreviewSupported')
const SharedHandler = require('../SharedHandler')
const CloseWrapper = require('../CloseWrapper')

/**
 * Array.prototype.findIndex ponyfill for old browsers.
 */
function findIndex (array, predicate) {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) return i
  }
  return -1
}

// location.origin does not exist in IE
function getOrigin () {
  if ('origin' in location) {
    return location.origin // eslint-disable-line compat/compat
  }
  return `${location.protocol}//${location.hostname}${location.port ? `:${location.port}` : ''}`
}

/**
 * Class to easily generate generic views for Provider plugins
 */
module.exports = class ProviderView {
  static VERSION = require('../../package.json').version

  /**
   * @param {object} plugin instance of the plugin
   * @param {object} opts
   */
  constructor (plugin, opts) {
    this.plugin = plugin
    this.provider = opts.provider
    this._sharedHandler = new SharedHandler(plugin)

    // set default options
    const defaultOptions = {
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true
    }

    // merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    // Logic
    this.addFile = this.addFile.bind(this)
    this.filterQuery = this.filterQuery.bind(this)
    this.getFolder = this.getFolder.bind(this)
    this.getNextFolder = this.getNextFolder.bind(this)
    this.logout = this.logout.bind(this)
    this.preFirstRender = this.preFirstRender.bind(this)
    this.handleAuth = this.handleAuth.bind(this)
    this.sortByTitle = this.sortByTitle.bind(this)
    this.sortByDate = this.sortByDate.bind(this)
    this.handleError = this.handleError.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.listAllFiles = this.listAllFiles.bind(this)
    this.donePicking = this.donePicking.bind(this)
    this.cancelPicking = this.cancelPicking.bind(this)
    this.clearSelection = this.clearSelection.bind(this)

    // Visual
    this.render = this.render.bind(this)

    this.clearSelection()

    // Set default state for the plugin
    this.plugin.setPluginState({
      authenticated: false,
      files: [],
      folders: [],
      directories: [],
      filterInput: '',
      isSearchVisible: false
    })
  }

  tearDown () {
    // Nothing.
  }

  _updateFilesAndFolders (res, files, folders) {
    this.nextPagePath = res.nextPagePath
    res.items.forEach((item) => {
      if (item.isFolder) {
        folders.push(item)
      } else {
        files.push(item)
      }
    })

    this.plugin.setPluginState({ folders, files })
  }

  /**
   * Called only the first time the provider view is rendered.
   * Kind of like an init function.
   */
  preFirstRender () {
    this.plugin.setPluginState({ didFirstRender: true })
    this.plugin.onFirstRender()
  }

  /**
   * Based on folder ID, fetch a new folder and update it to state
   *
   * @param  {string} id Folder id
   * @returns {Promise}   Folders/files in folder
   */
  getFolder (id, name) {
    return this._sharedHandler.loaderWrapper(
      this.provider.list(id),
      (res) => {
        const folders = []
        const files = []
        let updatedDirectories

        const state = this.plugin.getPluginState()
        const index = findIndex(state.directories, (dir) => id === dir.id)

        if (index !== -1) {
          updatedDirectories = state.directories.slice(0, index + 1)
        } else {
          updatedDirectories = state.directories.concat([{ id, title: name }])
        }

        this.username = res.username || this.username
        this._updateFilesAndFolders(res, files, folders)
        this.plugin.setPluginState({ directories: updatedDirectories })
      },
      this.handleError)
  }

  /**
   * Fetches new folder
   *
   * @param  {object} folder
   */
  getNextFolder (folder) {
    this.getFolder(folder.requestPath, folder.name)
    this.lastCheckbox = undefined
  }

  addFile (file) {
    const tagFile = {
      id: this.providerFileToId(file),
      source: this.plugin.id,
      data: file,
      name: file.name || file.id,
      type: file.mimeType,
      isRemote: true,
      body: {
        fileId: file.id
      },
      remote: {
        companionUrl: this.plugin.opts.companionUrl,
        url: `${this.provider.fileUrl(file.requestPath)}`,
        body: {
          fileId: file.id
        },
        providerOptions: this.provider.opts
      }
    }

    const fileType = getFileType(tagFile)
    // TODO Should we just always use the thumbnail URL if it exists?
    if (fileType && isPreviewSupported(fileType)) {
      tagFile.preview = file.thumbnail
    }
    this.plugin.uppy.log('Adding remote file')
    try {
      this.plugin.uppy.addFile(tagFile)
      return true
    } catch (err) {
      if (!err.isRestriction) {
        this.plugin.uppy.log(err)
      }
      return false
    }
  }

  /**
   * Removes session token on client side.
   */
  logout () {
    this.provider.logout()
      .then((res) => {
        if (res.ok) {
          if (!res.revoked) {
            const message = this.plugin.uppy.i18n('companionUnauthorizeHint', {
              provider: this.plugin.title,
              url: res.manual_revoke_url
            })
            this.plugin.uppy.info(message, 'info', 7000)
          }

          const newState = {
            authenticated: false,
            files: [],
            folders: [],
            directories: []
          }
          this.plugin.setPluginState(newState)
        }
      }).catch(this.handleError)
  }

  filterQuery (e) {
    const state = this.plugin.getPluginState()
    this.plugin.setPluginState(Object.assign({}, state, {
      filterInput: e ? e.target.value : ''
    }))
  }

  sortByTitle () {
    const state = Object.assign({}, this.plugin.getPluginState())
    const { files, folders, sorting } = state

    const sortedFiles = files.sort((fileA, fileB) => {
      if (sorting === 'titleDescending') {
        return fileB.name.localeCompare(fileA.name)
      }
      return fileA.name.localeCompare(fileB.name)
    })

    const sortedFolders = folders.sort((folderA, folderB) => {
      if (sorting === 'titleDescending') {
        return folderB.name.localeCompare(folderA.name)
      }
      return folderA.name.localeCompare(folderB.name)
    })

    this.plugin.setPluginState(Object.assign({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: (sorting === 'titleDescending') ? 'titleAscending' : 'titleDescending'
    }))
  }

  sortByDate () {
    const state = Object.assign({}, this.plugin.getPluginState())
    const { files, folders, sorting } = state

    const sortedFiles = files.sort((fileA, fileB) => {
      const a = new Date(fileA.modifiedDate)
      const b = new Date(fileB.modifiedDate)

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0
      }
      return a > b ? 1 : a < b ? -1 : 0
    })

    const sortedFolders = folders.sort((folderA, folderB) => {
      const a = new Date(folderA.modifiedDate)
      const b = new Date(folderB.modifiedDate)

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0
      }

      return a > b ? 1 : a < b ? -1 : 0
    })

    this.plugin.setPluginState(Object.assign({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: (sorting === 'dateDescending') ? 'dateAscending' : 'dateDescending'
    }))
  }

  sortBySize () {
    const state = Object.assign({}, this.plugin.getPluginState())
    const { files, sorting } = state

    // check that plugin supports file sizes
    if (!files.length || !this.plugin.getItemData(files[0]).size) {
      return
    }

    const sortedFiles = files.sort((fileA, fileB) => {
      const a = fileA.size
      const b = fileB.size

      if (sorting === 'sizeDescending') {
        return a > b ? -1 : a < b ? 1 : 0
      }
      return a > b ? 1 : a < b ? -1 : 0
    })

    this.plugin.setPluginState(Object.assign({}, state, {
      files: sortedFiles,
      sorting: (sorting === 'sizeDescending') ? 'sizeAscending' : 'sizeDescending'
    }))
  }

  /**
   * Adds all files found inside of specified folder.
   *
   * Uses separated state while folder contents are being fetched and
   * mantains list of selected folders, which are separated from files.
   */
  addFolder (folder) {
    const folderId = this.providerFileToId(folder)
    const state = this.plugin.getPluginState()
    const folders = { ...state.selectedFolders }
    if (folderId in folders && folders[folderId].loading) {
      return
    }
    folders[folderId] = { loading: true, files: [] }
    this.plugin.setPluginState({ selectedFolders: { ...folders } })
    return this.listAllFiles(folder.requestPath).then((files) => {
      let count = 0
      files.forEach((file) => {
        const success = this.addFile(file)
        if (success) count++
      })
      const ids = files.map(this.providerFileToId)
      folders[folderId] = {
        loading: false,
        files: ids
      }
      this.plugin.setPluginState({ selectedFolders: folders })

      let message
      if (files.length) {
        message = this.plugin.uppy.i18n('folderAdded', {
          smart_count: count, folder: folder.name
        })
      } else {
        message = this.plugin.uppy.i18n('emptyFolderAdded')
      }
      this.plugin.uppy.info(message)
    }).catch((e) => {
      const state = this.plugin.getPluginState()
      const selectedFolders = { ...state.selectedFolders }
      delete selectedFolders[folderId]
      this.plugin.setPluginState({ selectedFolders })
      this.handleError(e)
    })
  }

  providerFileToId (file) {
    return generateFileID({
      data: file,
      name: file.name || file.id,
      type: file.mimeType
    })
  }

  handleAuth () {
    const authState = btoa(JSON.stringify({ origin: getOrigin() }))
    const clientVersion = encodeURIComponent(`@uppy/provider-views=${ProviderView.VERSION}`)
    const link = `${this.provider.authUrl()}?state=${authState}&uppyVersions=${clientVersion}`

    const authWindow = window.open(link, '_blank')
    const handleToken = (e) => {
      if (!this._isOriginAllowed(e.origin, this.plugin.opts.companionAllowedHosts) || e.source !== authWindow) {
        this.plugin.uppy.log(`rejecting event from ${e.origin} vs allowed pattern ${this.plugin.opts.companionAllowedHosts}`)
        return
      }

      // Check if it's a string before doing the JSON.parse to maintain support
      // for older Companion versions that used object references
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data

      if (!data.token) {
        this.plugin.uppy.log('did not receive token from auth window')
        return
      }

      authWindow.close()
      window.removeEventListener('message', handleToken)
      this.provider.setAuthToken(data.token)
      this.preFirstRender()
    }
    window.addEventListener('message', handleToken)
  }

  _isOriginAllowed (origin, allowedOrigin) {
    const getRegex = (value) => {
      if (typeof value === 'string') {
        return new RegExp(`^${value}$`)
      } else if (value instanceof RegExp) {
        return value
      }
    }

    const patterns = Array.isArray(allowedOrigin) ? allowedOrigin.map(getRegex) : [getRegex(allowedOrigin)]
    return patterns
      .filter((pattern) => pattern != null) // loose comparison to catch undefined
      .some((pattern) => pattern.test(origin) || pattern.test(`${origin}/`)) // allowing for trailing '/'
  }

  handleError (error) {
    const uppy = this.plugin.uppy
    uppy.log(error.toString())
    if (error.isAuthError) {
      return
    }
    const message = uppy.i18n('companionError')
    uppy.info({ message: message, details: error.toString() }, 'error', 5000)
  }

  handleScroll (e) {
    const scrollPos = e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight)
    const path = this.nextPagePath || null

    if (scrollPos < 50 && path && !this._isHandlingScroll) {
      this.provider.list(path)
        .then((res) => {
          const { files, folders } = this.plugin.getPluginState()
          this._updateFilesAndFolders(res, files, folders)
        }).catch(this.handleError)
        .then(() => { this._isHandlingScroll = false }) // always called

      this._isHandlingScroll = true
    }
  }

  listAllFiles (path, files = null) {
    files = files || []
    return new Promise((resolve, reject) => {
      this.provider.list(path).then((res) => {
        res.items.forEach((item) => {
          if (!item.isFolder) {
            files.push(item)
          } else {
            this.addFolder(item)
          }
        })
        const moreFiles = res.nextPagePath || null
        if (moreFiles) {
          return this.listAllFiles(moreFiles, files)
            .then((files) => resolve(files))
            .catch(e => reject(e))
        } else {
          return resolve(files)
        }
      }).catch(e => reject(e))
    })
  }

  donePicking () {
    const { currentSelection } = this.plugin.getPluginState()
    const promises = currentSelection.map((file) => {
      if (file.isFolder) {
        return this.addFolder(file)
      } else {
        return this.addFile(file)
      }
    })

    this._sharedHandler.loaderWrapper(Promise.all(promises), () => {
      this.clearSelection()
    }, () => {})
  }

  cancelPicking () {
    this.clearSelection()

    const dashboard = this.plugin.uppy.getPlugin('Dashboard')
    if (dashboard) dashboard.hideAllPanels()
  }

  clearSelection () {
    this.plugin.setPluginState({ currentSelection: [] })
  }

  render (state, viewOptions = {}) {
    const { authenticated, didFirstRender } = this.plugin.getPluginState()
    if (!didFirstRender) {
      this.preFirstRender()
    }

    // reload pluginState for "loading" attribute because it might
    // have changed above.
    if (this.plugin.getPluginState().loading) {
      return (
        <CloseWrapper onUnmount={this.clearSelection}>
          <LoaderView i18n={this.plugin.uppy.i18n} />
        </CloseWrapper>
      )
    }

    if (!authenticated) {
      return (
        <CloseWrapper onUnmount={this.clearSelection}>
          <AuthView
            pluginName={this.plugin.title}
            pluginIcon={this.plugin.icon}
            handleAuth={this.handleAuth}
            i18n={this.plugin.uppy.i18n}
            i18nArray={this.plugin.uppy.i18nArray}
          />
        </CloseWrapper>
      )
    }

    const targetViewOptions = { ...this.opts, ...viewOptions }
    const headerProps = {
      showBreadcrumbs: targetViewOptions.showBreadcrumbs,
      getFolder: this.getFolder,
      directories: this.plugin.getPluginState().directories,
      pluginIcon: this.plugin.icon,
      title: this.plugin.title,
      logout: this.logout,
      username: this.username,
      i18n: this.plugin.uppy.i18n
    }

    const browserProps = Object.assign({}, this.plugin.getPluginState(), {
      username: this.username,
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      filterItems: this._sharedHandler.filterItems,
      filterQuery: this.filterQuery,
      sortByTitle: this.sortByTitle,
      sortByDate: this.sortByDate,
      logout: this.logout,
      isChecked: this._sharedHandler.isChecked,
      toggleCheckbox: this._sharedHandler.toggleCheckbox,
      handleScroll: this.handleScroll,
      listAllFiles: this.listAllFiles,
      done: this.donePicking,
      cancel: this.cancelPicking,
      headerComponent: Header(headerProps),
      title: this.plugin.title,
      viewType: targetViewOptions.viewType,
      showTitles: targetViewOptions.showTitles,
      showFilter: targetViewOptions.showFilter,
      showBreadcrumbs: targetViewOptions.showBreadcrumbs,
      pluginIcon: this.plugin.icon,
      i18n: this.plugin.uppy.i18n,
      uppyFiles: this.plugin.uppy.getFiles(),
      validateRestrictions: this.plugin.uppy.validateRestrictions
    })

    return (
      <CloseWrapper onUnmount={this.clearSelection}>
        <Browser {...browserProps} />
      </CloseWrapper>
    )
  }
}
