import type {
  UnknownProviderPlugin,
  UnknownSearchProviderPlugin,
} from '@uppy/core/lib/Uppy'
import type { Body, Meta, TagFile } from '@uppy/utils/lib/UppyFile'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import getFileType from '@uppy/utils/lib/getFileType'
import isPreviewSupported from '@uppy/utils/lib/isPreviewSupported'
import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'

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

  lastCheckbox: CompanionFile | undefined

  protected opts: O

  constructor(plugin: SelectedPlugin<M, B, T>, opts: O) {
    this.plugin = plugin
    this.provider = opts.provider
    this.opts = opts

    this.isHandlingScroll = false

    this.preFirstRender = this.preFirstRender.bind(this)
    this.handleError = this.handleError.bind(this)
    this.clearSelection = this.clearSelection.bind(this)
    this.cancelPicking = this.cancelPicking.bind(this)
  }

  preFirstRender(): void {
    this.plugin.setPluginState({ didFirstRender: true })
    this.plugin.onFirstRender()
  }

  shouldHandleScroll(event: Event): boolean {
    const { scrollHeight, scrollTop, offsetHeight } =
      event.target as HTMLElement
    const scrollPosition = scrollHeight - (scrollTop + offsetHeight)

    return scrollPosition < 50 && !this.isHandlingScroll
  }

  clearSelection(): void {
    this.plugin.setPluginState({ currentSelection: [], filterInput: '' })
  }

  cancelPicking(): void {
    this.clearSelection()

    const dashboard = this.plugin.uppy.getPlugin('Dashboard')

    if (dashboard) {
      // @ts-expect-error impossible to type this correctly without adding dashboard
      // as a dependency to this package.
      dashboard.hideAllPanels()
    }
  }

  handleError(error: Error): void {
    const { uppy } = this.plugin
    const message = uppy.i18n('companionError')

    uppy.log(error.toString())

    if (
      (error as any).isAuthError ||
      (error.cause as Error)?.name === 'AbortError'
    ) {
      // authError just means we're not authenticated, don't show to user
      // AbortError means the user has clicked "cancel" on an operation
      return
    }

    uppy.info({ message, details: error.toString() }, 'error', 5000)
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

  filterItems = (items: CompanionFile[]): CompanionFile[] => {
    const state = this.plugin.getPluginState()
    if (!state.filterInput || state.filterInput === '') {
      return items
    }
    return items.filter((folder) => {
      return (
        folder.name.toLowerCase().indexOf(state.filterInput.toLowerCase()) !==
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
  toggleCheckbox = (e, fileOrFolder) => {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.focus()

    const { partialTree } = this.plugin.getPluginState()
    const newPartialTree = JSON.parse(JSON.stringify(partialTree))

    const ourItem = newPartialTree.find((item) => item.requestPath === fileOrFolder.requestPath)
    const newStatus = ourItem.status === "checked" ? "unchecked" : "checked"
    ourItem.status = newStatus

    // if newStatus is "checked" - percolate down "checked"
    // if newStatus is "unchecked" - percolate down "unchecked"
    const percolateDown = (currentFile, status) => {
      const children = newPartialTree.filter((item) => item.parentId === currentFile.requestPath)
      children.forEach((item) => {
        item.status = status
        percolateDown(item, status)
      })
    }

    percolateDown(ourItem, newStatus)

    // we do something to all of its parents.
    const percolateUp = (currentFile) => {
      const parentFolder = newPartialTree.find((item) => item.requestPath === currentFile.parentId)

      if (!parentFolder) return

      const parentsChildren = newPartialTree.filter((item) => item.parentId === parentFolder.requestPath)
      const areAllChildrenChecked = parentsChildren.every((item) => item.status === "checked")
      const areAllChildrenUnchecked = parentsChildren.every((item) => item.status === "unchecked")
  
      if (areAllChildrenChecked) {
        parentFolder.status = "checked"
      } else if (areAllChildrenUnchecked) {
        parentFolder.status = "unchecked"
      } else {
        parentFolder.status = "partial"
      }

      percolateUp(parentFolder)
    }

    percolateUp(ourItem)

    this.plugin.setPluginState({ partialTree: newPartialTree })
  }

  isChecked = (file) => {
    // Ohhh so it's actually called here......

    const { partialTree } = this.plugin.getPluginState()
    const ourFile = partialTree.find((item) => item.requestPath === file.requestPath)
    // console.log({ourFile});

    return ourFile.status
   
    // const { currentSelection } = this.plugin.getPluginState()
    // // comparing id instead of the file object, because the reference to the object
    // // changes when we switch folders, and the file list is updated
    // return currentSelection.some((item) => item.id === file.id)
  }

  setLoading(loading: boolean | string): void {
    this.plugin.setPluginState({ loading })
  }
}
