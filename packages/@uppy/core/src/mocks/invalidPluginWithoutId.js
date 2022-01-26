const UIPlugin = require('../UIPlugin')

module.exports = class InvalidPluginWithoutName extends UIPlugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.name = this.constructor.name
  }

  run (results) {
    this.uppy.log({
      class: this.constructor.name,
      method: 'run',
      results,
    })

    return Promise.resolve('success')
  }
}
