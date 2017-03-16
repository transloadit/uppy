const DashboardPlugin = require('../../plugins/Dashboard')

/**
 * A version of the Dashboard plugin that externalises the modal open state
 * management, allowing the React component wrapper to open and close it at
 * will.
 */
class ReactDashboardPlugin extends DashboardPlugin {
  constructor (core, opts) {
    super(core, opts)

    this.id = 'ReactDashboard'
  }

  showModalInternal () {
    super.showModal()
  }
  hideModalInternal () {
    super.hideModal()
  }

  hideModal () {
    if (this.opts.onRequestClose) {
      this.opts.onRequestClose()
    } else {
      this.hideModalInternal()
    }
  }
}

module.exports = ReactDashboardPlugin
