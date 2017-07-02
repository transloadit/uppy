const Plugin = require('./Plugin')

/**
 * Meta Data
 * Adds metadata fields to Uppy
 *
 */
module.exports = class MetaData extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'modifier'
    this.id = 'MetaData'
    this.title = 'Meta Data'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.handleFileAdded = this.handleFileAdded.bind(this)
  }

  handleFileAdded (fileID) {
    const metaFields = this.opts.fields

    metaFields.forEach((item) => {
      const obj = {}
      obj[item.id] = item.value
      console.log(obj)
      this.core.updateMeta(obj, fileID)
    })
  }

  addInitialMeta () {
    const metaFields = this.opts.fields

    this.core.setState({
      metaFields: metaFields
    })

    this.core.on('core:file-added', this.handleFileAdded)
  }

  install () {
    this.addInitialMeta()
  }

  uninstall () {
    this.core.off('core:file-added', this.handleFileAdded)
  }
}
