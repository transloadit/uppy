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
      <path d="M23.637 15.312l-2.474 2.464a3.582 3.582 0 01-.577.491c-.907.657-1.897.986-2.968.986a4.925 4.925 0 01-3.959-1.971c-.248-.329-.164-.902.165-1.149.33-.247.907-.164 1.155.164 1.072 1.478 3.133 1.724 4.618.656a.642.642 0 00.33-.328l2.473-2.463c1.238-1.313 1.238-3.366-.082-4.597a3.348 3.348 0 00-4.618 0l-1.402 1.395a.799.799 0 01-1.154 0 .79.79 0 010-1.15l1.402-1.394a4.843 4.843 0 016.843 0c2.062 1.805 2.144 5.007.248 6.896zm-8.081 5.664l-1.402 1.395a3.348 3.348 0 01-4.618 0c-1.319-1.23-1.319-3.365-.082-4.596l2.475-2.464.328-.328c.743-.492 1.567-.739 2.475-.657.906.165 1.648.574 2.143 1.314.248.329.825.411 1.155.165.33-.248.412-.822.165-1.15-.825-1.068-1.98-1.724-3.216-1.888-1.238-.247-2.556.082-3.628.902l-.495.493-2.474 2.464c-1.897 1.969-1.814 5.09.083 6.977.99.904 2.226 1.396 3.463 1.396s2.473-.492 3.463-1.395l1.402-1.396a.79.79 0 000-1.15c-.33-.328-.908-.41-1.237-.082z" fill="#FF753E" fill-rule="nonzero" />
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
        name: meta.name || getFileNameFromUrl(url),
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
