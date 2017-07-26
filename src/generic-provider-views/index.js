const AuthView = require('./AuthView')
const Browser = require('./Browser')
const LoaderView = require('./Loader')
const Utils = require('../core/Utils')

/**
 * Class to easily generate generic views for plugins
 *
 * This class expects the plugin using to have the following attributes
 *
 * stateId {String} object key of which the plugin state is stored
 *
 * This class also expects the plugin instance using it to have the following
 * accessor methods.
 * Each method takes the item whose property is to be accessed
 * as a param
 *
 * isFolder
 *    @return {Boolean} for if the item is a folder or not
 * getItemData
 *    @return {Object} that is format ready for uppy upload/download
 * getItemIcon
 *    @return {Object} html instance of the item's icon
 * getItemSubList
 *    @return {Array} sub-items in the item. e.g a folder may contain sub-items
 * getItemName
 *    @return {String} display friendly name of the item
 * getMimeType
 *    @return {String} mime type of the item
 * getItemId
 *    @return {String} unique id of the item
 * getItemRequestPath
 *    @return {String} unique request path of the item when making calls to uppy server
 * getItemModifiedDate
 *    @return {object} or {String} date of when last the item was modified
 * getItemThumbnailUrl
 *    @return {String}
 */
module.exports = class View {
  /**
   * @param {object} instance of the plugin
   */
  constructor (plugin, opts) {
    this.plugin = plugin
    this.Provider = plugin[plugin.id]

    // set default options
    const defaultOptions = {
      viewType: 'list'
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
    this.handleAuth = this.handleAuth.bind(this)
    this.handleDemoAuth = this.handleDemoAuth.bind(this)
    this.sortByTitle = this.sortByTitle.bind(this)
    this.sortByDate = this.sortByDate.bind(this)
    this.isActiveRow = this.isActiveRow.bind(this)
    this.handleError = this.handleError.bind(this)
    this.handleScroll = this.handleScroll.bind(this)

    // Visual
    this.render = this.render.bind(this)
  }

  /**
   * Little shorthand to update the state with the plugin's state
   */
  updateState (newState) {
    let stateId = this.plugin.stateId
    const {state} = this.plugin.core

    this.plugin.core.setState({[stateId]: Object.assign({}, state[stateId], newState)})
  }

  _updateFilesAndFolders (res, files, folders) {
    this.plugin.getItemSubList(res).forEach((item) => {
      if (this.plugin.isFolder(item)) {
        folders.push(item)
      } else {
        files.push(item)
      }
    })

    this.updateState({ folders, files })
  }

  /**
   * Based on folder ID, fetch a new folder and update it to state
   * @param  {String} id Folder id
   * @return {Promise}   Folders/files in folder
   */
  getFolder (id, name) {
    return this._loaderWrapper(
      this.Provider.list(id),
      (res) => {
        let folders = []
        let files = []
        let updatedDirectories

        const state = this.plugin.core.getState()[this.plugin.stateId]
        const index = state.directories.findIndex((dir) => id === dir.id)

        if (index !== -1) {
          updatedDirectories = state.directories.slice(0, index + 1)
        } else {
          updatedDirectories = state.directories.concat([{id, title: name || this.plugin.getItemName(res)}])
        }

        this._updateFilesAndFolders(res, files, folders)
        this.updateState({ directories: updatedDirectories })
      },
      this.handleError)
  }

  /**
   * Fetches new folder
   * @param  {Object} Folder
   * @param  {String} title Folder title
   */
  getNextFolder (folder) {
    let id = this.plugin.getItemRequestPath(folder)
    this.getFolder(id, this.plugin.getItemName(folder))
  }

  addFile (file) {
    const tagFile = {
      source: this.plugin.id,
      data: this.plugin.getItemData(file),
      name: this.plugin.getItemName(file) || this.plugin.getItemId(file),
      type: this.plugin.getMimeType(file),
      isRemote: true,
      body: {
        fileId: this.plugin.getItemId(file)
      },
      remote: {
        host: this.plugin.opts.host,
        url: `${this.plugin.opts.host}/${this.Provider.id}/get/${this.plugin.getItemRequestPath(file)}`,
        body: {
          fileId: this.plugin.getItemId(file)
        }
      }
    }

    Utils.getFileType(tagFile).then(fileType => {
      if (Utils.isPreviewSupported(fileType[1])) {
        tagFile.preview = this.plugin.getItemThumbnailUrl(file)
      }
      this.plugin.core.log('Adding remote file')
      this.plugin.core.emitter.emit('core:file-add', tagFile)
    })
  }

  /**
   * Removes session token on client side.
   */
  logout () {
    this.Provider.logout(location.href)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          const newState = {
            authenticated: false,
            files: [],
            folders: [],
            directories: []
          }
          this.updateState(newState)
        }
      }).catch(this.handleError)
  }

  filterQuery (e) {
    const state = this.plugin.core.getState()[this.plugin.stateId]
    this.updateState(Object.assign({}, state, {
      filterInput: e.target.value
    }))
  }

  toggleSearch () {
    const state = this.plugin.core.getState()[this.plugin.stateId]
    const searchInputEl = document.querySelector('.Browser-searchInput')

    this.updateState(Object.assign({}, state, {
      isSearchVisible: !state.isSearchVisible,
      filterInput: ''
    }))

    searchInputEl.value = ''
    if (!state.isSearchVisible) {
      searchInputEl.focus()
    }
  }

  filterItems (items) {
    const state = this.plugin.core.getState()[this.plugin.stateId]
    return items.filter((folder) => {
      return this.plugin.getItemName(folder).toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1
    })
  }

  sortByTitle () {
    const state = Object.assign({}, this.plugin.core.getState()[this.plugin.stateId])
    const {files, folders, sorting} = state

    let sortedFiles = files.sort((fileA, fileB) => {
      if (sorting === 'titleDescending') {
        return this.plugin.getItemName(fileB).localeCompare(this.plugin.getItemName(fileA))
      }
      return this.plugin.getItemName(fileA).localeCompare(this.plugin.getItemName(fileB))
    })

    let sortedFolders = folders.sort((folderA, folderB) => {
      if (sorting === 'titleDescending') {
        return this.plugin.getItemName(folderB).localeCompare(this.plugin.getItemName(folderA))
      }
      return this.plugin.getItemName(folderA).localeCompare(this.plugin.getItemName(folderB))
    })

    this.updateState(Object.assign({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: (sorting === 'titleDescending') ? 'titleAscending' : 'titleDescending'
    }))
  }

  sortByDate () {
    const state = Object.assign({}, this.plugin.core.getState()[this.plugin.stateId])
    const {files, folders, sorting} = state

    let sortedFiles = files.sort((fileA, fileB) => {
      let a = new Date(this.plugin.getItemModifiedDate(fileA))
      let b = new Date(this.plugin.getItemModifiedDate(fileB))

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0
      }
      return a > b ? 1 : a < b ? -1 : 0
    })

    let sortedFolders = folders.sort((folderA, folderB) => {
      let a = new Date(this.plugin.getItemModifiedDate(folderA))
      let b = new Date(this.plugin.getItemModifiedDate(folderB))

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0
      }

      return a > b ? 1 : a < b ? -1 : 0
    })

    this.updateState(Object.assign({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: (sorting === 'dateDescending') ? 'dateAscending' : 'dateDescending'
    }))
  }

  isActiveRow (file) {
    return this.plugin.core.getState()[this.plugin.stateId].activeRow === this.plugin.getItemId(file)
  }

  handleDemoAuth () {
    const state = this.plugin.core.getState()[this.plugin.stateId]
    this.updateState({}, state, {
      authenticated: true
    })
  }

  handleAuth () {
    const urlId = Math.floor(Math.random() * 999999) + 1
    const redirect = `${location.href}${location.search ? '&' : '?'}id=${urlId}`

    const authState = btoa(JSON.stringify({ redirect }))
    const link = `${this.plugin.opts.host}/connect/${this.Provider.authProvider}?state=${authState}`

    const authWindow = window.open(link, '_blank')
    const checkAuth = () => {
      let authWindowUrl

      try {
        authWindowUrl = authWindow.location.href
      } catch (e) {
        if (e instanceof DOMException || e instanceof TypeError) {
          return setTimeout(checkAuth, 100)
        } else throw e
      }

      // split url because chrome adds '#' to redirects
      if (authWindowUrl.split('#')[0] === redirect) {
        authWindow.close()
        this._loaderWrapper(this.Provider.auth(), this.plugin.onAuth, this.handleError)
      } else {
        setTimeout(checkAuth, 100)
      }
    }

    checkAuth()
  }

  handleError (error) {
    const core = this.plugin.core
    const message = core.opts.debug ? error.toString() : core.i18n('uppyServerError')
    core.emit('informer', message, 'error', 5000)
  }

  handleScroll (e) {
    const scrollPos = e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight)
    const path = this.plugin.getNextPagePath ? this.plugin.getNextPagePath() : null

    if (scrollPos < 50 && path && !this._isHandlingScroll) {
      this.Provider.list(path)
        .then((res) => {
          const { files, folders } = this.plugin.core.getState()[this.plugin.stateId]
          this._updateFilesAndFolders(res, files, folders)
        }).catch(this.handleError)
        .then(() => { this._isHandlingScroll = false }) // always called

      this._isHandlingScroll = true
    }
  }

  // displays loader view while asynchronous request is being made.
  _loaderWrapper (promise, then, catch_) {
    promise
      .then(then).catch(catch_)
      .then(() => this.updateState({ loading: false })) // always called.
    this.updateState({ loading: true })
  }

  render (state) {
    const { authenticated, loading } = state[this.plugin.stateId]

    if (loading) {
      return LoaderView()
    }

    if (!authenticated) {
      return AuthView({
        pluginName: this.plugin.title,
        demo: this.plugin.opts.demo,
        handleAuth: this.handleAuth,
        handleDemoAuth: this.handleDemoAuth
      })
    }

    const browserProps = Object.assign({}, state[this.plugin.stateId], {
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      addFile: this.addFile,
      filterItems: this.filterItems,
      filterQuery: this.filterQuery,
      toggleSearch: this.toggleSearch,
      sortByTitle: this.sortByTitle,
      sortByDate: this.sortByDate,
      logout: this.logout,
      demo: this.plugin.opts.demo,
      isActiveRow: this.isActiveRow,
      getItemName: this.plugin.getItemName,
      getItemIcon: this.plugin.getItemIcon,
      handleScroll: this.handleScroll,
      title: this.plugin.title,
      viewType: this.opts.viewType
    })

    return Browser(browserProps)
  }
}
