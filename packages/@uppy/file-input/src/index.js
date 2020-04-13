const { Plugin } = require('@uppy/core')
const toArray = require('@uppy/utils/lib/toArray')
const Translator = require('@uppy/utils/lib/Translator')
const { h } = require('preact')

module.exports = class FileInput extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'FileInput'
    this.title = 'File Input'
    this.type = 'acquirer'

    this.defaultLocale = {
      strings: {
        // The same key is used for the same purpose by @uppy/robodog's `form()` API, but our
        // locale pack scripts can't access it in Robodog. If it is updated here, it should
        // also be updated there!
        chooseFiles: 'Choose files'
      }
    }

    // Default options
    const defaultOptions = {
      target: null,
      pretty: true,
      inputName: 'files[]'
    }

    // Merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    this.i18nInit()

    this.render = this.render.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  setOptions (newOpts) {
    super.setOptions(newOpts)
    this.i18nInit()
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)
    this.setPluginState() // so that UI re-renders and we see the updated locale
  }

  addFiles (files) {
    const descriptors = files.map((file) => ({
      source: this.id,
      name: file.name,
      type: file.type,
      data: file
    }))

    try {
      this.uppy.addFiles(descriptors)
    } catch (err) {
      this.uppy.log(err)
    }
  }

  handleInputChange (event) {
    this.uppy.log('[FileInput] Something selected through input...')
    const files = toArray(event.target.files)
    this.addFiles(files)

    // We clear the input after a file is selected, because otherwise
    // change event is not fired in Chrome and Safari when a file
    // with the same name is selected.
    // ___Why not use value="" on <input/> instead?
    //    Because if we use that method of clearing the input,
    //    Chrome will not trigger change if we drop the same file twice (Issue #768).
    event.target.value = null
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
    const accept = restrictions.allowedFileTypes ? restrictions.allowedFileTypes.join(',') : null

    return (
      <div class="uppy-Root uppy-FileInput-container">
        <input
          class="uppy-FileInput-input"
          style={this.opts.pretty && hiddenInputStyle}
          type="file"
          name={this.opts.inputName}
          onchange={this.handleInputChange}
          multiple={restrictions.maxNumberOfFiles !== 1}
          accept={accept}
          ref={(input) => { this.input = input }}
        />
        {this.opts.pretty &&
          <button
            class="uppy-FileInput-btn"
            type="button"
            onclick={this.handleClick}
          >
            {this.i18n('chooseFiles')}
          </button>}
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
