const Plugin = require('../../core/Plugin')
const Translator = require('../../core/Translator')
const { h } = require('preact')
const { RequestClient } = require('../../server')
const UrlUI = require('./UrlUI.js')
const { toArray } = require('../../core/Utils')

/**
 * Url
 *
 */
module.exports = class Url extends Plugin {
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

    // Set default options and locale
    const defaultLocale = {
      strings: {
        import: 'Import',
        enterUrlToImport: 'Enter URL to import a file',
        failedToFetch: 'Uppy Server failed to fetch this URL, please make sure it’s correct',
        enterCorrectUrl: 'Incorrect URL: Please make sure you are entering a direct link to a file'
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
    this.handleDrop = this.handleDrop.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)

    this.handlePaste = this.handlePaste.bind(this)

    this.client = new RequestClient(uppy, {host: this.opts.host})
  }

  getFileNameFromUrl (url) {
    return url.substring(url.lastIndexOf('/') + 1)
  }

  checkIfCorrectURL (url) {
    if (!url) return false

    const protocol = url.match(/^([a-z0-9]+):\/\//)[1]
    if (protocol !== 'http' && protocol !== 'https') {
      return false
    }

    return true
  }

  addProtocolToURL (url) {
    const protocolRegex = /^[a-z0-9]+:\/\//
    const defaultProtocol = 'http://'
    if (protocolRegex.test(url)) {
      return url
    }

    return defaultProtocol + url
  }

  getMeta (url) {
    return this.client.post('url/meta', { url })
      .then((res) => {
        if (res.error) {
          this.uppy.log('[URL] Error:')
          this.uppy.log(res.error)
          throw new Error('Failed to fetch the file')
        }
        return res
      })
  }

  addFile (url) {
    url = this.addProtocolToURL(url)
    if (!this.checkIfCorrectURL(url)) {
      this.uppy.log(`[URL] Incorrect URL entered: ${url}`)
      this.uppy.info(this.i18n('enterCorrectUrl'), 'error', 4000)
      return
    }

    return this.getMeta(url)
      .then((meta) => {
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
            },
            providerOptions: this.client.opts
          }
        }
        return tagFile
      })
      .then((tagFile) => {
        this.uppy.log('[Url] Adding remote file')
        try {
          this.uppy.addFile(tagFile)
        } catch (err) {
          // Nothing, restriction errors handled in Core
        }
      })
      .then(() => {
        const dashboard = this.uppy.getPlugin('Dashboard')
        if (dashboard) dashboard.hideAllPanels()
      })
      .catch((err) => {
        this.uppy.log(err)
        this.uppy.info({
          message: this.i18n('failedToFetch'),
          details: err
        }, 'error', 4000)
      })
  }

  handleDrop (e) {
    e.preventDefault()
    if (e.dataTransfer.items) {
      const items = toArray(e.dataTransfer.items)
      items.forEach((item) => {
        if (item.kind === 'string' && item.type === 'text/uri-list') {
          item.getAsString((url) => {
            this.uppy.log(`[URL] Adding file from dropped url: ${url}`)
            this.addFile(url)
          })
        }
      })
    }
  }

  handleDragOver (e) {
    e.preventDefault()
    this.el.classList.add('drag')
  }

  handleDragLeave (e) {
    e.preventDefault()
    this.el.classList.remove('drag')
  }

  handlePaste (e) {
    if (e.clipboardData.items) {
      const items = toArray(e.clipboardData.items)

      // When a file is pasted, it appears as two items: file name string, then
      // the file itself; Url then treats file name string as URL, which is wrong.
      // This makes sure Url ignores paste event if it contains an actual file
      const hasFiles = items.filter(item => item.kind === 'file').length > 0
      if (hasFiles) return

      items.forEach((item) => {
        if (item.kind === 'string' && item.type === 'text/plain') {
          item.getAsString((url) => {
            this.uppy.log(`[URL] Adding file from pasted url: ${url}`)
            this.addFile(url)
          })
        }
      })
    }
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

    this.el.addEventListener('drop', this.handleDrop)
    this.el.addEventListener('dragover', this.handleDragOver)
    this.el.addEventListener('dragleave', this.handleDragLeave)
    this.el.addEventListener('paste', this.handlePaste)
  }

  uninstall () {
    this.el.removeEventListener('drop', this.handleDrop)
    this.el.removeEventListener('dragover', this.handleDragOver)
    this.el.removeEventListener('dragleave', this.handleDragLeave)
    this.el.removeEventListener('paste', this.handlePaste)

    this.unmount()
  }
}
