const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const { h } = require('preact')
const { RequestClient } = require('@uppy/companion-client')
const UrlUI = require('./UrlUI.js')
const forEachDroppedOrPastedUrl = require('./utils/forEachDroppedOrPastedUrl')

function UrlIcon () {
  return (
    <svg aria-hidden="true" focusable="false" width="23" height="23" viewBox="0 0 23 23">
      <path d="M20.485 11.236l-2.748 2.737c-.184.182-.367.365-.642.547-1.007.73-2.107 1.095-3.298 1.095-1.65 0-3.298-.73-4.398-2.19-.275-.365-.183-1.003.183-1.277.367-.273 1.008-.182 1.283.183 1.191 1.642 3.482 1.915 5.13.73a.714.714 0 0 0 .367-.365l2.75-2.737c1.373-1.46 1.373-3.74-.093-5.108a3.72 3.72 0 0 0-5.13 0L12.33 6.4a.888.888 0 0 1-1.283 0 .88.88 0 0 1 0-1.277l1.558-1.55a5.38 5.38 0 0 1 7.605 0c2.29 2.006 2.382 5.564.274 7.662zm-8.979 6.294L9.95 19.081a3.72 3.72 0 0 1-5.13 0c-1.467-1.368-1.467-3.74-.093-5.108l2.75-2.737.366-.365c.824-.547 1.74-.82 2.748-.73 1.008.183 1.833.639 2.382 1.46.275.365.917.456 1.283.182.367-.273.458-.912.183-1.277-.916-1.186-2.199-1.915-3.573-2.098-1.374-.273-2.84.091-4.031 1.004l-.55.547-2.749 2.737c-2.107 2.189-2.015 5.655.092 7.753C4.727 21.453 6.101 22 7.475 22c1.374 0 2.749-.547 3.848-1.55l1.558-1.551a.88.88 0 0 0 0-1.278c-.367-.364-1.008-.456-1.375-.09z" fill="#FF814F" fill-rule="nonzero" />
    </svg>
  )
}

/**
 * Url
 *
 */
module.exports = class Url extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Url'
    this.title = this.opts.title || 'Link'
    this.type = 'acquirer'
    this.icon = () => <UrlIcon />

    // Set default options and locale
    this.defaultLocale = {
      strings: {
        import: 'Import',
        enterUrlToImport: 'Enter URL to import a file',
        failedToFetch: 'Companion failed to fetch this URL, please make sure it’s correct',
        enterCorrectUrl: 'Incorrect URL: Please make sure you are entering a direct link to a file'
      }
    }

    const defaultOptions = {}

    this.opts = { ...defaultOptions, ...opts }

    this.i18nInit()

    this.hostname = this.opts.companionUrl

    if (!this.hostname) {
      throw new Error('Companion hostname is required, please consult https://uppy.io/docs/companion')
    }

    // Bind all event handlers for referencability
    this.getMeta = this.getMeta.bind(this)
    this.addFile = this.addFile.bind(this)
    this.handleRootDrop = this.handleRootDrop.bind(this)
    this.handleRootPaste = this.handleRootPaste.bind(this)

    this.client = new RequestClient(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders || this.opts.serverHeaders
    })
  }

  setOptions (newOpts) {
    super.setOptions(newOpts)
    this.i18nInit()
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)
    this.setPluginState() // so that UI re-renders and we see the updated locale
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
            companionUrl: this.opts.companionUrl,
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
          if (!err.isRestriction) {
            this.uppy.log(err)
          }
        }
      })
      .catch((err) => {
        this.uppy.log(err)
        this.uppy.info({
          message: this.i18n('failedToFetch'),
          details: err
        }, 'error', 4000)
      })
  }

  handleRootDrop (e) {
    forEachDroppedOrPastedUrl(e.dataTransfer, 'drop', (url) => {
      this.uppy.log(`[URL] Adding file from dropped url: ${url}`)
      this.addFile(url)
    })
  }

  handleRootPaste (e) {
    forEachDroppedOrPastedUrl(e.clipboardData, 'paste', (url) => {
      this.uppy.log(`[URL] Adding file from pasted url: ${url}`)
      this.addFile(url)
    })
  }

  render (state) {
    return <UrlUI i18n={this.i18n} addFile={this.addFile} />
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
