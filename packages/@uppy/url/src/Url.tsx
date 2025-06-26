import {
  type CompanionPluginOptions,
  RequestClient,
} from '@uppy/companion-client'
import type { Body, Meta } from '@uppy/core'
import { UIPlugin, type Uppy } from '@uppy/core'
import type { LocaleStrings } from '@uppy/utils/lib/Translator'
import toArray from '@uppy/utils/lib/toArray'
import type { TagFile } from '@uppy/utils/lib/UppyFile'
// biome-ignore lint/style/useImportType: h is not a type
import { type ComponentChild, h } from 'preact'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'
import UrlUI from './UrlUI.js'
import forEachDroppedOrPastedUrl from './utils/forEachDroppedOrPastedUrl.js'

function UrlIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="32"
      height="32"
      viewBox="0 0 32 32"
    >
      <path
        d="M23.637 15.312l-2.474 2.464a3.582 3.582 0 01-.577.491c-.907.657-1.897.986-2.968.986a4.925 4.925 0 01-3.959-1.971c-.248-.329-.164-.902.165-1.149.33-.247.907-.164 1.155.164 1.072 1.478 3.133 1.724 4.618.656a.642.642 0 00.33-.328l2.473-2.463c1.238-1.313 1.238-3.366-.082-4.597a3.348 3.348 0 00-4.618 0l-1.402 1.395a.799.799 0 01-1.154 0 .79.79 0 010-1.15l1.402-1.394a4.843 4.843 0 016.843 0c2.062 1.805 2.144 5.007.248 6.896zm-8.081 5.664l-1.402 1.395a3.348 3.348 0 01-4.618 0c-1.319-1.23-1.319-3.365-.082-4.596l2.475-2.464.328-.328c.743-.492 1.567-.739 2.475-.657.906.165 1.648.574 2.143 1.314.248.329.825.411 1.155.165.33-.248.412-.822.165-1.15-.825-1.068-1.98-1.724-3.216-1.888-1.238-.247-2.556.082-3.628.902l-.495.493-2.474 2.464c-1.897 1.969-1.814 5.09.083 6.977.99.904 2.226 1.396 3.463 1.396s2.473-.492 3.463-1.395l1.402-1.396a.79.79 0 000-1.15c-.33-.328-.908-.41-1.237-.082z"
        fill="#FF753E"
        fill-rule="nonzero"
      />
    </svg>
  )
}

function addProtocolToURL(url: string) {
  const protocolRegex = /^[a-z0-9]+:\/\//
  const defaultProtocol = 'http://'
  if (protocolRegex.test(url)) {
    return url
  }

  return defaultProtocol + url
}

function canHandleRootDrop(e: DragEvent) {
  const items = toArray(e.dataTransfer!.items)
  const urls = items.filter(
    (item) => item.kind === 'string' && item.type === 'text/uri-list',
  )
  return urls.length > 0
}

function checkIfCorrectURL(url?: string) {
  return url?.startsWith('http://') || url?.startsWith('https://')
}

function getFileNameFromUrl(url: string) {
  const { pathname } = new URL(url)
  return pathname.substring(pathname.lastIndexOf('/') + 1)
}

/*
 * Response from the /url/meta Companion endpoint.
 * Has to be kept in sync with `getURLMeta` in `companion/src/server/helpers/request.js`.
 */
type MetaResponse = {
  name: string
  type: string
  size: number | null
  statusCode: number
}

export type UrlOptions = CompanionPluginOptions & {
  locale?: LocaleStrings<typeof locale>
}

export default class Url<M extends Meta, B extends Body> extends UIPlugin<
  UrlOptions,
  M,
  B
> {
  static VERSION = packageJson.version

  static requestClientId = Url.name

  icon: () => h.JSX.Element

  hostname: string

  client: RequestClient<M, B>

  canHandleRootDrop!: typeof canHandleRootDrop

  constructor(uppy: Uppy<M, B>, opts: UrlOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'Url'
    this.type = 'acquirer'
    this.icon = () => <UrlIcon />

    // Set default options and locale
    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameUrl')

    this.hostname = this.opts.companionUrl

    if (!this.hostname) {
      throw new Error(
        'Companion hostname is required, please consult https://uppy.io/docs/companion',
      )
    }

    this.client = new RequestClient(uppy, {
      pluginId: this.id,
      provider: 'url',
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionCookiesRule: this.opts.companionCookiesRule,
    })

    this.uppy.registerRequestClient(Url.requestClientId, this.client)
  }

  private getMeta = (url: string): Promise<MetaResponse> => {
    return this.client.post<MetaResponse>('url/meta', { url })
  }

  private addFile = async (
    protocollessUrl: string,
    optionalMeta?: M,
  ): Promise<string | undefined> => {
    // Do not process local files
    if (protocollessUrl.startsWith('blob')) {
      return undefined
    }
    const url = addProtocolToURL(protocollessUrl)
    if (!checkIfCorrectURL(url)) {
      this.uppy.log(`[URL] Incorrect URL entered: ${url}`)
      this.uppy.info(this.i18n('enterCorrectUrl'), 'error', 4000)
      return undefined
    }

    this.uppy.log(`[URL] Adding file from dropped/pasted url: ${url}`)

    try {
      const meta = await this.getMeta(url)

      const tagFile: TagFile<M> = {
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
          requestClientId: Url.requestClientId,
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
      this.uppy.info(
        {
          message: this.i18n('failedToFetch'),
          details: err,
        },
        'error',
        4000,
      )
      return err
    }
  }

  private handleRootDrop = (e: DragEvent) => {
    forEachDroppedOrPastedUrl(e.dataTransfer!, 'drop', (url) => {
      this.addFile(url)
    })
  }

  private handleRootPaste = (e: ClipboardEvent) => {
    forEachDroppedOrPastedUrl(e.clipboardData!, 'paste', (url) => {
      this.addFile(url)
    })
  }

  render(): ComponentChild {
    return <UrlUI i18n={this.i18n} addFile={this.addFile} />
  }

  install(): void {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall(): void {
    this.unmount()
  }
}

// This is defined outside of the class body because it's not using `this`, but
// we still want it available on the prototype so the Dashboard can access it.
Url.prototype.canHandleRootDrop = canHandleRootDrop
