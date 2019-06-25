const { Plugin } = require('@uppy/core')
const toArray = require('@uppy/utils/lib/toArray')
const findDOMElement = require('@uppy/utils/lib/findDOMElement')

/**
 * Add files from existing file inputs to Uppy.
 */
class AttachFileInputs extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)

    this.id = this.opts.id || 'AttachFileInputs'
    this.type = 'acquirer'

    this.handleChange = this.handleChange.bind(this)
    this.inputs = null
  }

  handleChange (event) {
    this.addFiles(event.target)
  }

  addFiles (input) {
    const files = toArray(input.files)
    files.forEach((file) => {
      try {
        this.uppy.addFile({
          source: this.id,
          name: file.name,
          type: file.type,
          data: file
        })
      } catch (err) {
        if (!err.isRestriction) {
          this.uppy.log(err)
        }
      }
    })
  }

  install () {
    this.el = findDOMElement(this.opts.target)
    if (!this.el) {
      throw new Error('[AttachFileInputs] Target form does not exist')
    }

    const { restrictions } = this.uppy.opts

    this.inputs = this.el.querySelectorAll('input[type="file"]')
    this.inputs.forEach((input) => {
      input.addEventListener('change', this.handleChange)

      if (!input.hasAttribute('multiple')) {
        if (restrictions.maxNumberOfFiles !== 1) {
          input.setAttribute('multiple', 'multiple')
        } else {
          input.removeAttribute('multiple')
        }
      }

      if (!input.hasAttribute('accept') && restrictions.allowedFileTypes) {
        input.setAttribute('accept', restrictions.allowedFileTypes.join(','))
      }

      // Check if this input already contains files (eg. user selected them before Uppy loaded,
      // or the page was refreshed and the browser kept files selected)
      this.addFiles(input)
    })
  }

  uninstall () {
    this.inputs.forEach((input) => {
      input.removeEventListener('change', this.handleChange)
    })
    this.inputs = null
  }
}

module.exports = AttachFileInputs
