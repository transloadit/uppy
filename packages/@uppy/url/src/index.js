const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const { h } = require('preact')
const { RequestClient } = require('@uppy/companion-client')
const UrlUI = require('./UrlUI.js')
const forEachDroppedOrPastedUrl = require('./utils/forEachDroppedOrPastedUrl')

function UrlIcon () {
  return (
    <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
      <g fill="none" fill-rule="evenodd">
        <rect fill="#FF753E" width="32" height="32" rx="16" />
        <path d="M22.788 15.389l-2.199 2.19a3.184 3.184 0 0 1-.513.437c-.806.584-1.686.876-2.638.876a4.378 4.378 0 0 1-3.519-1.752c-.22-.292-.146-.802.147-1.021.293-.22.806-.146 1.026.146.953 1.313 2.785 1.532 4.105.583a.571.571 0 0 0 .293-.292l2.199-2.189c1.1-1.167 1.1-2.992-.073-4.086a2.976 2.976 0 0 0-4.105 0l-1.246 1.24a.71.71 0 0 1-1.026 0 .703.703 0 0 1 0-1.022l1.246-1.24a4.305 4.305 0 0 1 6.083 0c1.833 1.605 1.906 4.451.22 6.13zm-7.183 5.035l-1.246 1.24a2.976 2.976 0 0 1-4.105 0c-1.172-1.094-1.172-2.991-.073-4.086l2.2-2.19.292-.291c.66-.438 1.393-.657 2.2-.584.805.146 1.465.51 1.905 1.168.22.292.733.365 1.026.146.293-.22.367-.73.147-1.022-.733-.949-1.76-1.532-2.859-1.678-1.1-.22-2.272.073-3.225.802l-.44.438-2.199 2.19c-1.686 1.75-1.612 4.524.074 6.202.88.803 1.979 1.241 3.078 1.241 1.1 0 2.199-.438 3.079-1.24l1.246-1.241a.703.703 0 0 0 0-1.022c-.294-.292-.807-.365-1.1-.073z" fill="#FFF" fill-rule="nonzero" />
      </g>
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
