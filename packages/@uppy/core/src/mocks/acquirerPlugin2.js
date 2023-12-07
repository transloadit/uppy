import { vi } from 'vitest' // eslint-disable-line import/no-extraneous-dependencies
import UIPlugin from '../UIPlugin.js'

export default class TestSelector2 extends UIPlugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = 'TestSelector2'
    this.name = this.constructor.name

    this.mocks = {
      run: vi.fn(),
      update: vi.fn(),
      uninstall: vi.fn(),
    }
  }

  run (results) {
    this.uppy.log({
      class: this.constructor.name,
      method: 'run',
      results,
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
