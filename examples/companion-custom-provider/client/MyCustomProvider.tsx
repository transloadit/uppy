import type {
  Body,
  Meta,
  PluginTarget,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  Uppy,
  UppyFile,
} from '@uppy/core'
import { UIPlugin } from '@uppy/core'
import {
  getAllowedHosts,
  Provider,
  tokenStorage,
} from '@uppy/core/companion-client'
import { ProviderViews } from '@uppy/core/provider-views'
// biome-ignore lint/correctness/noUnusedImports: This is used as the jsxFactory.
import { h } from '@uppy/core/utils/preact'

const defaultOptions = {}

interface MyCustomProviderPluginOptions<M extends Meta, B extends Body> {
  id?: string
  storage?: typeof tokenStorage
  companionUrl: string
  companionAllowedHosts?: string | RegExp | (string | RegExp)[] | undefined
  target?: PluginTarget<M, B> | undefined
  companionHeaders?: Record<string, string> | undefined
}

export default class MyCustomProvider<M extends Meta, B extends Body>
  extends UIPlugin<
    MyCustomProviderPluginOptions<M, B>,
    M,
    B,
    UnknownProviderPluginState
  >
  implements UnknownProviderPlugin<M, B>
{
  type = 'acquirer'
  files: UppyFile<M, B>[] = []
  rootFolderId: null = null

  provider: Provider<M, B>
  view!: ProviderViews<M, B>
  storage: typeof tokenStorage

  constructor(uppy: Uppy<M, B>, opts: MyCustomProviderPluginOptions<M, B>) {
    super(uppy, opts)
    this.id = this.opts.id || 'MyCustomProvider'
    this.storage = this.opts.storage || tokenStorage

    this.opts.companionAllowedHosts = getAllowedHosts(
      this.opts.companionAllowedHosts,
      this.opts.companionUrl,
    )
    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      provider: 'myunsplash',
      pluginId: this.id,
    })

    uppy.registerRequestClient(MyCustomProvider.name, this.provider)

    this.defaultLocale = {
      strings: {
        pluginNameMyUnsplash: 'MyUnsplash',
      },
    }

    // merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    this.i18nInit()
    this.title = this.i18n('pluginNameMyUnsplash')
  }

  install() {
    this.view = new ProviderViews(this, {
      provider: this.provider,
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall() {
    this.view!.tearDown()
    this.unmount()
  }

  icon() {
    return (
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"
          fill="#000000"
          fillRule="nonzero"
        />
      </svg>
    )
  }

  render(state: unknown) {
    return this.view!.render(state)
  }
}
