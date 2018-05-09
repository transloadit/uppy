const Plugin = require('../core/Plugin')
const { toArray } = require('../core/Utils')
const Translator = require('../core/Translator')
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
      allowMultipleFiles: true,
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
      this.uppy.addFile({
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  handleClick (ev) {
    this.input.click()
  }

  render (state) {
    const hiddenInputStyle = {
      width: '0.1px',
      height: '0.1px',
      opacity: 0,
      overflow: 'hidden',
      position: 'absolute',
      zIndex: -1
    }

    return (
      <div>
        <style>{`
          .uppy-FileInput-container {
            margin-bottom: 15px;
          }

          .uppy-FileInput-btn {
            font-family: sans-serif;
            font-size: 0.85em;
            padding: 10px 15px;
            color: blue;
            border: 1px solid blue;
            border-radius: 8px;
            cursor: pointer;
          }

          .uppy-FileInput-btn:hover {
            background-color: blue;
            color: white;
          }
          
        `}</style>
        <div class="uppy uppy-FileInput-container">
          <input class="uppy-FileInput-input"
            style={this.opts.pretty && hiddenInputStyle}
            type="file"
            name={this.opts.inputName}
            onchange={this.handleInputChange}
            multiple={this.opts.allowMultipleFiles}
            ref={(input) => { this.input = input }} />
          {this.opts.pretty &&
            <button class="uppy-FileInput-btn" type="button" onclick={this.handleClick}>
              {this.i18n('chooseFiles')}
            </button>
          }
        </div>
      </div>
    )
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
