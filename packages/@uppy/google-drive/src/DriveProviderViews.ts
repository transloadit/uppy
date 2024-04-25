import type { PartialTreeFile, PartialTreeFolderNode } from '@uppy/core/lib/Uppy'
import { ProviderViews } from '@uppy/provider-views'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'

export default class DriveProviderViews<
  M extends Meta,
  B extends Body,
> extends ProviderViews<M, B> {
  toggleCheckbox = (e: Event, file: PartialTreeFile | PartialTreeFolderNode, isShiftKeyPressed: boolean): void => {
    e.stopPropagation()
    e.preventDefault()

    // Shared Drives aren't selectable; for all else, defer to the base ProviderView.
    if (!file.data.custom!.isSharedDrive) {
      super.toggleCheckbox(e, file, isShiftKeyPressed)
    }
  }
}
