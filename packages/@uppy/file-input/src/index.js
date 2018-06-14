const Plugin = require('@uppy/core/lib/Plugin')
const toArray = require('@uppy/utils/lib/toArray')
const Translator = require('@uppy/utils/lib/Translator')
const { h } = require('preact')

module.exports = class FileInput extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'FileInput'
    this.title = 'File Input'
    this.type = 'acquirer'

    const defaultLocale = {
      strings: {
        chooseFiles: 'Choose files'
      }
    }

    // Default options
    const defaultOptions = {
      target: null,
      pretty: true,
      inputName: 'files[]',
      locale: defaultLocale
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    // i18n
    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

    this.render = this.render.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  handleInputChange (ev) {
    this.uppy.log('[FileInput] Something selected through input...')

    const files = toArray(ev.target.files)

    files.forEach((file) => {
      try {
        this.uppy.addFile({
          source: this.id,
          name: file.name,
          type: file.type,
          data: file
        })
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    })
  }

  handleClick (ev) {
    this.input.click()
  }

  render (state) {
    /* http://tympanus.net/codrops/2015/09/15/styling-customizing-file-inputs-smart-way/ */
    const hiddenInputStyle = {
      width: '0.1px',
      height: '0.1px',
      opacity: 0,
      overflow: 'hidden',
      position: 'absolute',
      zIndex: -1
    }

    const restrictions = this.uppy.opts.restrictions

    // empty value="" on file input, so that the input is cleared after a file is selected,
    // because Uppy will be handling the upload and so we can select same file
    // after removing — otherwise browser thinks it’s already selected
    return <div class="uppy-Root uppy-FileInput-container">
      <input class="uppy-FileInput-input"
        style={this.opts.pretty && hiddenInputStyle}
        type="file"
        name={this.opts.inputName}
        onchange={this.handleInputChange}
        multiple={restrictions.maxNumberOfFiles !== 1}
        accept={restrictions.allowedFileTypes}
        ref={(input) => { this.input = input }}
        value="" />
      {this.opts.pretty &&
        <button class="uppy-FileInput-btn" type="button" onclick={this.handleClick}>
          {this.i18n('chooseFiles')}
        </button>
      }
    </div>
  }

  install () {
    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    this.unmount()
  }
}
