const Plugin = require('../../core/Plugin')
const html = require('yo-yo')
require('whatwg-fetch')

/**
 * Progress bar
 *
 */
module.exports = class Link extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Link'
    this.title = 'Link'
    this.type = 'acquirer'

    // set default options
    const defaultOptions = {
      target: 'body',
      replaceTargetContent: false,
      fixed: false
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // Bind all event handlers for referencability
    ;['handleChange', 'fetchFile'].forEach(method => {
      this[method] = this[method].bind(this)
    })
  }

  fetchFile (url) {
    const processStatus = (response) => {
      if (response.status === 200 || response.status === 0) {
        return Promise.resolve(response)
      } else {
        return Promise.reject(new Error('Error loading: ' + url))
      }
    }

    fetch(url, { mode: 'cors' })
      .then(processStatus)
      .then((response) => {
        console.log(response)
        return response.blob()
      }).then((myBlob) => {
        console.log(myBlob)
        var objectURL = URL.createObjectURL(myBlob)
        this.imgEl.src = objectURL
      })
      .catch(err => this.uppy.info(err))
  }

  handleKey (ev) {
    if (ev.key === 13) {
      ev.preventDefault()
    }
    // console.log(ev.target.value)
  }

  handlePaste (ev) {
    ev.stopPropagation()
    // console.log(ev.target.value)
  }

  handleChange (ev) {
    console.log(ev.target.value)
    this.selectedURL = ev.target.value
    this.fetchFile(this.selectedURL)
  }

  render (state) {
    return html`<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
      <input style="width: 80%; height: 50px; padding-left: 10px;" 
        type="text" 
        placeholder="your URL"
        value=""
        onchange=${this.handleChange}
        onkeypress=${this.handleKey}
        onkeyup=${this.handleKey}
        onkeydown=${this.handleKey}
        onpaste=${this.handlePaste} />
      <button type="button">Select</button>
    </div>`
  }

  install () {
    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }
}
