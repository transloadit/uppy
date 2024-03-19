import { ProviderViews } from '@uppy/provider-views'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'

export default class GooglePhotosProviderViews<
  M extends Meta,
  B extends Body,
> extends ProviderViews<M, B> {}
