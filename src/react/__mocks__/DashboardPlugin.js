const Plugin = require('../../core/Plugin')

module.exports = class Dashboard extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)

    this.id = opts.id
    this.type = 'orchestrator'
  }

  install () {
    if (this.opts.onInstall) this.opts.onInstall()
  }

  uninstall () {
    if (this.opts.onUninstall) this.opts.onUninstall()
  }
}
