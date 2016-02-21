const Plugin = require('../../src/plugins/Plugin.js')

export default class TestSelector extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'selecter2'
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
