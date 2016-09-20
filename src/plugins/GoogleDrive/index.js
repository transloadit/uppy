import Utils from '../../core/Utils'
import Plugin from '../Plugin'
import 'whatwg-fetch'
import html from '../../core/html'

import Provider from '../../uppy-base/src/plugins/Provider'

import AuthView from './AuthView'
import Browser from './Browser'
import ErrorView from './Error'

export default class Google extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'GoogleDrive'
    this.title = 'Google Drive'
    this.icon = html`
      <svg class="UppyIcon UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16">
        <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z"/>
      </svg>
    `

    this.GoogleDrive = new Provider({
      host: this.opts.host,
      provider: 'google'
    })

    this.files = []

    // this.core.socket.on('')
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

    // Visual
    this.render = this.render.bind(this)

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  install () {
    // Set default state for Google Drive
    this.core.setState({
      googleDrive: {
        authenticated: false,
        files: [],
        folders: [],
        directories: [{
          title: 'My Drive',
          id: 'root'
        }],
        activeRow: -1,
        filterInput: ''
      }
    })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    this.checkAuthentication()
      .then((authenticated) => {
        this.updateState({authenticated})

        console.log('are we authenticated?')
        console.log(authenticated)

        if (authenticated) {
          return this.getFolder('root')
        }

        return authenticated
      })
      .then((newState) => {
        this.updateState(newState)
      })

    return
  }

  focus () {
  }

  /**
   * Little shorthand to update the state with my new state
   */
  updateState (newState) {
    const {state} = this.core
    const googleDrive = Object.assign({}, state.googleDrive, newState)

    this.core.setState({googleDrive})
  }

  /**
   * Check to see if the user is authenticated.
   * @return {Promise} authentication status
   */
  checkAuthentication () {
    return fetch(`${this.opts.host}/google/authorize`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then((res) => {
      console.log(res.status)
      if (res.status < 200 || res.status > 300) {
        this.updateState({
          authenticated: false,
          error: true
        })
        let error = new Error(res.statusText)
        error.response = res
        throw error
      }

      return res.json()
    })
    .then((data) => data.isAuthenticated)
    .catch((err) => err)
  }

  /**
   * Based on folder ID, fetch a new folder
   * @param  {String} id Folder id
   * @return {Promise}   Folders/files in folder
   */
  getFolder (id = 'root') {
    return this.GoogleDrive.list(id)
      .then((res) => {
        // let result = Utils.groupBy(data.items, (item) => item.mimeType)
        let folders = []
        let files = []
        res.items.forEach((item) => {
          if (item.mimeType === 'application/vnd.google-apps.folder') {
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
  getNextFolder (id, title) {
    this.getFolder(id)
      .then((data) => {
        const state = this.core.getState().googleDrive

        const index = state.directories.findIndex((dir) => id === dir.id)
        let updatedDirectories

        if (index !== -1) {
          updatedDirectories = state.directories.slice(0, index + 1)
        } else {
          updatedDirectories = state.directories.concat([{
            id,
            title
          }])
        }

        this.updateState(Utils.extend(data, {
          directories: updatedDirectories
        }))
      })
  }

  addFile (file) {
    const tagFile = {
      source: this.id,
      data: file,
      name: file.title,
      type: file.mimeType,
      isRemote: true,
      body: {
        fileId: file.id
      }
    }

    this.core.emitter.emit('file-add', tagFile)
  }

  handleError (response) {
    this.checkAuthentication()
      .then((authenticated) => {
        this.updateState({authenticated})
      })
  }

  /**
   * Removes session token on client side.
   */
  logout () {
    this.GoogleDrive.logout(location.href)
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
              id: 'root'
            }]
          }

          this.updateState(newState)
        }
      })
  }

  getFileType (file) {
    const fileTypes = {
      'application/vnd.google-apps.folder': 'Folder',
      'application/vnd.google-apps.document': 'Google Docs',
      'application/vnd.google-apps.spreadsheet': 'Google Sheets',
      'application/vnd.google-apps.presentation': 'Google Slides',
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image'
    }

    return fileTypes[file.mimeType] ? fileTypes[file.mimeType] : file.fileExtension.toUpperCase()
  }

  /**
   * Used to set active file/folder.
   * @param  {Object} file   Active file/folder
   */
  handleRowClick (fileId) {
    const state = this.core.getState().googleDrive
    const newState = Object.assign({}, state, {
      activeRow: fileId
    })

    this.updateState(newState)
  }

  filterQuery (e) {
    const state = this.core.getState().googleDrive
    this.updateState(Object.assign({}, state, {
      filterInput: e.target.value
    }))
  }

  filterItems (items) {
    const state = this.core.getState().googleDrive
    return items.filter((folder) => {
      return folder.title.toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1
    })
  }

  sortByTitle () {
    const state = Object.assign({}, this.core.getState().googleDrive)
    const {files, folders, sorting} = state

    let sortedFiles = files.sort((fileA, fileB) => {
      if (sorting === 'titleDescending') {
        return fileB.title.localeCompare(fileA.title)
      }
      return fileA.title.localeCompare(fileB.title)
    })

    let sortedFolders = folders.sort((folderA, folderB) => {
      if (sorting === 'titleDescending') {
        return folderB.title.localeCompare(folderA.title)
      }
      return folderA.title.localeCompare(folderB.title)
    })

    this.updateState(Object.assign({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: (sorting === 'titleDescending') ? 'titleAscending' : 'titleDescending'
    }))
  }

  sortByDate () {
    const state = Object.assign({}, this.core.getState().googleDrive)
    const {files, folders, sorting} = state

    let sortedFiles = files.sort((fileA, fileB) => {
      let a = new Date(fileA.modifiedByMeDate)
      let b = new Date(fileB.modifiedByMeDate)

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0
      }
      return a > b ? 1 : a < b ? -1 : 0
    })

    let sortedFolders = folders.sort((folderA, folderB) => {
      let a = new Date(folderA.modifiedByMeDate)
      let b = new Date(folderB.modifiedByMeDate)

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

  handleDemoAuth () {
    const state = this.core.getState().googleDrive
    this.updateState({}, state, {
      authenticated: true
    })
  }

  render (state) {
    const { authenticated, error } = state.googleDrive

    if (error) {
      return ErrorView({ error: error })
    }

    if (!authenticated) {
      const authState = btoa(JSON.stringify({
        redirect: location.href.split('#')[0]
      }))

      const link = `${this.opts.host}/connect/google?state=${authState}`

      return AuthView({
        link: link,
        demo: this.opts.demo,
        handleDemoAuth: this.handleDemoAuth
      })
    }

    const browserProps = Object.assign({}, state.googleDrive, {
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      addFile: this.addFile,
      filterItems: this.filterItems,
      filterQuery: this.filterQuery,
      handleRowClick: this.handleRowClick,
      sortByTitle: this.sortByTitle,
      sortByDate: this.sortByDate,
      logout: this.logout,
      demo: this.opts.demo
    })

    return Browser(browserProps)
  }
}
