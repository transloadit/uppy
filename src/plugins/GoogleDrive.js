import Utils from '../core/Utils'
import Plugin from './Plugin'
import 'whatwg-fetch'
import yo from 'yo-yo'

export default class Google extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'GoogleDrive'
    this.title = 'Google Drive'
    this.icon = yo`
      <svg class="UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16">
        <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z"/>
      </svg>
    `

    this.files = []

    // Logic
    this.addFile = this.addFile.bind(this)
    this.getFolder = this.getFolder.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.logout = this.logout.bind(this)

    // Visual
    this.renderBrowserItem = this.renderBrowserItem.bind(this)
    this.filterItems = this.filterItems.bind(this)
    this.filterQuery = this.filterQuery.bind(this)
    this.renderAuth = this.renderAuth.bind(this)
    this.renderBrowser = this.renderBrowser.bind(this)
    this.sortByTitle = this.sortByTitle.bind(this)
    this.sortByDate = this.sortByDate.bind(this)
    this.render = this.render.bind(this)

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    const host = this.opts.host.replace(/^https?:\/\//, '')

    this.socket = this.core.initSocket({
      target: 'ws://' + host + '/'
    })

    this.socket.on('google.auth.pass', () => {
      console.log('google.auth.pass')
      this.getFolder(this.core.getState().googleDrive.directory.id)
    })

    this.socket.on('uppy.debug', (payload) => {
      console.log('GOOGLE DEBUG:')
      console.log(payload)
    })

    this.socket.on('google.list.ok', (data) => {
      console.log('google.list.ok')
      let folders = []
      let files = []
      data.items.forEach((item) => {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          folders.push(item)
        } else {
          files.push(item)
        }
      })

      this.updateState({
        folders,
        files,
        authenticated: true
      })
    })

    this.socket.on('google.list.fail', (data) => {
      console.log('google.list.fail')
      console.log(data)
    })

    this.socket.on('google.auth.fail', () => {
      console.log('google.auth.fail')
      this.updateState({
        authenticated: false
      })
    })
  }

  install () {
    // Set default state for Google Drive
    this.core.setState({
      googleDrive: {
        authenticated: false,
        files: [],
        folders: [],
        directory: [{
          title: 'My Drive',
          id: 'root'
        }],
        active: {},
        filterInput: ''
      }
    })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)

    this.checkAuthentication()
      .then((authenticated) => {
        this.updateState({authenticated})

        if (authenticated) {
          return this.getFolder(this.core.getState().googleDrive.directory.id)
        }

        return authenticated
      })
      .then((newState) => {
        this.updateState(newState)
      })

    return
  }

  focus () {
    const firstInput = document.querySelector(`${this.target} .UppyGoogleDrive-focusInput`)

    // only works for the first time if wrapped in setTimeout for some reason
    // firstInput.focus()
    setTimeout(function () {
      firstInput.focus()
    }, 10)
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
      if (res.status >= 200 && res.status <= 300) {
        return res.json()
      } else {
        this.updateState({
          authenticated: false,
          error: true
        })
        let error = new Error(res.statusText)
        error.response = res
        throw error
      }
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
    return fetch(`${this.opts.host}/google/list?dir=${id}`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then((res) => {
      if (res.status >= 200 && res.status <= 300) {
        return res.json().then((data) => {
          // let result = Utils.groupBy(data.items, (item) => item.mimeType)
          let folders = []
          let files = []
          data.items.forEach((item) => {
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
      } else {
        this.handleError(res)
        let error = new Error(res.statusText)
        error.response = res
        throw error
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

        const index = state.directory.findIndex((dir) => id === dir.id)
        let directory

        if (index !== -1) {
          directory = state.directory.slice(0, index + 1)
        } else {
          directory = state.directory.concat([{
            id,
            title
          }])
        }

        this.updateState(Utils.extend(data, {directory}))
      })
  }

  addFile (file) {
    const tagFile = {
      source: this,
      data: file,
      name: file.title,
      type: this.getFileType(file),
      remote: {
        action: 'google.get',
        payload: {
          id: file.id
        }
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
    fetch(`${this.opts.host}/google/logout?redirect=${location.href}`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          console.log('ok')
          const newState = {
            authenticated: false,
            files: [],
            folders: [],
            directory: [{
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
  handleClick (file) {
    const state = this.core.getState().googleDrive
    const newState = Object.assign({}, state, {
      active: file
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
    const state = this.core.getState().googleDrive
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
    const state = this.core.getState().googleDrive
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

  /**
   * Render user authentication view
   */
  renderAuth () {
    const state = btoa(JSON.stringify({
      redirect: location.href.split('#')[0]
    }))

    const link = `${this.opts.host}/connect/google?state=${state}`
    return yo`
      <div class="UppyGoogleDrive-authenticate">
        <h1>You need to authenticate with Google before selecting files.</h1>
        <a href=${link}>Authenticate</a>
      </div>
    `
  }

  /**
   * Render file browser
   * @param  {Object} state Google Drive state
   */
  renderBrowser (state) {
    let folders = state.folders
    let files = state.files
    let previewElem = ''
    const isFileSelected = Object.keys(state.active).length !== 0 && JSON.stringify(state.active) !== JSON.stringify({})

    if (state.filterInput !== '') {
      folders = this.filterItems(state.folders)
      files = this.filterItems(state.files)
    }

    folders = folders.map((folder) => this.renderBrowserItem(folder))
    files = files.map((file) => this.renderBrowserItem(file))

    const breadcrumbs = state.directory.map((dir) => yo`<li><button onclick=${this.getNextFolder.bind(this, dir.id, dir.title)}>${dir.title}</button></li> `)
    if (isFileSelected) {
      previewElem = yo`
        <div>
          <h1><span class="UppyGoogleDrive-fileIcon"><img src=${state.active.iconLink}/></span>${state.active.title}</h1>
          <ul>
            <li>Type: ${this.getFileType(state.active)}</li>
            <li>Modified By Me: ${state.active.modifiedByMeDate}</li>
          </ul>
          ${state.active.thumbnailLink ? yo`<img src=${state.active.thumbnailLink} class="UppyGoogleDrive-fileThumbnail" />` : yo``}
        </div>
      `
    }

    return yo`
      <div>
        <div class="UppyGoogleDrive-header">
          <ul class="UppyGoogleDrive-breadcrumbs">
            ${breadcrumbs}
          </ul>
        </div>
        <div class="container-fluid">
          <div class="row">
            <div class="hidden-md-down col-lg-3 col-xl-3">
              <ul class="UppyGoogleDrive-sidebar">
                <li class="UppyGoogleDrive-filter"><input class="UppyGoogleDrive-focusInput" type='text' onkeyup=${this.filterQuery} placeholder="Search.." value=${state.filterInput}/></li>
                <li><button onclick=${this.getNextFolder.bind(this, 'root', 'My Drive')}><img src="https://ssl.gstatic.com/docs/doclist/images/icon_11_collection_list_3.png"/> My Drive</button></li>
                <li><button><img src="https://ssl.gstatic.com/docs/doclist/images/icon_11_shared_collection_list_1.png"/> Shared with me</button></li>
                <li><button onclick=${this.logout}>Logout</button></li>
              </ul>
            </div>
            <div class="col-md-12 col-lg-9 col-xl-6">
              <div class="UppyGoogleDrive-browserContainer">
                <table class="UppyGoogleDrive-browser">
                  <thead>
                    <tr>
                      <td class="UppyGoogleDrive-sortableHeader" onclick=${this.sortByTitle}>Name</td>
                      <td>Owner</td>
                      <td class="UppyGoogleDrive-sortableHeader" onclick=${this.sortByDate}>Last Modified</td>
                      <td>Filesize</td>
                    </tr>
                  </thead>
                  <tbody>
                    ${folders}
                    ${files}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="hidden-lg-down col-xl-2">
              <div class="UppyGoogleDrive-fileInfo">
                ${previewElem}
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  renderBrowserItem (item) {
    const state = this.core.getState().googleDrive
    const isAFileSelected = Object.keys(state.active).length !== 0 && JSON.stringify(state.active) !== JSON.stringify({})
    const isFolder = item.mimeType === 'application/vnd.google-apps.folder'
    return yo`
      <tr class=${(isAFileSelected && state.active.id === item.id) ? 'is-active' : ''}
        onclick=${this.handleClick.bind(this, item)}
        ondblclick=${isFolder ? this.getNextFolder.bind(this, item.id, item.title) : this.addFile.bind(this, item)}>
        <td><span class="UppyGoogleDrive-folderIcon"><img src=${item.iconLink}/></span> ${item.title}</td>
        <td>Me</td>
        <td>${item.modifiedByMeDate}</td>
        <td>-</td>
      </tr>
    `
  }

  renderError (err) {
    return yo`
      <div>
        <span>
          Something went wrong.  Probably our fault. ${err}
        </span>
      </div>
    `
  }

  render (state) {
    if (state.googleDrive.error) {
      return this.renderError()
    }

    if (!state.googleDrive.authenticated) {
      return this.renderAuth()
    }

    return this.renderBrowser(state.googleDrive)
  }
}
