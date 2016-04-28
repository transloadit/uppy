import yo from 'yo-yo'
import Utils from '../core/Utils'
import Plugin from './Plugin'

export default class Google extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.files = []
    this.name = 'Google Drive'
    this.icon = yo`
      <svg class="UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16">
        <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z"/>
      </svg>
    `

    this.getFile = this.getFile.bind(this)
    this.getFolder = this.getFolder.bind(this)
    this.logout = this.logout.bind(this)
    this.renderBrowser = this.renderBrowser.bind(this)

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.currentFolder = 'root'
    this.isAuthenticated = false
  }

  update (state) {
    if (typeof this.core.getState().googleDrive !== 'undefined') {
      console.log(this.core.getState().googleDrive.directory)
    }
    if (typeof this.el === 'undefined') {
      return
    }

    const newEl = this.render(this.core.state)
    yo.update(this.el, newEl)
  }

  updateState (newState) {
    const {state} = this.core
    const googleDrive = Object.assign({}, state.googleDrive, newState)

    this.core.setState({googleDrive})
  }

  focus () {
    console.log('GoogleDrive: focus')
    this.checkAuthentication()
    .then((res) => {
      if (!this.isAuthenticated) {
        this.target.innerHTML = this.renderAuth()
      } else {
        this.renderFolder()
      }
    })
    .catch((err) => {
      this.target.innerHTML = this.renderError(err)
    })
  }

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

  getSubFolder (id, title) {
    this.getFolder(id)
      .then((data) => {
        const state = this.core.getState().googleDrive
        console.log(id)
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

  logout () {
    /**
     * Leave this here
     */
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

  renderAuth () {
    const link = `${this.opts.host}/connect/google?state=${location.href}`
    return yo`
      <div>
        <h1>Authenticate With Google Drive</h1>
        <a href=${link}>Authenticate</a>
      </div>
    `
  }

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

  renderTemp (state) {
    const breadcrumbs = state.directory.map((dir) => yo`<li><button onclick=${this.getSubFolder.bind(this, dir.id, dir.title)}>${dir.title}</button></li> `)
    const folders = state.folders.map((folder) => yo`<tr ondblclick=${this.getSubFolder.bind(this, folder.id, folder.title)}><td>[Folder] - ${folder.title}</td><td>Me</td><td>${folder.modifiedByMeDate}</td><td>-</td></tr>`)
    const files = state.files.map((file) => yo`<tr onclick=${this.getFile.bind(this, file.id)}><td>[File] - ${file.title}</td><td>Me</td><td>${file.modifiedByMeDate}</td><td>-</td></tr>`)

    return yo`
      <div>
        <ul class="UppyGoogleDrive-sidebar">
          <li>My Drive</li>
          <li>Shared with me</li>
        </ul>
        <div class="UppyGoogleDrive-header">
          <ul class="UppyGoogleDrive-breadcrumbs">
            ${breadcrumbs}
          </ul>
        </div>
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
          File active
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
        }]
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
