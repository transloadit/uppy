var Plugin = require('../../src/plugins/Plugin.js')

export default class TestSelector extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'selecter'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  getFiles () {
    return new Promise((resolve, reject) => {
      const files = [1, 2, 3]
      resolve(files)
      // setTimeout(function () {
      //   const files = [1, 2, 3]
      //   resolve(files)
      // }, 3000)
    })
  }

  run (results) {
    console.log({
      class: this.constructor.name,
      method: 'run',
      results: results
    })

    return this.getFiles()
  }
}
