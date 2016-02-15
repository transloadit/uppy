import Plugin from './Plugin'

/**
 * FakeModal
 *
 */
export default class FakeModal extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'view'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.targets = {}

    this.targets.spinner = '.UppyDragDrop-One-Spinner'
  }
}
