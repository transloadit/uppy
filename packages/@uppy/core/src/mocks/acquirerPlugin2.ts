import { vi } from 'vitest'
import UIPlugin from '../UIPlugin.js'
import type Uppy from '../Uppy.js'

type mock = ReturnType<typeof vi.fn>

export default class TestSelector2 extends UIPlugin<any, any, any> {
  name: string

  mocks: { run: mock; update: mock; uninstall: mock }

  constructor(uppy: Uppy<any, any>, opts?: any) {
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

  run(results: any) {
    this.uppy.log({
      class: this.constructor.name,
      method: 'run',
      results,
    })
    this.mocks.run(results)
    return Promise.resolve('success')
  }

  update(state: any) {
    this.mocks.update(state)
  }

  uninstall() {
    this.mocks.uninstall()
  }
}
