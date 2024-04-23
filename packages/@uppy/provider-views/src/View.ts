import type {
  PartialTreeFile,
  UnknownProviderPlugin,
  UnknownSearchProviderPlugin,
} from '@uppy/core/lib/Uppy'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'
import type { RestrictionError } from '@uppy/core/lib/Restricter'

type PluginType = 'Provider' | 'SearchProvider'

// Conditional type for selecting the plugin
type SelectedPlugin<M extends Meta, B extends Body, T extends PluginType> =
  T extends 'Provider' ? UnknownProviderPlugin<M, B>
  : T extends 'SearchProvider' ? UnknownSearchProviderPlugin<M, B>
  : never

// Conditional type for selecting the provider from the selected plugin
type SelectedProvider<
  M extends Meta,
  B extends Body,
  T extends PluginType,
> = SelectedPlugin<M, B, T>['provider']

export interface ViewOptions<
  M extends Meta,
  B extends Body,
  T extends PluginType,
> {
  provider: SelectedProvider<M, B, T>
  viewType?: string
  showTitles?: boolean
  showFilter?: boolean
  showBreadcrumbs?: boolean
  loadAllFiles?: boolean
}

export default class View<
  M extends Meta,
  B extends Body,
  T extends PluginType,
  O extends ViewOptions<M, B, T>,
> {
  plugin: SelectedPlugin<M, B, T>

  provider: SelectedProvider<M, B, T>

  isHandlingScroll: boolean

  lastCheckbox: string | null

  protected opts: O

  constructor(plugin: SelectedPlugin<M, B, T>, opts: O) {
    this.plugin = plugin
    this.provider = opts.provider
    this.opts = opts

    this.isHandlingScroll = false
    this.lastCheckbox = null

    this.validateRestrictions = this.validateRestrictions.bind(this)
  }

  validateRestrictions (file: CompanionFile) : RestrictionError<M, B> | null {
    if (file.isFolder) return null

    const localData = remoteFileObjToLocal(file)

    const { partialTree } = this.plugin.getPluginState()
    const aleadyAddedFiles = this.plugin.uppy.getFiles()
    const checkedFiles = partialTree.filter((item) => item.type === 'file' && item.status === 'checked') as PartialTreeFile[]
    const checkedFilesData = checkedFiles.map((item) => item.data)

    return this.plugin.uppy.validateRestrictions(localData, [...aleadyAddedFiles, ...checkedFilesData])
  }

  registerRequestClient(): void {
    this.plugin.uppy.registerRequestClient(this.provider.provider, this.provider)
  }

  setLoading(loading: boolean | string): void {
    this.plugin.setPluginState({ loading })
  }
}
