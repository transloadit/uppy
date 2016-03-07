import Utils from '../core/Utils'
import Plugin from './Plugin'

export default class Google extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquire'
    this.files = []
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
    if (!this.isAuthenticated) {
      this.target.innerHTML = this.renderAuth()
    } else {
      this.renderFolder()
    }
  }

  checkAuthentication () {
    fetch('http://localhost:3020/google/authorize', {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if (res.status >= 200 && res.status <= 300) {
        return res.json().then(data => {
          this.isAuthenticated = data.isAuthenticated
        })
      } else {
        let error = new Error(res.statusText)
        error.response = res
        throw error
      }
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
    .then(res => {
      if (res.status >= 200 && res.status <= 300) {
        return res.json().then(data => {
          let folders = []
          let files = []
          data.items.forEach(item => {
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
    console.log(typeof fileId)
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
    this.target = this.getTarget(this.opts.target, caller)
    console.log('this.target ===')
    console.log(this.target)
    return
  }

  renderAuth () {
    return `<div><h1>Authenticate With Google Drive</h1><a href=${ this.authUrl || '#' }>Authenticate</a></div>`
  }

  renderBrowser (data) {
    const folders = data.folders.map(folder => `<li>Folder<button class="GoogleDriveFolder" data-id="${folder.id}" data-title="${folder.title}">${folder.title}</button></li>`)
    const files = data.files.map(file => `<li><button class="GoogleDriveFile" data-id="${file.id}" data-title="${file.title}">${file.title}</button></li>`)
    return `<ul>${folders}</ul><ul>${files}</ul>`
  }

  renderFolder (folder = this.currentFolder) {
    this.getFolder(folder)
    .then(data => {
      this.target.innerHTML = this.renderBrowser(data)
      const folders = Utils.qsa('.GoogleDriveFolder')
      const files = Utils.qsa('.GoogleDriveFile')

      folders.forEach(folder => folder.addEventListener('click', e => this.renderFolder(folder.dataset.id)))
      files.forEach(file => file.addEventListener('click', e => this.getFile(file.dataset.id)))
    })
  }
}
