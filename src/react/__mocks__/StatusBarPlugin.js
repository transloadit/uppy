const Plugin = require('../../core/Plugin')

module.exports = class StatusBar extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)

    this.id = opts.id
    this.type = 'progressindicator'
  }

  install () {
    this.opts.onInstall()
  }

  uninstall () {
    this.opts.onUninstall()
  }
}
