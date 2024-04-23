import type { UIPlugin } from '@uppy/core'
import type { Provider } from '@uppy/companion-client'

interface ProviderViewOptions {
  provider: Provider
  viewType?: 'list' | 'grid'
  showTitles?: boolean
  showFilter?: boolean
  showBreadcrumbs?: boolean
}

declare class ProviderView {
  constructor(plugin: UIPlugin, opts: ProviderViewOptions)
  // @todo add other provider view methods
}

export default ProviderView
