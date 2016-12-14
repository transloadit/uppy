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
   * Little shorthand to update the state with my new state
   */
  updateState (newState) {
    let stateId = this.plugin.stateId
    const {state} = this.plugin.core

    this.plugin.core.setState({[stateId]: Object.assign({}, state[stateId], newState)})
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
        let updatedDirectories

        const state = this.plugin.core.getState()[this.plugin.stateId]
        const index = state.directories.findIndex((dir) => id === dir.id)

        if (index !== -1) {
          updatedDirectories = state.directories.slice(0, index + 1)
        } else {
          updatedDirectories = state.directories.concat([{id, title: this.plugin.getItemName(res)}])
        }

        this.plugin.getItemSubList(res).forEach((item) => {
          if (this.plugin.isFolder(item)) {
            folders.push(item)
          } else {
            files.push(item)
          }
        })

        this.updateState({folders, files, directories: updatedDirectories})
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
    let id = this.plugin.getItemRequestPath(folder)
    this.getFolder(id)
  }

  addFile (file) {
    const tagFile = {
      source: this.plugin.id,
      data: this.plugin.getItemData(file),
      name: this.plugin.getItemName(file),
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
            directories: []
          }
          this.updateState(newState)
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
      activeRow: this.plugin.getItemId(file)
    })

    this.updateState(newState)
  }

  filterQuery (e) {
    const state = this.plugin.core.getState()[this.plugin.stateId]
    this.updateState(Object.assign({}, state, {
      filterInput: e.target.value
    }))
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

  render (state) {
    const { authenticated, error } = state[this.plugin.stateId]

    if (error) {
      return ErrorView({ error: error })
    }

    if (!authenticated) {
      const authState = btoa(JSON.stringify({
        redirect: location.href.split('#')[0]
      }))

      const link = `${this.plugin.opts.host}/connect/${this.Provider.provider}?state=${authState}`

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
      getItemName: this.plugin.getItemName,
      getItemIcon: this.plugin.getItemIcon
    })

    return Browser(browserProps)
  }
}
