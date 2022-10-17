import { jest } from '@jest/globals' // eslint-disable-line import/no-extraneous-dependencies
import UIPlugin from '../UIPlugin.js'

export default class TestSelector1 extends UIPlugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.id = 'TestSelector1'
    this.name = this.constructor.name

    this.mocks = {
      run: jest.fn(),
      update: jest.fn(),
      uninstall: jest.fn(),
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
