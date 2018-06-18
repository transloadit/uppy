const Plugin = require('@uppy/core/lib/Plugin')

module.exports = class ProgressBar extends Plugin {
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
