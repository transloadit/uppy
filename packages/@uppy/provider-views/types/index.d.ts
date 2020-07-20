import CompanionClient = require('@uppy/companion-client')
import Uppy = require('@uppy/core')

interface ProviderViewOptions {
    provider: CompanionClient.Provider
    viewType?: 'list' | 'grid'
    showTitles?: boolean
    showFilter?: boolean
    showBreadcrumbs?: boolean
}

interface OnFirstRenderer {
    onFirstRender: () => any
}


declare class ProviderView {
    constructor (plugin: Uppy.Plugin & OnFirstRenderer, opts: ProviderViewOptions)
    // @todo add other provider view methods
}

export = ProviderView
