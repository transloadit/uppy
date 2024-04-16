import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolderNode,
  UnknownProviderPlugin,
  UnknownSearchProviderPlugin,
} from '@uppy/core/lib/Uppy'
import type { Body, Meta, TagFile } from '@uppy/utils/lib/UppyFile'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import getFileType from '@uppy/utils/lib/getFileType'
import isPreviewSupported from '@uppy/utils/lib/isPreviewSupported'
import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'
import type { RestrictionError } from '@uppy/core/lib/Restricter'
import PartialTreeUtils from './utils/PartialTreeUtils'

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

  requestClientId: string

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
    this.getNOfSelectedFiles = this.getNOfSelectedFiles.bind(this)
  }

  getNOfSelectedFiles () : number {
    const { partialTree } = this.plugin.getPluginState()
    // We're interested in all 'checked' leaves.
    const checkedLeaves = partialTree.filter((item) => {
      if (item.type === 'file' && item.status === 'checked') {
        return true
      } else if (item.type === 'folder' && item.status === 'checked') {
        const doesItHaveChildren = partialTree.some((i) =>
          i.type !== 'root' && i.parentId === item.id
        )
        return !doesItHaveChildren
      }
      return false
    })
    return checkedLeaves.length
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
    this.requestClientId = this.provider.provider
    this.plugin.uppy.registerRequestClient(this.requestClientId, this.provider)
  }

  // TODO: document what is a "tagFile" or get rid of this concept
  getTagFile(file: CompanionFile): TagFile<M> {
    const tagFile: TagFile<M> = {
      id: file.id,
      source: this.plugin.id,
      name: file.name || file.id,
      type: file.mimeType,
      isRemote: true,
      data: file,
      // @ts-expect-error meta is filled conditionally below
      meta: {},
      body: {
        fileId: file.id,
      },
      remote: {
        companionUrl: this.plugin.opts.companionUrl,
        // @ts-expect-error untyped for now
        url: `${this.provider.fileUrl(file.requestPath)}`,
        body: {
          fileId: file.id,
        },
        providerName: this.provider.name,
        provider: this.provider.provider,
        requestClientId: this.requestClientId,
      },
    }

    const fileType = getFileType(tagFile)

    // TODO Should we just always use the thumbnail URL if it exists?
    if (fileType && isPreviewSupported(fileType)) {
      tagFile.preview = file.thumbnail
    }

    if (file.author) {
      if (file.author.name != null)
        tagFile.meta!.authorName = String(file.author.name)
      if (file.author.url) tagFile.meta!.authorUrl = file.author.url
    }

    // add relativePath similar to non-remote files: https://github.com/transloadit/uppy/pull/4486#issuecomment-1579203717
    if (file.relDirPath != null)
      tagFile.meta!.relativePath =
        file.relDirPath ? `${file.relDirPath}/${tagFile.name}` : null
    // and absolutePath (with leading slash) https://github.com/transloadit/uppy/pull/4537#issuecomment-1614236655
    if (file.absDirPath != null)
      tagFile.meta!.absolutePath =
        file.absDirPath ?
          `/${file.absDirPath}/${tagFile.name}`
        : `/${tagFile.name}`

    return tagFile
  }

  filterItems = (items: PartialTree): PartialTree => {
    const { filterInput } = this.plugin.getPluginState()
    if (!filterInput || filterInput === '') {
      return items
    }
    return items.filter((item) => {
      return (
        item.type !== 'root' &&
        item.data.name.toLowerCase().indexOf(filterInput.toLowerCase()) !==
        -1
      )
    })
  }

  recordShiftKeyPress = (e: KeyboardEvent | MouseEvent): void => {
    this.isShiftKeyPressed = e.shiftKey
  }

  /**
   * Toggles file/folder checkbox to on/off state while updating files list.
   *
   * Note that some extra complexity comes from supporting shift+click to
   * toggle multiple checkboxes at once, which is done by getting all files
   * in between last checked file and current one.
   */
  toggleCheckbox(e: Event, ourItem: PartialTreeFolderNode | PartialTreeFile) {
    e.stopPropagation()
    e.preventDefault()
    // Prevent shift-clicking from highlighting file names (https://stackoverflow.com/a/1527797/3192470)
    document.getSelection()?.removeAllRanges()

    const { partialTree, currentFolderId } = this.plugin.getPluginState()

    const newPartialTree = PartialTreeUtils.afterToggleCheckbox(partialTree, ourItem, this.validateRestrictions, this.filterItems, currentFolderId, this.isShiftKeyPressed, this.lastCheckbox)

    this.plugin.setPluginState({ partialTree: newPartialTree })
    this.lastCheckbox = ourItem.id!
  }

  setLoading(loading: boolean | string): void {
    this.plugin.setPluginState({ loading })
  }
}
