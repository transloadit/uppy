import Plugin from './Plugin'
import Utils from '../core/Utils'
import html from '../core/html'

export default class FileInput extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'FileInput'
    this.title = 'FileInput'
    this.type = 'acquirer'

    // Default options
    const defaultOptions = {
      target: '.UppyForm',
      replaceTargetContent: true,
      multipleFiles: true,
      text: this.core.i18n('selectToUpload'),
      pretty: true
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.render = this.render.bind(this)
  }

  handleInputChange (ev) {
    this.core.log('All right, something selected through input...')

    // this added rubbish keys like “length” to the resulting array
    // const files = Object.keys(ev.target.files).map((key) => {
    //   return ev.target.files[key]
    // })

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
    // const upload = (ev) => {
    //   ev.preventDefault()
    //   ev.stopPropagation()
    //   this.core.emitter.emit('core:upload')
    // }

    const hiddenInputStyle = 'width: 0.1px; height: 0.1px; opacity: 0; overflow: hidden; position: absolute; z-index: -1;'

    const input = html`<input class="uppy-FileInput-input"
           style="${this.opts.pretty ? hiddenInputStyle : ''}"
           type="file"
           name="files[]"
           onchange=${this.handleInputChange.bind(this)}
           multiple="${this.opts.multipleFiles ? 'true' : 'false'}"
           value="">`

    return html`<form class="uppy-FileInput-form">
      ${input}

      ${this.opts.pretty
        ? html`<button class="uppy-FileInput-btn" type="button" onclick=${() => input.click()}>
          ${this.opts.text}
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
