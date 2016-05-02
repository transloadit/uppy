import Utils from '../core/Utils'
import Plugin from './Plugin'
import 'whatwg-fetch'
import yo from 'yo-yo'

export default class Google extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'GoogleDriver'
    this.titile = 'Google Drive'
    this.icon = yo`
      <svg class="UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16">
        <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z"/>
      </svg>
    `

    this.files = []

    this.filterQuery = this.filterQuery.bind(this)
    this.getFile = this.getFile.bind(this)
    this.getFolder = this.getFolder.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.logout = this.logout.bind(this)
    this.renderBrowser = this.renderBrowser.bind(this)

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  update (state) {
    if (typeof this.el === 'undefined') {
      return
    }

    const newEl = this.render(this.core.state)
    yo.update(this.el, newEl)
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
  getSubFolder (id, title) {
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

  /**
   * Will soon be replaced by actual Uppy file handling.
   * Requests the server download the selected file.
   * @param  {String} fileId
   * @return {Promise} Result
   */
  getFile (fileId) {
    if (typeof fileId !== 'string') {
      return new Error('getFile: File ID is not a string.')
    }

    return fetch(`${this.opts.host}/google/get?fileId=${fileId}`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then((res) => {
      return res.json()
        .then((json) => json)
    })
    .catch((err) => err)
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
            directory: {
              title: 'My Drive',
              id: 'root'
            }
          }

          this.updateState(newState)
        }
      })
  }

  /**
   * Render user authentication view
   */
  renderAuth () {
    const link = `${this.opts.host}/connect/google?state=${location.href}`
    return yo`
      <div class="UppyGoogleDrive-authenticate">
        <h1>You need to authenticate with Google before selecting files.</h1>
        <a href=${link}>Authenticate</a>
      </div>
    `
  }

  /**
   * Deprecated for now. Old file browser render.
   */
  renderBrowser (state) {
    const breadcrumbs = state.directory.map((dir) => yo`<span><button onclick=${this.getSubFolder.bind(this, dir.id, dir.title)}>${dir.title}</button> +</span> `)
    const folders = state.folders.map((folder) => yo`<li>Folder<button class="GoogleDriveFolder" onclick=${this.getSubFolder.bind(this, folder.id, folder.title)}>${folder.title}</button></li>`)
    const files = state.files.map((file) => yo`<li><button class="GoogleDriveFile" onclick=${this.getFile.bind(this, file.id)}>${file.title}</button></li>`)

    return yo`
      <div>
        <button onclick=${this.logout}/>Logout</button>
        <div>${breadcrumbs}</div>
        <ul>${folders}</ul>
        <ul>${files}</ul>
      </div>
    `
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

  /**
   * Render file browser
   * @param  {Object} state Google Drive state
   */
  renderTemp (state) {
    let folders = []
    let files = []
    let previewElem = ''
    const isFileSelected = Object.keys(state.active).length !== 0 && JSON.stringify(state.active) !== JSON.stringify({})

    if (state.filterInput !== '') {
      folders = state.folders.filter((folder) => folder.title.toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1).map((folder) => yo`<tr class=${(isFileSelected && state.active.id === folder.id) ? 'is-active' : ''} onclick=${this.handleClick.bind(this, folder)} ondblclick=${this.getSubFolder.bind(this, folder.id, folder.title)}><td><span class="UppyGoogleDrive-folderIcon"><img src=${folder.iconLink}/></span> ${folder.title}</td><td>Me</td><td>${folder.modifiedByMeDate}</td><td>-</td></tr>`)
      files = state.files.filter((file) => file.title.toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1).map((file) => yo`<tr class=${(isFileSelected && state.active.id === file.id) ? 'is-active' : ''} onclick=${this.handleClick.bind(this, file)} ondblclick=${this.getFile.bind(this, file.id)}><td><span class="UppyGoogleDrive-fileIcon"><img src=${file.iconLink}/></span> ${file.title}</td><td>Me</td><td>${file.modifiedByMeDate}</td><td>-</td></tr>`)
    } else {
      folders = state.folders.map((folder) => yo`<tr class=${(isFileSelected && state.active.id === folder.id) ? 'is-active' : ''} onclick=${this.handleClick.bind(this, folder)} ondblclick=${this.getSubFolder.bind(this, folder.id, folder.title)}><td><span class="UppyGoogleDrive-folderIcon"><img src=${folder.iconLink}/></span> ${folder.title}</td><td>Me</td><td>${folder.modifiedByMeDate}</td><td>-</td></tr>`)
      files = state.files.map((file) => yo`<tr class=${(isFileSelected && state.active.id === file.id) ? 'is-active' : ''} onclick=${this.handleClick.bind(this, file)} ondblclick=${this.getFile.bind(this, file.id)}><td><span class="UppyGoogleDrive-fileIcon"><img src=${file.iconLink}/></span> ${file.title}</td><td>Me</td><td>${file.modifiedByMeDate}</td><td>-</td></tr>`)
    }

    const breadcrumbs = state.directory.map((dir) => yo`<li><button onclick=${this.getSubFolder.bind(this, dir.id, dir.title)}>${dir.title}</button></li> `)
    if (isFileSelected) {
      previewElem = yo`
        <div>
          <h1><span class="UppyGoogleDrive-fileIcon"><img src=${state.active.iconLink}/></span>${state.active.title}</h1>
          ${state.active.thumbnailLink ? yo`<img src=${state.active.thumbnailLink} class="UppyGoogleDrive-fileThumbnail" />` : yo``}
          <span>Type: ${this.getFileType(state.active)}</span>
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
        <ul class="UppyGoogleDrive-sidebar">
          <li><input type='text' onkeyup=${this.filterQuery} value=${state.filterInput}/></li>
          <li>My Drive</li>
          <li>Shared with me</li>
        </ul>
        <table class="UppyGoogleDrive-browser">
          <thead>
            <tr>
              <td>Name</td>
              <td>Owner</td>
              <td>Last Modified</td>
              <td>Filesize</td>
            </tr>
          </thead>
          <tbody>
            ${folders}
            ${files}
          </tbody>
        </table>
        <div class="UppyGoogleDrive-fileInfo">
          ${previewElem}
        </div>
      </div>
    `
  }

  renderError (err) {
    return `Something went wrong.  Probably our fault. ${err}`
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

    this.el = this.render(this.core.state)
    this.target = this.getTarget(this.opts.target, this, this.el, this.render.bind(this))

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

  render (state) {
    if (state.googleDrive.authenticated) {
      return this.renderTemp(state.googleDrive)
    } else {
      return this.renderAuth()
    }
  }
}
