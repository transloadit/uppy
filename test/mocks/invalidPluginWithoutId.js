const Plugin = require('@uppy/core/lib/Plugin')

module.exports = class InvalidPluginWithoutName extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.name = this.constructor.name
  }

  run (results) {
    this.uppy.log({
      class: this.constructor.name,
      method: 'run',
      results: results
    })

    return Promise.resolve('success')
  }
}
