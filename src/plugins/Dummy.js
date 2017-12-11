const Plugin = require('../core/Plugin')
const html = require('yo-yo')
// const yo = require('yo-yo')

/**
 * Dummy
 * A test plugin, does nothing useful
 */
module.exports = class Dummy extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = this.opts.id || 'Dummy'
    this.title = 'Mr. Plugin'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.strange = html`<h1>this is strange 1</h1>`
    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
  }

  addFakeFileJustToTest () {
    const blob = new Blob(
      ['data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTIwIDEyMCI+CiAgPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNTAiLz4KPC9zdmc+Cg=='],
      {type: 'image/svg+xml'}
    )
    const file = {
      source: 'acceptance-test',
      name: 'test-file',
      type: 'image/svg+xml',
      data: blob
    }
    this.props.log('Adding fake file blob')
    this.props.addFile(file)
  }

  render (state) {
    const bla = html`<h2>this is strange 2</h2>`
    return html`
      <div class="wow-this-works">
        <input class="UppyDummy-firstInput" type="text" value="hello" onload=${(el) => {
          el.focus()
        }} />
        ${this.strange}
        ${bla}
        ${state.dummy.text}
      </div>
    `
  }

  install () {
    this.uppy.setState({dummy: {text: '123'}})

    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }

    setTimeout(() => {
      this.uppy.setState({dummy: {text: '!!!'}})
    }, 2000)
  }
}

// module.exports = function (core, opts) {
//   if (!(this instanceof Dummy)) {
//     return new Dummy(core, opts)
//   }
// }
