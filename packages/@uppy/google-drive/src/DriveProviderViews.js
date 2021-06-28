const { ProviderViews } = require('@uppy/provider-views')

module.exports = class DriveProviderViews extends ProviderViews {
  toggleCheckbox (e, file) {
    e.stopPropagation()
    e.preventDefault()

    if (!file.custom.isSharedDrive) {
      super.toggleCheckbox(e, file)
    }
  }
}
