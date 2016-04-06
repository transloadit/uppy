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
    this.authUrl = 'http://localhost:3020/connect/google'
    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
    this.currentFolder = 'root'
    this.isAuthenticated = false
    this.checkAuthentication()
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
    return fetch('http://localhost:3020/google/authorize', {
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
          this.isAuthenticated = data.isAuthenticated
        })
      } else {
        let error = new Error(res.statusText)
        error.response = res
        throw error
      }
    })
    .catch((err) => {
      this.target.innerHTML = this.renderError(err)
    })
  }

  getFolder (folderId = this.currentFolder) {
    /**
     * Leave this here
     */
    // fetch('http://localhost:3020/google/logout', {
    //   method: 'get',
    //   credentials: 'include',
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json'
    //   }
    // }).then(res => console.log(res))
    return fetch('http://localhost:3020/google/list', {
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
      }
    })
  }

  getFile (fileId) {
    if (fileId !== 'string') {
      return console.log('Error: File Id not a string.')
    }
    return fetch('http://localhost:3020/google/get', {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        fileId
      }
    })
  }

  install () {
    const caller = this
    this.target = document.querySelector(this.getTarget(this.opts.target, caller))
    return
  }

  render (state) {
    if (state.authenticated) {
      this.renderBrowser()
    } else {
      this.renderAuth(state)
    }
  }

  renderAuth () {
    return yo`
      <div>
        <h1>Authenticate With Google Drive</h1>
        <a href=${this.authUrl || '#'}>Authenticate</a>
      </div>
    `
  }

  renderBrowser (state) {
    const folders = state.folders.map((folder) => `<li>Folder<button class="GoogleDriveFolder" data-id="${folder.id}" data-title="${folder.title}">${folder.title}</button></li>`)
    const files = state.files.map((file) => `<li><button class="GoogleDriveFile" data-id="${file.id}" data-title="${file.title}">${file.title}</button></li>`)

    return yo`
      <ul>${folders}</ul>
      <ul>${files}</ul>
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
