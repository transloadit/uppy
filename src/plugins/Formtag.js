import Plugin from './Plugin'
import Utils from '../core/Utils'
import html from '../core/html'

export default class Formtag extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.id = 'Formtag'
    this.title = 'Formtag'
    this.type = 'acquirer'

    // Default options
    const defaultOptions = {
      target: '.UppyForm',
      replaceTargetContent: true,
      multipleFiles: true
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
    const upload = (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      this.core.emitter.emit('core:upload')
    }

    return html`<form class="UppyFormContainer">
      <input class="UppyForm-input"
             type="file"
             name="files[]"
             onchange=${this.handleInputChange.bind(this)}
             multiple="${this.opts.multipleFiles ? 'true' : 'false'}"
             value="">
      ${!this.core.opts.autoProceed && this.opts.target.name !== 'Modal'
        ? html`<button class="UppyForm-uploadBtn UppyNextBtn"
                     type="submit"
                     onclick=${upload}>
              ${this.core.i18n('upload')}
            </button>`
        : ''}
    </form>`
  }

  install () {
    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
  }

  // run (results) {
  //   console.log({
  //     class: 'Formtag',
  //     method: 'run',
  //     results: results
  //   })
  //
  //   const button = document.querySelector(this.opts.doneButtonSelector)
  //   var self = this
  //
  //   return new Promise((resolve, reject) => {
  //     button.addEventListener('click', (e) => {
  //       var fields = document.querySelectorAll(self.opts.selector)
  //       var selected = [];
  //
  //       [].forEach.call(fields, (field, i) => {
  //         selected.push({
  //           from: 'Formtag',
  //           files: field.files
  //         })
  //       })
  //       resolve(selected)
  //     })
  //   })
  // }
}
