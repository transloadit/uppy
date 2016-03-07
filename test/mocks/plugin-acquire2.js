const Plugin = require('../../src/plugins/Plugin.js')

export default class TestSelector2 extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquire'
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
