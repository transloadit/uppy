import Plugin from '../../src/plugins/Plugin.js'

export default class TestSelector1 extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'TestSelector1'
    this.name = this.constructor.name

    this.mocks = {
      run: jest.fn(),
      update: jest.fn(),
      uninstall: jest.fn()
    }
  }

  run (results) {
    this.core.log({
      class: this.constructor.name,
      method: 'run',
      results: results
    })
    this.mocks.run(results)
    return Promise.resolve('success')
  }

  update (state) {
    this.mocks.update(state)
  }

  uninstall () {
    this.mocks.uninstall()
  }
}
