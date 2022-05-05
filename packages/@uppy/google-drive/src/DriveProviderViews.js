import { ProviderViews } from '@uppy/provider-views'

export default class DriveProviderViews extends ProviderViews {
  toggleCheckbox (e, file) {
    e.stopPropagation()
    e.preventDefault()

    // Shared Drives aren't selectable; for all else, defer to the base ProviderView.
    if (!file.custom.isSharedDrive) {
      super.toggleCheckbox(e, file)
    }
  }
}
