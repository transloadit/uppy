const { Plugin } = require('@uppy/core')
const { Provider } = require('@uppy/companion-client')
const ProviderViews = require('@uppy/provider-views')
const { h } = require('preact')

module.exports = class Zoom extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'Zoom'
    Provider.initPlugin(this, opts)
    this.title = this.opts.title || 'Zoom'
    this.icon = () => (
      <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
        <g fill="none" fill-rule="evenodd">
          <rect fill="#ff00ff" width="32" height="32" rx="16" />
          <clipPath id="a">
            <path d="m-200-175h1000v562h-1000z" />
          </clipPath>
          <clipPath id="b"><circle cx="107" cy="106" r="102" />
          </clipPath>
          <clipPath id="c"><circle cx="107" cy="106" r="100" /></clipPath>
          <clipPath id="d"><circle cx="107" cy="106" r="92" /></clipPath>
          <clipPath id="e"><path clip-rule="evenodd" d="m135 94.06 26-19c2.27-1.85 4-1.42 4 2v57.94c0 3.84-2.16 3.4-4 2l-26-19zm-88-16.86v43.2a17.69 17.69 0 0 0 17.77 17.6h63a3.22 3.22 0 0 0 3.23-3.2v-43.2a17.69 17.69 0 0 0 -17.77-17.6h-63a3.22 3.22 0 0 0 -3.23 3.2z" /></clipPath>
          <g clip-path="url(#a)" transform="translate(0 -178)"><path d="m232 61h366v90h-366z" fill="#4a8cff" /></g>
          <g clip-path="url(#a)" transform="matrix(.156863 0 0 .156863 -.784314 -.627496)">
            <g clip-path="url(#b)">
              <path d="m0-1h214v214h-214z" fill="#e5e5e4" />
            </g>
            <g clip-path="url(#c)"><path d="m2 1h210v210h-210z" fill="#fff" /></g>
            <g clip-path="url(#d)"><path d="m10 9h194v194h-194z" fill="#4a8cff" /></g>
            <g clip-path="url(#e)"><path d="m42 69h128v74h-128z" fill="#fff" /></g>
          </g>
          <g clip-path="url(#a)" transform="translate(0 -178)"><path d="m232 19.25h180v38.17h-180z" fill="#90908f" /></g>
          <text>Zoom</text>
        </g>
      </svg>
    )

    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders || this.opts.serverHeaders,
      provider: 'zoom',
      pluginId: this.id
    })

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install () {
    this.view = new ProviderViews(this, {
      provider: this.provider
    })

    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.view.tearDown()
    this.unmount()
  }

  onFirstRender () {
    return this.view.getFolder()
  }

  render (state) {
    return this.view.render(state)
  }
}
