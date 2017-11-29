import Plugin from '../../src/core/Plugin.js'

export default class InvalidPluginWithoutName extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.name = this.constructor.name
  }

  run (results) {
    this.core.log({
      class: this.constructor.name,
      method: 'run',
      results: results
    })

    return Promise.resolve('success')
  }
}
