import Utils from '../core/Utils'
import 'whatwg-fetch'

import AuthView from './AuthView'
import Browser from './new/Browser'
import ErrorView from './Error'

export default class View {
  constructor (plugin) {
    this.plugin = plugin
    this.Provider = plugin[plugin.id]

    // Logic
    this.addFile = this.addFile.bind(this)
    this.filterItems = this.filterItems.bind(this)
    this.filterQuery = this.filterQuery.bind(this)
    this.getFolder = this.getFolder.bind(this)
    this.getNextFolder = this.getNextFolder.bind(this)
    this.handleRowClick = this.handleRowClick.bind(this)
    this.logout = this.logout.bind(this)
    this.handleDemoAuth = this.handleDemoAuth.bind(this)
    this.sortByTitle = this.sortByTitle.bind(this)
    this.sortByDate = this.sortByDate.bind(this)
    this.isActiveRow = this.isActiveRow.bind(this)

    // Visual
    this.render = this.render.bind(this)
  }

  /**
   * Based on folder ID, fetch a new folder
   * @param  {String} id Folder id
   * @return {Promise}   Folders/files in folder
   */
  getFolder (id) {
    return this.Provider.list(id)
      .then((res) => {
        let folders = []
        let files = []
        res.contents.forEach((item) => {
          if (this.plugin.isFolder(item)) {
            folders.push(item)
          } else {
            files.push(item)
          }
        })
        return {
          folders,
          files
        }
      })
      .catch((err) => {
        return err
      })
  }

  /**
   * Fetches new folder and adds to breadcrumb nav
   * @param  {String} id    Folder id
   * @param  {String} title Folder title
   */
  getNextFolder (folder) {
    let id = this.plugin.getFileRequestPath(folder)
    this.getFolder(id)
      .then((data) => {
        const state = this.plugin.core.getState()[this.plugin.stateId]

        const index = state.directories.findIndex((dir) => id === dir.id)
        let updatedDirectories

        if (index !== -1) {
          updatedDirectories = state.directories.slice(0, index + 1)
        } else {
          updatedDirectories = state.directories.concat([{id, title: this.plugin.getFileName(folder)}])
        }

        this.plugin.updateState(Utils.extend(data, {
          directories: updatedDirectories
        }))
      })
  }

  addFile (file) {
    const tagFile = {
      source: this.plugin.id,
      data: this.plugin.getFileData(file),
      name: this.plugin.getFileName(file),
      type: this.plugin.getMimeType(file),
      isRemote: true,
      body: {
        fileId: this.plugin.getFileId(file)
      },
      remote: {
        host: this.plugin.opts.host,
        url: `${this.plugin.opts.host}/${this.Provider.id}/get/${this.plugin.getFileRequestPath(file)}`,
        body: {
          fileId: this.plugin.getFileId(file)
        }
      }
    }
    console.log('adding file')
    this.plugin.core.emitter.emit('core:file-add', tagFile)
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
            directories: [{
              title: 'My Dropbox',
              id: 'auto'
            }]
          }

          this.plugin.updateState(newState)
        }
      })
  }

  /**
   * Used to set active file/folder.
   * @param  {Object} file   Active file/folder
   */
  handleRowClick (file) {
    const state = this.plugin.core.getState()[this.plugin.stateId]
    const newState = Object.assign({}, state, {
      activeRow: this.plugin.getFileId(file)
    })

    this.plugin.updateState(newState)
  }

  filterQuery (e) {
    const state = this.plugin.core.getState()[this.plugin.stateId]
    this.plugin.updateState(Object.assign({}, state, {
      filterInput: e.target.value
    }))
  }

  filterItems (items) {
    const state = this.plugin.core.getState()[this.plugin.stateId]
    return items.filter((folder) => {
      return folder.title.toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1
    })
  }

  sortByTitle () {
    const state = Object.assign({}, this.plugin.core.getState()[this.plugin.stateId])
    const {files, folders, sorting} = state

    let sortedFiles = files.sort((fileA, fileB) => {
      if (sorting === 'titleDescending') {
        return this.plugin.getFileName(fileB).localeCompare(this.plugin.getFileName(fileA))
      }
      return this.plugin.getFileName(fileA).localeCompare(this.plugin.getFileName(fileB))
    })

    let sortedFolders = folders.sort((folderA, folderB) => {
      if (sorting === 'titleDescending') {
        return this.plugin.getFileName(folderB).localeCompare(this.plugin.getFileName(folderA))
      }
      return this.plugin.getFileName(folderA).localeCompare(this.plugin.getFileName(folderB))
    })

    this.plugin.updateState(Object.assign({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: (sorting === 'titleDescending') ? 'titleAscending' : 'titleDescending'
    }))
  }

  sortByDate () {
    const state = Object.assign({}, this.plugin.core.getState()[this.plugin.stateId])
    const {files, folders, sorting} = state

    let sortedFiles = files.sort((fileA, fileB) => {
      let a = new Date(this.plugin.getFileModifiedDate(fileA))
      let b = new Date(this.plugin.getFileModifiedDate(fileB))

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0
      }
      return a > b ? 1 : a < b ? -1 : 0
    })

    let sortedFolders = folders.sort((folderA, folderB) => {
      let a = new Date(this.plugin.getFileModifiedDate(folderA))
      let b = new Date(this.plugin.getFileModifiedDate(folderB))

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0
      }

      return a > b ? 1 : a < b ? -1 : 0
    })

    this.plugin.updateState(Object.assign({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: (sorting === 'dateDescending') ? 'dateAscending' : 'dateDescending'
    }))
  }

  isActiveRow (file) {
    return this.plugin.core.getState()[this.plugin.stateId].activeRow === this.plugin.getFileId(file)
  }

  handleDemoAuth () {
    const state = this.plugin.core.getState()[this.plugin.stateId]
    this.plugin.updateState({}, state, {
      authenticated: true
    })
  }

  render (state) {
    const { authenticated, error } = state[this.plugin.stateId]

    if (error) {
      return ErrorView({ error: error })
    }

    if (!authenticated) {
      const authState = btoa(JSON.stringify({
        redirect: location.href.split('#')[0]
      }))

      const link = `${this.plugin.opts.host}/connect/${this.Provider.id}?state=${authState}`

      return AuthView({
        link: link,
        demo: this.plugin.opts.demo,
        handleDemoAuth: this.handleDemoAuth
      })
    }

    const browserProps = Object.assign({}, state[this.plugin.stateId], {
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      addFile: this.addFile,
      filterItems: this.filterItems,
      filterQuery: this.filterQuery,
      handleRowClick: this.handleRowClick,
      sortByTitle: this.sortByTitle,
      sortByDate: this.sortByDate,
      logout: this.logout,
      demo: this.plugin.opts.demo,
      isActiveRow: this.isActiveRow,
      getFileName: this.plugin.getFileName
    })

    return Browser(browserProps)
  }
}
