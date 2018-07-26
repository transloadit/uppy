const ProviderViews = require('@uppy/provider-views')

module.exports = class DriveProviderViews extends ProviderViews {
  constructor (plugin, opts) {
    super(plugin, opts)
    this.originalToggleCheckbox = this.toggleCheckbox
    this.toggleCheckbox = this.toggleDriveCheckbox.bind(this)
  }
  toggleDriveCheckbox (e, file) {
    e.stopPropagation()
    e.preventDefault()

    // Team Drives aren't selectable; for all else, defer to the base ProviderView.
    if (file.kind !== 'drive#teamDrive') {
      this.originalToggleCheckbox(e, file)
    }
  }
}
