import Plugin from './Plugin'
import Utils from '../core/Utils'
import Translator from '../core/Translator'
import html from '../core/html'

export default class FileInput extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'FileInput'
    this.title = 'FileInput'
    this.type = 'acquirer'

    const defaultLocale = {
      strings: {
        selectToUpload: 'Select to upload'
      },

      pluralize: function (n) {
        if (n === 1) {
          return 0
        }
        return 1
      }
    }

    // Default options
    const defaultOptions = {
      target: '.UppyForm',
      replaceTargetContent: true,
      multipleFiles: true,
      pretty: true,
      locale: defaultLocale
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // i18n
    this.translator = new Translator({locale: this.opts.locale})
    this.i18n = this.translator.translate.bind(this.translator)

    this.render = this.render.bind(this)
  }

  handleInputChange (ev) {
    this.core.log('All right, something selected through input...')

    const files = Utils.toArray(ev.target.files)

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
           name="files[]"
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
}
