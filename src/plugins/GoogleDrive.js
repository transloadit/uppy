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
    this.files = []
    this.currentDir = 'root'

    this.checkAuthentication()
  }

  connect (target) {
    if (!this.isAuthenticated) {
      target.innerHTML = this.renderAuthentication()
    } else {
      this.getDirectory()
      .then(data => {
        target.innerHTML = this.render(data)
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

  getDirectory () {
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

  run (results) {

  }

  renderAuthentication () {
    return `<div><h1>Authenticate With Google Drive</h1><a href=${ this.authUrl || '#' }>Authenticate</a></div>`
  }

  render (data) {
    const folders = data.folders.map(folder => `<li>Folder${folder.title}</li>`)
    const files = data.files.map(file => `<li>${file.title}</li>`)

    return `<ul>${folders}</ul><ul>${files}</ul>`
  }
}
