import UIPlugin from '../UIPlugin.js'
import type Uppy from '../Uppy.js'

export default class InvalidPluginWithoutName extends UIPlugin<any, any, any> {
  public type: string

  public name: string

  constructor(uppy: Uppy<any, any>, opts?: any) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.name = this.constructor.name
  }

  run(results: any) {
    this.uppy.log({
      class: this.constructor.name,
      method: 'run',
      results,
    })

    return Promise.resolve('success')
  }
}
