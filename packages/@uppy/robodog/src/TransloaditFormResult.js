const BasePlugin = require('@uppy/core/lib/BasePlugin')
const findDOMElement = require('@uppy/utils/lib/findDOMElement')

/**
 * After an upload completes, inject result data from Transloadit in a hidden input.
 *
 * Must be added _after_ the Transloadit plugin.
 */
class TransloaditFormResult extends BasePlugin {
  constructor (uppy, opts) {
    super(uppy, opts)

    this.id = this.opts.id || 'TransloaditFormResult'
    this.type = 'modifier'

    this.handleUpload = this.handleUpload.bind(this)
  }

  getAssemblyStatuses (fileIDs) {
    const assemblyIds = new Set(
      fileIDs.map(fileID => this.uppy.getFile(fileID)?.transloadit?.assembly).filter(Boolean),
    )

    const tl = this.uppy.getPlugin(this.opts.transloaditPluginId || 'Transloadit')
    return Array.from(assemblyIds, (id) => tl.getAssembly(id))
  }

  handleUpload (fileIDs) {
    const assemblies = this.getAssemblyStatuses(fileIDs)
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = this.opts.name
    input.value = JSON.stringify(assemblies)

    const target = findDOMElement(this.opts.target)
    target.appendChild(input)
  }

  install () {
    this.uppy.addPostProcessor(this.handleUpload)
  }

  uninstall () {
    this.uppy.removePostProcessor(this.handleUpload)
  }
}

module.exports = TransloaditFormResult
