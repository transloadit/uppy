const { UIPlugin } = require('@uppy/core')

module.exports = class StatusBar extends UIPlugin {
  constructor (uppy, opts) {
    super(uppy, opts)

    this.id = this.opts.id
    this.type = 'progressindicator'
  }

  install () {
    this.opts.onInstall()
  }

  uninstall () {
    this.opts.onUninstall()
  }
}
