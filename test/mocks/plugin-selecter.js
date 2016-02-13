var Plugin = require('../../src/plugins/Plugin.js')

export default class TestSelector extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'selecter'
  }

  run (results) {
    console.log({
      class: this.constructor.name,
      method: 'run',
      results: results
    })

    return Promise.resolve('success')
  }
}
