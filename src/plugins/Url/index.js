const Plugin = require('../../core/Plugin')
const Translator = require('../../core/Translator')
const { h } = require('preact')
const Provider = require('../Provider')
const UrlUI = require('./UrlUI.js')
require('whatwg-fetch')

/**
 * Url
 *
 */
module.exports = class Url extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Url'
    this.title = 'Url'
    this.type = 'acquirer'
    this.icon = () => <svg aria-hidden="true" class="UppyIcon UppyModalTab-icon" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="31" />
      <g fill-rule="nonzero" fill="#FFF">
        <path d="M25.774 47.357a4.077 4.077 0 0 1-5.76 0L16.9 44.24a4.076 4.076 0 0 1 0-5.758l5.12-5.12-1.817-1.818-5.12 5.122a6.651 6.651 0 0 0 0 9.392l3.113 3.116a6.626 6.626 0 0 0 4.699 1.943c1.7 0 3.401-.649 4.697-1.943l10.241-10.243a6.591 6.591 0 0 0 1.947-4.696 6.599 6.599 0 0 0-1.947-4.696l-3.116-3.114-1.817 1.817 3.116 3.114a4.045 4.045 0 0 1 1.194 2.88 4.045 4.045 0 0 1-1.194 2.878L25.774 47.357z" />
        <path d="M46.216 14.926a6.597 6.597 0 0 0-4.696-1.946h-.001a6.599 6.599 0 0 0-4.696 1.945L26.582 25.167a6.595 6.595 0 0 0-1.947 4.697 6.599 6.599 0 0 0 1.946 4.698l3.114 3.114 1.818-1.816-3.114-3.114a4.05 4.05 0 0 1-1.194-2.882c0-1.086.424-2.108 1.194-2.878L38.64 16.744a4.042 4.042 0 0 1 2.88-1.194c1.089 0 2.11.425 2.88 1.194l3.114 3.114a4.076 4.076 0 0 1 0 5.758l-5.12 5.12 1.818 1.817 5.12-5.122a6.649 6.649 0 0 0 0-9.393l-3.113-3.114-.003.002z" />
      </g>
    </svg>

    // Set default options and locale
    const defaultLocale = {
      strings: {
        addUrl: 'Add url',
        import: 'Import',
        enterUrlToImport: 'Enter file url to import',
        failedToFetch: 'Uppy Server failed to fetch this URL'
      }
    }

    const defaultOptions = {
      locale: defaultLocale
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

    this.hostname = this.opts.host

    if (!this.hostname) {
      throw new Error('Uppy Server hostname is required, please consult https://uppy.io/docs/server')
    }

    // Bind all event handlers for referencability
    this.getMeta = this.getMeta.bind(this)
    this.addFile = this.addFile.bind(this)

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
    return this.getMeta(url).then((meta) => {
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
      return this.uppy.addFile(tagFile)
        .then(() => {
          const dashboard = this.uppy.getPlugin('Dashboard')
          if (dashboard) dashboard.hideAllPanels()
        })
    })
    .catch((err) => {
      const errorMsg = `${err.message}. Could be CORS issue?`
      this.uppy.log(errorMsg, 'error')
      this.uppy.info({
        message: this.i18n('failedToFetch'),
        details: errorMsg
      }, 'error', 4000)
    })
  }

  render (state) {
    return <UrlUI
      i18n={this.i18n}
      addFile={this.addFile} />
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
