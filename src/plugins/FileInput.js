const Plugin = require('./Plugin')
const { toArray } = require('../core/Utils')
const Translator = require('../core/Translator')
const html = require('yo-yo')

module.exports = class FileInput extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'FileInput'
    this.title = 'File Input'
    this.type = 'acquirer'

    const defaultLocale = {
      strings: {
        selectToUpload: 'Select to upload'
      }
    }

    // Default options
    const defaultOptions = {
      target: '.UppyForm',
      getMetaDataFromForm: true,
      replaceTargetContent: true,
      multipleFiles: true,
      pretty: true,
      locale: defaultLocale,
      inputName: 'files[]'
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    // i18n
    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

    this.render = this.render.bind(this)
  }

  handleInputChange (ev) {
    this.core.log('All right, something selected through input...')

    const files = toArray(ev.target.files)

    files.forEach((file) => {
      this.core.emitter.emit('core:file-add', {
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  render (state) {
    const hiddenInputStyle = 'width: 0.1px; height: 0.1px; opacity: 0; overflow: hidden; position: absolute; z-index: -1;'

    const input = html`<input class="uppy-FileInput-input"
           style="${this.opts.pretty ? hiddenInputStyle : ''}"
           type="file"
           name=${this.opts.inputName}
           onchange=${this.handleInputChange.bind(this)}
           multiple="${this.opts.multipleFiles ? 'true' : 'false'}"
           value="">`

    return html`<form class="Uppy uppy-FileInput-form">
      ${input}
      ${this.opts.pretty
        ? html`<button class="uppy-FileInput-btn" type="button" onclick=${() => input.click()}>
          ${this.i18n('selectToUpload')}
        </button>`
       : null
     }
    </form>`
  }

  install () {
    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
  }

  uninstall () {
    this.unmount()
  }
}
