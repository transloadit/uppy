import { ProviderViews } from '@uppy/provider-views'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'

export default class DriveProviderViews<
  M extends Meta,
  B extends Body,
> extends ProviderViews<M, B> {
  toggleCheckbox(e: Event, file: CompanionFile): void {
    e.stopPropagation()
    e.preventDefault()

    // Shared Drives aren't selectable; for all else, defer to the base ProviderView.
    if (!file.custom!.isSharedDrive) {
      super.toggleCheckbox(e, file)
    }
  }
}
