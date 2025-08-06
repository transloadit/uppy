import type {
  Body,
  Meta,
  PartialTreeFile,
  PartialTreeFolderNode,
} from '@uppy/core'
import { ProviderViews } from '@uppy/provider-views'

export default class DriveProviderViews<
  M extends Meta,
  B extends Body,
> extends ProviderViews<M, B> {
  toggleCheckbox(
    item: PartialTreeFolderNode | PartialTreeFile,
    isShiftKeyPressed: boolean,
  ): void {
    // We don't allow to check team drives; but we leave the checkboxes visible to show the 'partial' state
    // (For a full explanation, see https://github.com/transloadit/uppy/issues/5232)
    if (!item.data.custom?.isSharedDrive) {
      super.toggleCheckbox(item, isShiftKeyPressed)
    }
  }
}
