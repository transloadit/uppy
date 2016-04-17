import yo from 'yo-yo'
import Utils from '../core/Utils'
import Plugin from './Plugin'

export default class Google extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.files = []
    this.name = 'Google Drive'
    this.icon = `
      <svg class="UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z"/>
      </svg>
    `

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // TODO Enable this after we fix tests — they fail currently
    // because GDrive is instanciated without Core
    //
    // Set default state for Google Drive
    // this.core.setState({googleDrive: {
    //   authenticated: false,
    //   files: [],
    //   folders: [],
    //   directory: '/'
    // }})

    this.currentFolder = 'root'
    this.isAuthenticated = false
  }

  focus () {
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

  getFolder (folderId = this.core.state.googleDrive.folder) {
    return fetch(`${this.opts.host}/google/list`, {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        dir: folderId || undefined
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

  getFile (fileId) {
    if (typeof fileId !== 'string') {
      return new Error('getFile: File ID is not a string.')
    }

    return fetch(`${this.opts.host}/google/get`, {
      method: 'post',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        fileId
      }
    })
    .then((res) => {
      return res.json()
        .then((json) => json)
    })
    .catch((err) => err)
  }

  install () {
    const caller = this
    this.checkAuthentication()
      .then((authenticated) => {
        this.updateState({authenticated})

        if (authenticated) {
          return this.getFolder()
        }

        return authenticated
      })
      .then((newState) => {
        this.updateState(newState)
        this.el = this.render(this.core.state)
        this.target = this.getTarget(this.opts.target, caller, this.el)
      })

    return
  }

  logout () {
    /**
     * Leave this here
     */
    // fetch(`${this.opts.host}/google/logout`, {
    //   method: 'get',
    //   credentials: 'include',
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json'
    //   }
    // }).then(res => console.log(res))
  }

  update (state) {
    if (!this.el) {
      return
    }
    const newEl = this.render(state)
    yo.update(this.el, newEl)
  }

  updateState (newState) {
    const {state} = this.core
    const googleDrive = Object.assign({}, state.googleDrive, newState)

    this.core.setState({googleDrive})
  }

  render (state) {
    if (state.googleDrive.authenticated) {
      return this.renderBrowser(state.googleDrive)
    } else {
      return this.renderAuth()
    }
  }

  renderAuth () {
    const link = this.opts.host ? `${this.opts.host}/connect/google` : '#'
    return yo`
      <div>
        <h1>Authenticate With Google Drive</h1>
        <a href=${link}>Authenticate</a>
      </div>
    `
  }

  renderBrowser (state) {
    const folders = state.folders.map((folder) => yo`<li>Folder<button class="GoogleDriveFolder" data-id="${folder.id}" data-title="${folder.title}">${folder.title}</button></li>`)
    const files = state.files.map((file) => yo`<li><button class="GoogleDriveFile" data-id="${file.id}" data-title="${file.title}">${file.title}</button></li>`)

    return yo`
      <div>
        <ul>${folders}</ul>
        <ul>${files}</ul>
      </div>
    `
  }

  renderError (err) {
    return `Something went wrong.  Probably our fault. ${err}`
  }

  renderFolder (folder = this.currentFolder) {
    this.getFolder(folder)
    .then((data) => {
      this.target.innerHTML = this.renderBrowser(data)
      const folders = Utils.qsa('.GoogleDriveFolder')
      const files = Utils.qsa('.GoogleDriveFile')

      folders.forEach((folder) => folder.addEventListener('click', (e) => this.renderFolder(folder.dataset.id)))
      files.forEach((file) => file.addEventListener('click', (e) => this.getFile(file.dataset.id)))
    })
  }
}
