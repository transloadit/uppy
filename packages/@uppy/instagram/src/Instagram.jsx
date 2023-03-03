import { h } from 'preact'

import { UIPlugin } from '@uppy/core'
import { Provider } from '@uppy/companion-client'
import { ProviderViews } from '@uppy/provider-views'

import packageJson from '../package.json'
import locale from './locale.js'

export default class Instagram extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Instagram'
    Provider.initPlugin(this, opts)
    this.icon = () => (
      <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
        <defs>
          <path d="M11.799 0c.69.003 1.107.01 1.495.021l.193.007.616.025c1.064.046 1.791.214 2.428.46a4.894 4.894 0 011.773 1.15c.557.555.9 1.111 1.157 1.769.248.636.419 1.362.47 2.426.05 1.067.062 1.407.067 4.122l.001.566v.927c-.002 1.41-.017 1.8-.053 2.63-.047 1.064-.214 1.792-.46 2.428a4.903 4.903 0 01-1.15 1.773c-.554.557-1.112.9-1.769 1.157-.636.248-1.362.419-2.426.47-1.066.05-1.407.062-4.123.067L9.453 20h-.927a62.037 62.037 0 01-1.792-.02l-.2-.007c-.2-.007-.4-.016-.638-.026-1.064-.047-1.792-.214-2.428-.46a4.904 4.904 0 01-1.773-1.15 4.895 4.895 0 01-1.157-1.769c-.249-.635-.419-1.362-.47-2.426-.05-1.066-.062-1.407-.067-4.122V8.2c.002-.69.008-1.107.02-1.495l.007-.193c.006-.192.015-.387.025-.616.047-1.064.214-1.792.46-2.428a4.9 4.9 0 011.15-1.773A4.892 4.892 0 013.433.538c.634-.249 1.36-.42 2.425-.47C6.924.019 7.265.007 9.98.002zm-.16 1.802h-1.368l-.575.001c-1.759.004-2.409.011-3.027.034l-.196.007-.53.024c-.974.047-1.503.21-1.855.348-.467.182-.8.399-1.149.75-.349.35-.565.684-.746 1.151-.135.353-.298.883-.34 1.857a45.698 45.698 0 00-.051 2.385v1.656c.004 1.978.011 2.664.035 3.315l.007.196.024.53c.046.974.21 1.503.348 1.856.182.466.4.799.75 1.148.35.348.684.565 1.151.746.353.136.883.298 1.858.34.273.012.497.021.725.029l.198.006c.369.01.786.015 1.461.016h1.656c1.978-.004 2.664-.011 3.316-.035l.195-.007.53-.024c.974-.046 1.503-.21 1.855-.348.467-.182.8-.4 1.149-.75s.565-.684.746-1.15c.136-.354.297-.884.34-1.859.034-.78.048-1.157.051-2.384l.001-.396V10.271l-.001-.287c-.004-1.978-.011-2.664-.035-3.316l-.008-.195a89.293 89.293 0 00-.024-.53c-.046-.974-.21-1.504-.347-1.855-.182-.468-.4-.8-.75-1.149a3.095 3.095 0 00-1.152-.746c-.352-.136-.882-.298-1.856-.34a45.347 45.347 0 00-2.386-.051zM9.99 4.865a5.136 5.136 0 11.02 10.27 5.136 5.136 0 01-.02-10.27zm.004 1.801a3.333 3.333 0 10.013 6.667 3.333 3.333 0 00-.013-6.667zm5.331-3.214a1.2 1.2 0 11.004 2.4 1.2 1.2 0 01-.004-2.4z" id="a" />
        </defs>
        <g transform="translate(6 6)" fill="none" fillRule="evenodd">
          <mask id="b" fill="#fff"><use xlinkHref="#a" /></mask>
          <use fill="none" xlinkHref="#a" />
          <image mask="url(#b)" x="-1" y="-1" width="22" height="22" xlinkHref="data:image/png;base64,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" />
        </g>
      </svg>
    )

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameInstagram')

    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'instagram',
      pluginId: this.id,
    })

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install () {
    this.view = new ProviderViews(this, {
      provider: this.provider,
      viewType: 'grid',
      showTitles: false,
      showFilter: false,
      showBreadcrumbs: false,
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.view.tearDown()
    this.unmount()
  }

  onFirstRender () {
    return Promise.all([
      this.provider.fetchPreAuthToken(),
      this.view.getFolder('recent'),
    ])
  }

  render (state) {
    return this.view.render(state)
  }
}
