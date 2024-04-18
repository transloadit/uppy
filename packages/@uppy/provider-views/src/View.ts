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

  isShiftKeyPressed: boolean

  lastCheckbox: string | undefined

  protected opts: O

  constructor(plugin: SelectedPlugin<M, B, T>, opts: O) {
    this.plugin = plugin
    this.provider = opts.provider
    this.opts = opts

    this.isHandlingScroll = false

    this.handleError = this.handleError.bind(this)
    this.cancelPicking = this.cancelPicking.bind(this)
    this.validateRestrictions = this.validateRestrictions.bind(this)

    // This records whether the user is holding the SHIFT key this very moment.
    // Typically this is implemented using `onClick((e) => e.shiftKey)` - but we can't use that, because for accessibility reasons we're using html tags that don't support `e.shiftKey` property (see #3768).
    document.addEventListener('keyup', (e) => {
      if (e.key == 'Shift') {
        this.isShiftKeyPressed = false
      }
    })
    document.addEventListener('keydown', (e) => {
      if (e.key == 'Shift') {
        this.isShiftKeyPressed = true
      }
    })
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

  shouldHandleScroll(event: Event): boolean {
    const { scrollHeight, scrollTop, offsetHeight } =
      event.target as HTMLElement
    const scrollPosition = scrollHeight - (scrollTop + offsetHeight)

    return scrollPosition < 50 && !this.isHandlingScroll
  }

  cancelPicking(): void {
    const dashboard = this.plugin.uppy.getPlugin('Dashboard')

    if (dashboard) {
      // @ts-expect-error impossible to type this correctly without adding dashboard
      // as a dependency to this package.
      dashboard.hideAllPanels()
    }
  }

  handleError(error: Error): void {
    const { uppy } = this.plugin
    // authError just means we're not authenticated, don't report it
    if ((error as any).isAuthError) {
      return
    }
    // AbortError means the user has clicked "cancel" on an operation
    if (error.name === 'AbortError') {
      uppy.log('Aborting request', 'warning')
      return
    }
    uppy.log(error, 'error')

    if (error.name === 'UserFacingApiError') {
      uppy.info({
        message: uppy.i18n('companionError'),
        details: uppy.i18n(error.message)
      }, 'warning', 5000)
    }
  }

  registerRequestClient(): void {
    this.plugin.uppy.registerRequestClient(this.provider.provider, this.provider)
  }

  setLoading(loading: boolean | string): void {
    this.plugin.setPluginState({ loading })
  }
}
