const ProviderViews = require('@uppy/provider-views')

module.exports = class DriveProviderViews extends ProviderViews {
  toggleCheckbox (e, file) {
    e.stopPropagation()
    e.preventDefault()

    // Team Drives aren't selectable; for all else, defer to the base ProviderView.
    if (!file.custom.isTeamDrive) {
      super.toggleCheckbox(e, file)
    }
  }
}
