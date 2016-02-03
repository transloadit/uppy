// import Utils from '../core/Utils'
import Plugin from './Plugin'
// temporarily using superagent
import request from 'superagent'

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
    this.currentDir = '/'

    this.checkAuthentication()

    this.isAuthenticated = false
  }

  connect (target) {
    if (!this.isAuthenticated) {
      target.innerHTML = this.renderAuthentication()
    } else {
      // this.getDirectory()
      // .then(this.render)
    }
  }

  checkAuthentication () {
    request.get('http://localhost:3002/drive/auth/authorize')
    .set('Content-Type', 'application/json')
    .end((err, res) => {
      if (err) { return new Error(err) }
      this.isAuthenticated = res.body.isAuthenticated
      this.authUrl = res.body.authUrl
    })
  }

  authenticate () {
  }

  addFile () {

  }

  getDirectory () {

  }

  run (results) {

  }

  renderAuthentication () {
    return `<div><h1>Authenticate With Google Drive</h1><a href=${ this.authUrl || '#' }>Authenticate</a></div>`
  }

  render (files) {
    // for each file in the directory, create a list item element
    const elems = files.map((file, i) => {
      const icon = (file.isFolder) ? 'folder' : 'file'
      return `<li data-type="${icon}" data-name="${file.name}"><span>${icon}: </span><span> ${file.name}</span></li>`
    })

    // appends the list items to the target
    this._target.innerHTML = elems.sort().join('')

    if (this.currentDir.length > 1) {
      const parent = document.createElement('LI')
      parent.setAttribute('data-type', 'parent')
      parent.innerHTML = '<span>...</span>'
      this._target.appendChild(parent)
    }

    // add an onClick to each list item
    const fileElems = this._target.querySelectorAll('li')

    Array.prototype.forEach.call(fileElems, element => {
      const type = element.getAttribute('data-type')

      if (type === 'file') {
        element.addEventListener('click', () => {
          this.files.push(element.getAttribute('data-name'))
          console.log(`files: ${this.files}`)
        })
      } else {
        element.addEventListener('dblclick', () => {
          const length = this.currentDir.split('/').length

          if (type === 'folder') {
            this.currentDir = `${this.currentDir}${element.getAttribute('data-name')}/`
          } else if (type === 'parent') {
            this.currentDir = `${this.currentDir.split('/').slice(0, length - 2).join('/')}/`
          }
          console.log(this.currentDir)
          this.getDirectory()
        })
      }
    })
  }
}
