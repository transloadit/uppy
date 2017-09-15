const Plugin = require('./Plugin')
import { setFileMeta, setMeta } from '../core/Actions'

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

  handleFileAdded (fileId) {
    const metaFields = this.opts.fields
    metaFields.forEach((item) => {
      const obj = {}
      obj[item.id] = item.value
      this.core.dispatch(setFileMeta(fileId, obj))
    })
  }

  addInitialMeta () {
    const metaFields = this.opts.fields

    this.core.dispatch(setMeta({ metaFields }))

    this.core.on('core:file-added', this.handleFileAdded)
  }

  install () {
    this.addInitialMeta()
  }

  uninstall () {
    this.core.off('core:file-added', this.handleFileAdded)
  }
}
