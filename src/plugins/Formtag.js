import Plugin from './Plugin'
import Utils from '../core/Utils'
import yo from 'yo-yo'

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
  }

  handleInputChange (ev) {
    this.core.log('All right, something selected through input...')

    // this added rubbish keys like “length” to the resulting array
    //
    // const files = Object.keys(ev.target.files).map((key) => {
    //   return ev.target.files[key]
    // })

    this.core.emitter.emit('file-add', {
      plugin: this,
      acquiredFiles: Utils.toArray(ev.target.files)
    })
  }

  render (state) {
    const next = (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      this.core.emitter.emit('next')
    }

    return yo`<form class="UppyFormContainer">
      <input class="UppyForm-input"
             type="file"
             name="files[]"
             onchange=${this.handleInputChange.bind(this)}
             multiple="${this.opts.multipleFiles ? 'true' : 'false'}">
      ${!this.core.opts.autoProceed && this.opts.target.name !== 'Modal'
        ? yo`<button class="UppyForm-uploadBtn UppyNextBtn"
                     type="submit"
                     onclick=${next}>
              ${this.core.i18n('upload')}
            </button>`
        : ''}
    </form>`
  }

  install () {
    this.el = this.render(this.core.state)
    this.target = this.getTarget(this.opts.target, this, this.el, this.render.bind(this))
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
