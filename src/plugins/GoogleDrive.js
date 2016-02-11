// import Utils from '../core/Utils'
import Plugin from './Plugin'

export default class Drive extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'selecter'
    this.authenticate = this.authenticate.bind(this)
    this.connect = this.connect.bind(this)
    this.render = this.render.bind(this)
    this.renderAuthentication = this.renderAuthentication.bind(this)
    this.checkAuthentication = this.checkAuthentication.bind(this)
    this.getDirectory = this.getDirectory.bind(this)
    this.files = []
    this.currentDir = 'root'

    this.checkAuthentication()
  }

  connect (target) {
    this.target = target
    if (!this.isAuthenticated) {
      target.innerHTML = this.renderAuthentication()
    } else {
      this.getDirectory()
      .then(data => {
        target.innerHTML = this.render(data)

        const folders = [...document.querySelectorAll('.GoogleDriveFolder')]
        const files = [...document.querySelectorAll('.GoogleDriveFile')]

        folders.forEach(folder => folder.addEventListener('click', e => this.getDirectory(folder.dataset.id)))
        files.forEach(file => file.addEventListener('click', e => this.getFile(file.dataset.id)))
      })
    }
  }

  checkAuthentication () {
    fetch('http://localhost:3002/drive/auth/authorize', {
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
          this.authUrl = data.authUrl
        })
      } else {
        let error = new Error(res.statusText)
        error.response = res
        throw error
      }
    })
  }

  authenticate () {
  }

  addFile () {
  }

  getDirectory (folderId) {
    /**
     * Leave this here
     */
    // fetch('http://localhost:3002/drive/logout', {
    //   method: 'get',
    //   credentials: 'include',
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json'
    //   }
    // }).then(res => console.log(res))
    return fetch('http://localhost:3002/drive/list', {
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
    // if (fileId !== 'string') {
    //   return console.log('Error: File Id not a string.')
    // }
    return fetch('http://localhost:3002/drive/get', {
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

  run (results) {

  }

  renderAuthentication () {
    return `<div><h1>Authenticate With Google Drive</h1><a href=${ this.authUrl || '#' }>Authenticate</a></div>`
  }

  render (data) {
    const folders = data.folders.map(folder => `<li>Folder<button class="GoogleDriveFolder" data-id="${folder.id}" data-title="${folder.title}">${folder.title}</button></li>`)
    const files = data.files.map(file => `<li><button class="GoogleDriveFile" data-id="${file.id}" data-title="${file.title}">${file.title}</button></li>`)

    return `<ul>${folders}</ul><ul>${files}</ul>`
  }
}
