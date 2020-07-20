const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const { h } = require('preact')
const { RequestClient } = require('@uppy/companion-client')
const Views = require('./View.js')

/**
 * Unsplash
 *
 */
module.exports = class Unsplash extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Unsplash'
    this.title = this.opts.title || 'Unsplash'
    this.type = 'acquirer'
    this.icon = () => (
      <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z" fill="#000000" fill-rule="nonzero" />
      </svg>
    )

    // Set default options and locale
    this.defaultLocale = {
      strings: {
        search: 'Search for images',
        enterTextToSearch: 'Enter text to search for images',
        searchFailed: 'Searching for images with Companion failed'
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
    this.search = this.search.bind(this)
    this.addFile = this.addFile.bind(this)

    this.client = new RequestClient(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders
    })

    // Set default state for the plugin
    // todo: find out why these can't just be instance fields instead
    this.setPluginState({
      isInputMode: true,
      files: []
    })
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)
  }

  search (query) {
    return this.client.get(`search/unsplash/list?q=${query}`)
      .then((res) => {
        if (res.error) {
          this.uppy.log('[Unsplash] Error:')
          this.uppy.log(res.error)
          throw new Error('Failed to fetch the file')
        }

        this.setPluginState({
          isInputMode: false,
          files: res.items
        })
      })
  }

  toggleClick (e, file) {
    e.stopPropagation()
    e.preventDefault()
    this.getPluginState()
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

  render (state) {
    const props = Object.assign({}, this.getPluginState(), {
      toggleSearch: this.toggleSearch,
      isChecked: this.isChecked,
      toggleClick: this.toggleClick,
      handleScroll: this.handleScroll,
      done: this.donePicking,
      cancel: this.cancelPicking,
      title: this.title,
      pluginIcon: this.icon,
      search: this.search
      // todo: investigate if this is what we need
      // i18n: this.uppy.i18n
    })

    return <Views i18n={this.i18n} {...props} />
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
