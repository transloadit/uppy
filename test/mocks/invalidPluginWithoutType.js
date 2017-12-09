import Plugin from '../../src/core/Plugin'

export default class InvalidPluginWithoutType extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = 'InvalidPluginWithoutType'
    this.name = this.constructor.name
  }

  run (results) {
    this.uppy.log({
      class: this.constructor.name,
      method: 'run',
      results: results
    })

    return Promise.resolve('success')
  }
}
