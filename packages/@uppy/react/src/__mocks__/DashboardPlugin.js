const { UIPlugin } = require('@uppy/core')

module.exports = class Dashboard extends UIPlugin {
  constructor (uppy, opts) {
    super(uppy, opts)

    this.id = this.opts.id
    this.type = 'orchestrator'
  }

  install () {
    if (this.opts.onInstall) this.opts.onInstall()
  }

  uninstall () {
    if (this.opts.onUninstall) this.opts.onUninstall()
  }
}
