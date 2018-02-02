const Plugin = require('../../core/Plugin')
const { h } = require('preact')
const Provider = require('../Provider')
// const Utils = require('../../core/Utils')
require('whatwg-fetch')

/**
 * Link
 *
 */
module.exports = class Link extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Url'
    this.title = 'Link'
    this.type = 'acquirer'
    this.icon = () => <svg aria-hidden="true" class="UppyIcon UppyModalTab-icon" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="31" />
      <g fill-rule="nonzero" fill="#FFF">
        <path d="M25.774 47.357a4.077 4.077 0 0 1-5.76 0L16.9 44.24a4.076 4.076 0 0 1 0-5.758l5.12-5.12-1.817-1.818-5.12 5.122a6.651 6.651 0 0 0 0 9.392l3.113 3.116a6.626 6.626 0 0 0 4.699 1.943c1.7 0 3.401-.649 4.697-1.943l10.241-10.243a6.591 6.591 0 0 0 1.947-4.696 6.599 6.599 0 0 0-1.947-4.696l-3.116-3.114-1.817 1.817 3.116 3.114a4.045 4.045 0 0 1 1.194 2.88 4.045 4.045 0 0 1-1.194 2.878L25.774 47.357z" />
        <path d="M46.216 14.926a6.597 6.597 0 0 0-4.696-1.946h-.001a6.599 6.599 0 0 0-4.696 1.945L26.582 25.167a6.595 6.595 0 0 0-1.947 4.697 6.599 6.599 0 0 0 1.946 4.698l3.114 3.114 1.818-1.816-3.114-3.114a4.05 4.05 0 0 1-1.194-2.882c0-1.086.424-2.108 1.194-2.878L38.64 16.744a4.042 4.042 0 0 1 2.88-1.194c1.089 0 2.11.425 2.88 1.194l3.114 3.114a4.076 4.076 0 0 1 0 5.758l-5.12 5.12 1.818 1.817 5.12-5.122a6.649 6.649 0 0 0 0-9.393l-3.113-3.114-.003.002z" />
      </g>
    </svg>

    // set default options
    const defaultOptions = {}

    this.opts = Object.assign({}, defaultOptions, opts)

    this.hostname = this.opts.host

    // Bind all event handlers for referencability
    ;['getMeta', 'handleClick'].forEach(method => {
      this[method] = this[method].bind(this)
    })

    this[this.id] = new Provider(uppy, {
      host: this.opts.host,
      provider: 'url',
      authProvider: 'url'
    })
  }

  getMeta (url) {
    return fetch(`${this.hostname}/url/meta`, {
      method: 'post',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url
      })
    })
    .then(this[this.id].onReceiveResponse)
    .then((res) => res.json())
  }

  getFileNameFromUrl (url) {
    return url.substring(url.lastIndexOf('/') + 1)
  }

  addFile (url) {
    this.getMeta(url).then((meta) => {
      const tagFile = {
        source: this.id,
        name: this.getFileNameFromUrl(url),
        type: meta.type,
        data: {
          size: meta.size
        },
        isRemote: true,
        body: {
          url: url
        },
        remote: {
          host: this.opts.host,
          url: `${this.hostname}/url/get`,
          body: {
            fileId: url,
            url: url
          }
        }
      }

      this.uppy.log('[Url] Adding remote file')
      this.uppy.addFile(tagFile)
        .then(() => {
          const dashboard = this.uppy.getPlugin('Dashboard')
          if (dashboard) dashboard.hideAllPanels()
        })
    })
  }

  handleClick () {
    this.addFile(this.input.value)
  }

  render (state) {
    return <div class="uppy-Url">
      <input
        class="uppy-Url-input"
        type="text"
        placeholder="Enter file url to import"
        ref={(input) => { this.input = input }}
        value="" />
      <button
        class="uppy-Url-importButton"
        type="button"
        aria-label="Add url"
        onclick={this.handleClick}>
        <svg aria-hidden="true" class="uppy-icon uppy-Url-importButton-icon" width="63" height="63" viewBox="0 0 63 63" xmlns="http://www.w3.org/2000/svg">
          <g fill-rule="nonzero" fill="#fff">
            <path d="M11.309 39.968a5.394 5.394 0 0 1-5.389-5.389l.002-5.828a5.393 5.393 0 0 1 5.387-5.386l9.58-.001v-3.4l-9.582.001c-4.844.002-8.785 3.943-8.786 8.786l-.002 5.83c-.001 2.33.926 4.566 2.578 6.212a8.768 8.768 0 0 0 6.21 2.576h19.165a8.72 8.72 0 0 0 6.214-2.573 8.73 8.73 0 0 0 2.572-6.214l-.002-5.83h-3.4l.003 5.83a5.352 5.352 0 0 1-1.577 3.81 5.351 5.351 0 0 1-3.81 1.576H11.309z" />
            <path d="M60.773 28.752a8.728 8.728 0 0 0-2.573-6.214l-.001-.001a8.73 8.73 0 0 0-6.213-2.573H32.824a8.725 8.725 0 0 0-6.215 2.573 8.73 8.73 0 0 0-2.575 6.216v5.826l3.4.002v-5.827a5.357 5.357 0 0 1 1.578-3.812 5.353 5.353 0 0 1 3.81-1.576h19.162a5.348 5.348 0 0 1 3.811 1.577 5.353 5.353 0 0 1 1.577 3.811v5.827a5.392 5.392 0 0 1-5.386 5.386h-9.579v3.4l9.583-.001c4.846 0 8.786-3.941 8.786-8.787v-5.826h-.003z" />
          </g>
        </svg>
      </button>
    </div>
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
