import Plugin from '../../../src/plugins/Plugin.js'

export default class TestSelector2 extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'TestSelector2'
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
