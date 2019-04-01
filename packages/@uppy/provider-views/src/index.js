const { h, Component } = require('preact')
const AuthView = require('./AuthView')
const Browser = require('./Browser')
const LoaderView = require('./Loader')
const generateFileID = require('@uppy/utils/lib/generateFileID')
const getFileType = require('@uppy/utils/lib/getFileType')
const isPreviewSupported = require('@uppy/utils/lib/isPreviewSupported')

/**
 * Array.prototype.findIndex ponyfill for old browsers.
 */
function findIndex (array, predicate) {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) return i
  }
  return -1
}

class CloseWrapper extends Component {
  componentWillUnmount () {
    this.props.onUnmount()
  }

  render () {
    return this.props.children[0]
  }
}

/**
 * Class to easily generate generic views for Provider plugins
 */
module.exports = class ProviderView {
  /**
   * @param {object} instance of the plugin
   */
  constructor (plugin, opts) {
    this.plugin = plugin
    this.provider = opts.provider

    // set default options
    const defaultOptions = {
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // Logic
    this.addFile = this.addFile.bind(this)
    this.filterItems = this.filterItems.bind(this)
    this.filterQuery = this.filterQuery.bind(this)
    this.toggleSearch = this.toggleSearch.bind(this)
    this.getFolder = this.getFolder.bind(this)
    this.getNextFolder = this.getNextFolder.bind(this)
    this.logout = this.logout.bind(this)
    this.preFirstRender = this.preFirstRender.bind(this)
    this.handleAuth = this.handleAuth.bind(this)
    this.handleDemoAuth = this.handleDemoAuth.bind(this)
    this.sortByTitle = this.sortByTitle.bind(this)
    this.sortByDate = this.sortByDate.bind(this)
    this.isActiveRow = this.isActiveRow.bind(this)
    this.isChecked = this.isChecked.bind(this)
    this.toggleCheckbox = this.toggleCheckbox.bind(this)
    this.handleError = this.handleError.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.donePicking = this.donePicking.bind(this)
    this.cancelPicking = this.cancelPicking.bind(this)
    this.clearSelection = this.clearSelection.bind(this)

    // Visual
    this.render = this.render.bind(this)

    this.clearSelection()
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
   * @param  {String} id Folder id
   * @return {Promise}   Folders/files in folder
   */
  getFolder (id, name) {
    return this._loaderWrapper(
      this.provider.list(id),
      (res) => {
        let folders = []
        let files = []
        let updatedDirectories

        const state = this.plugin.getPluginState()
        const index = findIndex(state.directories, (dir) => id === dir.id)

        if (index !== -1) {
          updatedDirectories = state.directories.slice(0, index + 1)
        } else {
          updatedDirectories = state.directories.concat([{id, title: name}])
        }

        this.username = this.username ? this.username : res.username
        this._updateFilesAndFolders(res, files, folders)
        this.plugin.setPluginState({ directories: updatedDirectories })
      },
      this.handleError)
  }

  /**
   * Fetches new folder
   * @param  {Object} Folder
   * @param  {String} title Folder title
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
        serverUrl: this.plugin.opts.serverUrl,
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
    } catch (err) {
      // Nothing, restriction errors handled in Core
    }
  }

  removeFile (id) {
    const { currentSelection } = this.plugin.getPluginState()
    this.plugin.setPluginState({
      currentSelection: currentSelection.filter((file) => file.id !== id)
    })
  }

  /**
   * Removes session token on client side.
   */
  logout () {
    this.provider.logout(location.href)
      .then((res) => {
        if (res.ok) {
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

  toggleSearch (inputEl) {
    const state = this.plugin.getPluginState()

    this.plugin.setPluginState({
      isSearchVisible: !state.isSearchVisible,
      filterInput: ''
    })
  }

  filterItems (items) {
    const state = this.plugin.getPluginState()
    if (state.filterInput === '') {
      return items
    }
    return items.filter((folder) => {
      return folder.name.toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1
    })
  }

  sortByTitle () {
    const state = Object.assign({}, this.plugin.getPluginState())
    const {files, folders, sorting} = state

    let sortedFiles = files.sort((fileA, fileB) => {
      if (sorting === 'titleDescending') {
        return fileB.name.localeCompare(fileA.name)
      }
      return fileA.name.localeCompare(fileB.name)
    })

    let sortedFolders = folders.sort((folderA, folderB) => {
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
    const {files, folders, sorting} = state

    let sortedFiles = files.sort((fileA, fileB) => {
      let a = new Date(fileA.modifiedDate)
      let b = new Date(fileB.modifiedDate)

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0
      }
      return a > b ? 1 : a < b ? -1 : 0
    })

    let sortedFolders = folders.sort((folderA, folderB) => {
      let a = new Date(folderA.modifiedDate)
      let b = new Date(folderB.modifiedDate)

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
    const {files, sorting} = state

    // check that plugin supports file sizes
    if (!files.length || !this.plugin.getItemData(files[0]).size) {
      return
    }

    let sortedFiles = files.sort((fileA, fileB) => {
      let a = fileA.size
      let b = fileB.size

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

  isActiveRow (file) {
    return this.plugin.getPluginState().activeRow === this.plugin.getItemId(file)
  }

  isChecked (file) {
    const { currentSelection } = this.plugin.getPluginState()
    return currentSelection.some((item) => item === file)
  }

  /**
   * Adds all files found inside of specified folder.
   *
   * Uses separated state while folder contents are being fetched and
   * mantains list of selected folders, which are separated from files.
   */
  addFolder (folder) {
    const folderId = this.providerFileToId(folder)
    let state = this.plugin.getPluginState()
    let folders = state.selectedFolders || {}
    if (folderId in folders && folders[folderId].loading) {
      return
    }
    folders[folderId] = {loading: true, files: []}
    this.plugin.setPluginState({selectedFolders: folders})
    return this.provider.list(folder.requestPath).then((res) => {
      let files = []
      res.items.forEach((item) => {
        if (!item.isFolder) {
          this.addFile(item)
          files.push(this.providerFileToId(item))
        }
      })
      state = this.plugin.getPluginState()
      state.selectedFolders[folderId] = {loading: false, files: files}
      this.plugin.setPluginState({selectedFolders: folders})
      const dashboard = this.plugin.uppy.getPlugin('Dashboard')
      let message
      if (files.length) {
        message = dashboard.i18n('folderAdded', {
          smart_count: files.length, folder: folder.name
        })
      } else {
        message = dashboard.i18n('emptyFolderAdded')
      }
      this.plugin.uppy.info(message)
    }).catch((e) => {
      state = this.plugin.getPluginState()
      delete state.selectedFolders[folderId]
      this.plugin.setPluginState({selectedFolders: state.selectedFolders})
      this.handleError(e)
    })
  }

  /**
   * Toggles file/folder checkbox to on/off state while updating files list.
   *
   * Note that some extra complexity comes from supporting shift+click to
   * toggle multiple checkboxes at once, which is done by getting all files
   * in between last checked file and current one.
   */
  toggleCheckbox (e, file) {
    e.stopPropagation()
    e.preventDefault()
    let { folders, files } = this.plugin.getPluginState()
    let items = this.filterItems(folders.concat(files))

    // Shift-clicking selects a single consecutive list of items
    // starting at the previous click and deselects everything else.
    if (this.lastCheckbox && e.shiftKey) {
      let currentSelection
      const prevIndex = items.indexOf(this.lastCheckbox)
      const currentIndex = items.indexOf(file)
      if (prevIndex < currentIndex) {
        currentSelection = items.slice(prevIndex, currentIndex + 1)
      } else {
        currentSelection = items.slice(currentIndex, prevIndex + 1)
      }
      this.plugin.setPluginState({ currentSelection })
      return
    }

    this.lastCheckbox = file
    const { currentSelection } = this.plugin.getPluginState()
    if (this.isChecked(file)) {
      this.plugin.setPluginState({
        currentSelection: currentSelection.filter((item) => item !== file)
      })
    } else {
      this.plugin.setPluginState({
        currentSelection: currentSelection.concat([file])
      })
    }
  }

  providerFileToId (file) {
    return generateFileID({
      data: file,
      name: file.name || file.id,
      type: file.mimeType
    })
  }

  handleDemoAuth () {
    const state = this.plugin.getPluginState()
    this.plugin.setPluginState({}, state, {
      authenticated: true
    })
  }

  handleAuth () {
    const authState = btoa(JSON.stringify({ origin: location.origin }))
    const link = `${this.provider.authUrl()}?state=${authState}`

    const authWindow = window.open(link, '_blank')
    const handleToken = (e) => {
      if (!this._isOriginAllowed(e.origin, this.plugin.opts.serverPattern) || e.source !== authWindow) {
        this.plugin.uppy.log(`rejecting event from ${e.origin} vs allowed pattern ${this.plugin.opts.serverPattern}`)
        return
      }
      authWindow.close()
      window.removeEventListener('message', handleToken)
      this.provider.setAuthToken(e.data.token)
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
      .filter((pattern) => pattern !== null)
      .some((pattern) => pattern.test(origin))
  }

  handleError (error) {
    const uppy = this.plugin.uppy
    uppy.log(error.toString())
    const message = uppy.i18n(error.isAuthError ? 'companionAuthError' : 'companionError')
    uppy.info({message: message, details: error.toString()}, 'error', 5000)
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

  donePicking () {
    const { currentSelection } = this.plugin.getPluginState()
    const promises = currentSelection.map((file) => {
      if (file.isFolder) {
        return this.addFolder(file)
      } else {
        return this.addFile(file)
      }
    })

    this._loaderWrapper(Promise.all(promises), () => {
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

  // displays loader view while asynchronous request is being made.
  _loaderWrapper (promise, then, catch_) {
    promise
      .then((result) => {
        this.plugin.setPluginState({ loading: false })
        then(result)
      }).catch((err) => {
        this.plugin.setPluginState({ loading: false })
        catch_(err)
      })
    this.plugin.setPluginState({ loading: true })
  }

  render (state) {
    const { authenticated, didFirstRender } = this.plugin.getPluginState()
    if (!didFirstRender) {
      this.preFirstRender()
    }

    // reload pluginState for "loading" attribute because it might
    // have changed above.
    if (this.plugin.getPluginState().loading) {
      return (
        <CloseWrapper onUnmount={this.clearSelection}>
          <LoaderView />
        </CloseWrapper>
      )
    }

    if (!authenticated) {
      return (
        <CloseWrapper onUnmount={this.clearSelection}>
          <AuthView
            pluginName={this.plugin.title}
            pluginIcon={this.plugin.icon}
            demo={this.plugin.opts.demo}
            handleAuth={this.handleAuth}
            handleDemoAuth={this.handleDemoAuth} />
        </CloseWrapper>
      )
    }

    const browserProps = Object.assign({}, this.plugin.getPluginState(), {
      username: this.username,
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      filterItems: this.filterItems,
      filterQuery: this.filterQuery,
      toggleSearch: this.toggleSearch,
      sortByTitle: this.sortByTitle,
      sortByDate: this.sortByDate,
      logout: this.logout,
      demo: this.plugin.opts.demo,
      isActiveRow: this.isActiveRow,
      isChecked: this.isChecked,
      toggleCheckbox: this.toggleCheckbox,
      handleScroll: this.handleScroll,
      done: this.donePicking,
      cancel: this.cancelPicking,
      title: this.plugin.title,
      viewType: this.opts.viewType,
      showTitles: this.opts.showTitles,
      showFilter: this.opts.showFilter,
      showBreadcrumbs: this.opts.showBreadcrumbs,
      pluginIcon: this.plugin.icon,
      i18n: this.plugin.uppy.i18n
    })

    return (
      <CloseWrapper onUnmount={this.clearSelection}>
        <Browser {...browserProps} />
      </CloseWrapper>
    )
  }
}
