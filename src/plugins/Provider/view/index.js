const AuthView = require('./AuthView')
const Browser = require('./Browser')
const LoaderView = require('./Loader')
const Utils = require('../../../core/Utils')
const { h } = require('preact')

/**
 * Class to easily generate generic views for plugins
 *
 *
 * This class expects the plugin instance using it to have the following
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
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // Logic
    this.updateFolderState = this.updateFolderState.bind(this)
    this.addFile = this.addFile.bind(this)
    this.filterItems = this.filterItems.bind(this)
    this.filterQuery = this.filterQuery.bind(this)
    this.toggleSearch = this.toggleSearch.bind(this)
    this.getFolder = this.getFolder.bind(this)
    this.getNextFolder = this.getNextFolder.bind(this)
    this.logout = this.logout.bind(this)
    this.checkAuth = this.checkAuth.bind(this)
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

    this.plugin.uppy.on('file-removed', this.updateFolderState)

    // Visual
    this.render = this.render.bind(this)
  }

  tearDown () {
    this.plugin.uppy.off('file-removed', this.updateFolderState)
  }

  _updateFilesAndFolders (res, files, folders) {
    this.plugin.getItemSubList(res).forEach((item) => {
      if (this.plugin.isFolder(item)) {
        folders.push(item)
      } else {
        files.push(item)
      }
    })

    this.plugin.setPluginState({ folders, files })
  }

  checkAuth () {
    this.plugin.setPluginState({ checkAuthInProgress: true })
    this.Provider.checkAuth()
      .then((authenticated) => {
        this.plugin.setPluginState({ checkAuthInProgress: false })
        this.plugin.onAuth(authenticated)
      })
      .catch((err) => {
        this.plugin.setPluginState({ checkAuthInProgress: false })
        this.handleError(err)
      })
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

        const state = this.plugin.getPluginState()
        const index = state.directories.findIndex((dir) => id === dir.id)

        if (index !== -1) {
          updatedDirectories = state.directories.slice(0, index + 1)
        } else {
          updatedDirectories = state.directories.concat([{id, title: name || this.plugin.getItemName(res)}])
        }

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
    let id = this.plugin.getItemRequestPath(folder)
    this.getFolder(id, this.plugin.getItemName(folder))
    this.lastCheckbox = undefined
  }

  addFile (file, isCheckbox = false) {
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
        url: `${this.Provider.fileUrl(this.plugin.getItemRequestPath(file))}`,
        body: {
          fileId: this.plugin.getItemId(file)
        }
      }
    }

    Utils.getFileType(tagFile).then(fileType => {
      if (fileType && Utils.isPreviewSupported(fileType)) {
        tagFile.preview = this.plugin.getItemThumbnailUrl(file)
      }
      this.plugin.uppy.log('Adding remote file')
      this.plugin.uppy.addFile(tagFile).catch(() => {
        // Ignore
      })
      if (!isCheckbox) {
        this.donePicking()
      }
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
          this.plugin.setPluginState(newState)
        }
      }).catch(this.handleError)
  }

  filterQuery (e) {
    const state = this.plugin.getPluginState()
    this.plugin.setPluginState(Object.assign({}, state, {
      filterInput: e.target.value
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
    return items.filter((folder) => {
      return this.plugin.getItemName(folder).toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1
    })
  }

  sortByTitle () {
    const state = Object.assign({}, this.plugin.getPluginState())
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
      let a = this.plugin.getItemData(fileA).size
      let b = this.plugin.getItemData(fileB).size

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

  isChecked (item) {
    const itemId = this.providerFileToId(item)
    if (this.plugin.isFolder(item)) {
      const state = this.plugin.getPluginState()
      const folders = state.selectedFolders || {}
      if (itemId in folders) {
        return folders[itemId]
      }
      return false
    }
    return (itemId in this.plugin.uppy.getState().files)
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
    this.Provider.list(this.plugin.getItemRequestPath(folder)).then((res) => {
      let files = []
      this.plugin.getItemSubList(res).forEach((item) => {
        if (!this.plugin.isFolder(item)) {
          this.addFile(item, true)
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
          smart_count: files.length, folder: this.plugin.getItemName(folder)
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

  removeFolder (folderId) {
    let state = this.plugin.getPluginState()
    let folders = state.selectedFolders || {}
    if (!(folderId in folders)) {
      return
    }
    let folder = folders[folderId]
    if (folder.loading) {
      return
    }
    // deepcopy the files before iteration because the
    // original array constantly gets mutated during
    // the iteration by updateFolderState as each file
    // is removed and 'core:file-removed' is emitted.
    const files = folder.files.concat([])
    for (const fileId of files) {
      if (fileId in this.plugin.uppy.getState().files) {
        this.plugin.uppy.removeFile(fileId)
      }
    }
    delete folders[folderId]
    this.plugin.setPluginState({selectedFolders: folders})
  }

  /**
   * Updates selected folders state everytime file is being removed.
   *
   * Note that this is only important when files are getting removed from the
   * main screen, and will do nothing when you uncheck folder directly, since
   * it's already been done in removeFolder method.
   */
  updateFolderState (file) {
    let state = this.plugin.getPluginState()
    let folders = state.selectedFolders || {}
    for (let folderId in folders) {
      let folder = folders[folderId]
      if (folder.loading) {
        continue
      }
      let i = folder.files.indexOf(file.id)
      if (i > -1) {
        folder.files.splice(i, 1)
      }
      if (!folder.files.length) {
        delete folders[folderId]
      }
    }
    this.plugin.setPluginState({selectedFolders: folders})
  }

  /**
   * Toggles file/folder checkbox to on/off state while updating files list.
   *
   * Note that some extra complexity comes from supporting shift+click to
   * toggle multiple checkboxes at once, which is done by getting all files
   * in between last checked file and current one, and applying an on/off state
   * for all of them, depending on current file state.
   */
  toggleCheckbox (e, file) {
    e.stopPropagation()
    e.preventDefault()
    let { folders, files, filterInput } = this.plugin.getPluginState()
    let items = folders.concat(files)
    if (filterInput !== '') {
      items = this.filterItems(items)
    }
    let itemsToToggle = [file]
    if (this.lastCheckbox && e.shiftKey) {
      let prevIndex = items.indexOf(this.lastCheckbox)
      let currentIndex = items.indexOf(file)
      if (prevIndex < currentIndex) {
        itemsToToggle = items.slice(prevIndex, currentIndex + 1)
      } else {
        itemsToToggle = items.slice(currentIndex, prevIndex + 1)
      }
    }
    this.lastCheckbox = file
    if (this.isChecked(file)) {
      for (let item of itemsToToggle) {
        const itemId = this.providerFileToId(item)
        if (this.plugin.isFolder(item)) {
          this.removeFolder(itemId)
        } else {
          if (itemId in this.plugin.uppy.getState().files) {
            this.plugin.uppy.removeFile(itemId)
          }
        }
      }
    } else {
      for (let item of itemsToToggle) {
        if (this.plugin.isFolder(item)) {
          this.addFolder(item)
        } else {
          this.addFile(item, true)
        }
      }
    }
  }

  providerFileToId (file) {
    return Utils.generateFileID({
      data: this.plugin.getItemData(file),
      name: this.plugin.getItemName(file) || this.plugin.getItemId(file),
      type: this.plugin.getMimeType(file)
    })
  }

  handleDemoAuth () {
    const state = this.plugin.getPluginState()
    this.plugin.setPluginState({}, state, {
      authenticated: true
    })
  }

  handleAuth () {
    const urlId = Math.floor(Math.random() * 999999) + 1
    const redirect = `${location.href}${location.search ? '&' : '?'}id=${urlId}`

    const authState = btoa(JSON.stringify({ redirect }))
    const link = `${this.Provider.authUrl()}?state=${authState}`

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
      if (authWindowUrl && authWindowUrl.split('#')[0] === redirect) {
        authWindow.close()
        this._loaderWrapper(this.Provider.checkAuth(), this.plugin.onAuth, this.handleError)
      } else {
        setTimeout(checkAuth, 100)
      }
    }

    checkAuth()
  }

  handleError (error) {
    const uppy = this.plugin.uppy
    const message = uppy.i18n('uppyServerError')
    uppy.log(error.toString())
    uppy.info({message: message, details: error.toString()}, 'error', 5000)
  }

  handleScroll (e) {
    const scrollPos = e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight)
    const path = this.plugin.getNextPagePath ? this.plugin.getNextPagePath() : null

    if (scrollPos < 50 && path && !this._isHandlingScroll) {
      this.Provider.list(path)
        .then((res) => {
          const { files, folders } = this.plugin.getPluginState()
          this._updateFilesAndFolders(res, files, folders)
        }).catch(this.handleError)
        .then(() => { this._isHandlingScroll = false }) // always called

      this._isHandlingScroll = true
    }
  }

  donePicking () {
    const dashboard = this.plugin.uppy.getPlugin('Dashboard')
    if (dashboard) dashboard.hideAllPanels()
  }

  // displays loader view while asynchronous request is being made.
  _loaderWrapper (promise, then, catch_) {
    promise
      .then(then).catch(catch_)
      .then(() => this.plugin.setPluginState({ loading: false })) // always called.
    this.plugin.setPluginState({ loading: true })
  }

  render (state) {
    const { authenticated, checkAuthInProgress, loading } = this.plugin.getPluginState()

    if (loading) {
      return LoaderView()
    }

    if (!authenticated) {
      return h(AuthView, {
        pluginName: this.plugin.title,
        pluginIcon: this.plugin.icon,
        demo: this.plugin.opts.demo,
        checkAuth: this.checkAuth,
        handleAuth: this.handleAuth,
        handleDemoAuth: this.handleDemoAuth,
        checkAuthInProgress: checkAuthInProgress
      })
    }

    const browserProps = Object.assign({}, this.plugin.getPluginState(), {
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
      isChecked: this.isChecked,
      toggleCheckbox: this.toggleCheckbox,
      getItemId: this.plugin.getItemId,
      getItemName: this.plugin.getItemName,
      getItemIcon: this.plugin.getItemIcon,
      handleScroll: this.handleScroll,
      done: this.donePicking,
      title: this.plugin.title,
      viewType: this.opts.viewType,
      showTitles: this.opts.showTitles,
      showFilter: this.opts.showFilter,
      showBreadcrumbs: this.opts.showBreadcrumbs
    })

    return Browser(browserProps)
  }
}
