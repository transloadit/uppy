import { h } from 'preact'
import { UIPlugin } from '@uppy/core'
import { RequestClient } from '@uppy/companion-client'
import toArray from '@uppy/utils/lib/toArray'
import UrlUI from './UrlUI.jsx'
import forEachDroppedOrPastedUrl from './utils/forEachDroppedOrPastedUrl.js'

import packageJson from '../package.json'
import locale from './locale.js'

function UrlIcon () {
  return (
    <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
      <g fill="none" fillRule="evenodd">
        <rect className="uppy-ProviderIconBg" fill="#FF753E" width="32" height="32" rx="16" />
        <path d="M22.788 15.389l-2.199 2.19a3.184 3.184 0 0 1-.513.437c-.806.584-1.686.876-2.638.876a4.378 4.378 0 0 1-3.519-1.752c-.22-.292-.146-.802.147-1.021.293-.22.806-.146 1.026.146.953 1.313 2.785 1.532 4.105.583a.571.571 0 0 0 .293-.292l2.199-2.189c1.1-1.167 1.1-2.992-.073-4.086a2.976 2.976 0 0 0-4.105 0l-1.246 1.24a.71.71 0 0 1-1.026 0 .703.703 0 0 1 0-1.022l1.246-1.24a4.305 4.305 0 0 1 6.083 0c1.833 1.605 1.906 4.451.22 6.13zm-7.183 5.035l-1.246 1.24a2.976 2.976 0 0 1-4.105 0c-1.172-1.094-1.172-2.991-.073-4.086l2.2-2.19.292-.291c.66-.438 1.393-.657 2.2-.584.805.146 1.465.51 1.905 1.168.22.292.733.365 1.026.146.293-.22.367-.73.147-1.022-.733-.949-1.76-1.532-2.859-1.678-1.1-.22-2.272.073-3.225.802l-.44.438-2.199 2.19c-1.686 1.75-1.612 4.524.074 6.202.88.803 1.979 1.241 3.078 1.241 1.1 0 2.199-.438 3.079-1.24l1.246-1.241a.703.703 0 0 0 0-1.022c-.294-.292-.807-.365-1.1-.073z" fill="#FFF" fillRule="nonzero" />
      </g>
    </svg>
  )
}

function addProtocolToURL (url) {
  const protocolRegex = /^[a-z0-9]+:\/\//
  const defaultProtocol = 'http://'
  if (protocolRegex.test(url)) {
    return url
  }

  return defaultProtocol + url
}

function canHandleRootDrop (e) {
  const items = toArray(e.dataTransfer.items)
  const urls = items.filter((item) => item.kind === 'string'
    && item.type === 'text/uri-list')
  return urls.length > 0
}

function checkIfCorrectURL (url) {
  if (!url) return false

  const protocol = url.match(/^([a-z0-9]+):\/\//)[1]
  if (protocol !== 'http' && protocol !== 'https') {
    return false
  }

  return true
}

function getFileNameFromUrl (url) {
  const { pathname } = new URL(url)
  return pathname.substring(pathname.lastIndexOf('/') + 1)
}
/**
 * Url
 *
 */
export default class Url extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Url'
    this.title = this.opts.title || 'Link'
    this.type = 'acquirer'
    this.icon = () => <UrlIcon />

    // Set default options and locale
    this.defaultLocale = locale

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
      companionHeaders: this.opts.companionHeaders,
      companionCookiesRule: this.opts.companionCookiesRule,
    })
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

  async addFile (protocollessUrl, optionalMeta = undefined) {
    const url = addProtocolToURL(protocollessUrl)
    if (!checkIfCorrectURL(url)) {
      this.uppy.log(`[URL] Incorrect URL entered: ${url}`)
      this.uppy.info(this.i18n('enterCorrectUrl'), 'error', 4000)
      return undefined
    }

    try {
      const meta = await this.getMeta(url)

      const tagFile = {
        meta: optionalMeta,
        source: this.id,
        name: getFileNameFromUrl(url),
        type: meta.type,
        data: {
          size: meta.size,
        },
        isRemote: true,
        body: {
          url,
        },
        remote: {
          companionUrl: this.opts.companionUrl,
          url: `${this.hostname}/url/get`,
          body: {
            fileId: url,
            url,
          },
          providerOptions: this.client.opts,
        },
      }
      this.uppy.log('[Url] Adding remote file')
      try {
        return this.uppy.addFile(tagFile)
      } catch (err) {
        if (!err.isRestriction) {
          this.uppy.log(err)
        }
        return err
      }
    } catch (err) {
      this.uppy.log(err)
      this.uppy.info({
        message: this.i18n('failedToFetch'),
        details: err,
      }, 'error', 4000)
      return err
    }
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

  render () {
    return <UrlUI i18n={this.i18n} addFile={this.addFile} />
  }

  install () {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }
}

// This is defined outside of the class body because it's not using `this`, but
// we still want it available on the prototype so the Dashboard can access it.
Url.prototype.canHandleRootDrop = canHandleRootDrop
