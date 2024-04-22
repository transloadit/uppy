import { h } from 'preact'

import { getSafeFileId } from '@uppy/utils/lib/generateFileID'

import type {
  UnknownProviderPlugin,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeFile,
  UnknownProviderPluginState,
} from '@uppy/core/lib/Uppy.ts'
import type { Body, Meta, TagFile } from '@uppy/utils/lib/UppyFile'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile.ts'
import type Translator from '@uppy/utils/lib/Translator'
import type { DefinePluginOpts } from '@uppy/core/lib/BasePlugin.ts'
import AuthView from './AuthView.tsx'
import Header from './Header.tsx'
import Browser from '../Browser.tsx'
import View, { type ViewOptions } from '../View.ts'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../../package.json'
import PartialTreeUtils from '../utils/PartialTreeUtils'
import getTagFile from '../utils/getTagFile.ts'
import getNOfSelectedFiles from '../utils/getNOfSelectedFiles.ts'
import shouldHandleScroll from '../utils/shouldHandleScroll.ts'

export function defaultPickerIcon(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="30"
      height="30"
      viewBox="0 0 30 30"
    >
      <path d="M15 30c8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15zm4.258-12.676v6.846h-8.426v-6.846H5.204l9.82-12.364 9.82 12.364H19.26z" />
    </svg>
  )
}

type PluginType = 'Provider'

const defaultOptions = {
  viewType: 'list',
  showTitles: true,
  showFilter: true,
  showBreadcrumbs: true,
  loadAllFiles: false,
}

export interface ProviderViewOptions<M extends Meta, B extends Body>
  extends ViewOptions<M, B, PluginType> {
  renderAuthForm?: (args: {
    pluginName: string
    i18n: Translator['translateArray']
    loading: boolean | string
    onAuth: (authFormData: unknown) => Promise<void>
  }) => JSX.Element
}

type Opts<M extends Meta, B extends Body> = DefinePluginOpts<
  ProviderViewOptions<M, B>,
  keyof typeof defaultOptions
>

const getDefaultState = (rootFolderId: string | null) : Partial<UnknownProviderPluginState> => ({
  authenticated: undefined, // we don't know yet
  partialTree: [
    {
      type: 'root',
      id: rootFolderId,
      cached: false,
      nextPagePath: null
    }
  ],
  currentFolderId: null,
  searchString: '',
  didFirstRender: false
})

/**
 * Class to easily generate generic views for Provider plugins
 */
export default class ProviderView<M extends Meta, B extends Body> extends View<
  M,
  B,
  PluginType,
  Opts<M, B>
> {
  static VERSION = packageJson.version

  username: string | undefined

  constructor(
    plugin: UnknownProviderPlugin<M, B>,
    opts: ProviderViewOptions<M, B>,
  ) {
    super(plugin, { ...defaultOptions, ...opts })

    this.getFolder = this.getFolder.bind(this)
    this.logout = this.logout.bind(this)
    this.handleAuth = this.handleAuth.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.donePicking = this.donePicking.bind(this)
    this.render = this.render.bind(this)
    this.cancelPicking = this.cancelPicking.bind(this)

    // Set default state for the plugin
    this.resetPluginState()

    // @ts-expect-error this should be typed in @uppy/dashboard.
    this.plugin.uppy.on('dashboard:close-panel', this.resetPluginState)

    this.registerRequestClient()
  }

  resetPluginState(): void {
    this.plugin.setPluginState(getDefaultState(this.plugin.rootFolderId))
  }

  tearDown(): void {
    // Nothing.
  }

  cancelPicking(): void {
    const dashboard = this.plugin.uppy.getPlugin('Dashboard')
    if (dashboard) {
      // @ts-expect-error impossible to type this correctly without adding dashboard
      // as a dependency to this package.
      dashboard.hideAllPanels()
    }
  }

  #abortController: AbortController | undefined

  async #withAbort(op: (signal: AbortSignal) => Promise<void>) {
    // prevent multiple requests in parallel from causing race conditions
    this.#abortController?.abort()
    const abortController = new AbortController()
    this.#abortController = abortController
    const cancelRequest = () => {
      abortController.abort()
    }
    try {
      // @ts-expect-error this should be typed in @uppy/dashboard.
      // Even then I don't think we can make this work without adding dashboard
      // as a dependency to provider-views.
      this.plugin.uppy.on('dashboard:close-panel', cancelRequest)
      this.plugin.uppy.on('cancel-all', cancelRequest)

      await op(abortController.signal)
    } finally {
      // @ts-expect-error this should be typed in @uppy/dashboard.
      // Even then I don't think we can make this work without adding dashboard
      // as a dependency to provider-views.
      this.plugin.uppy.off('dashboard:close-panel', cancelRequest)
      this.plugin.uppy.off('cancel-all', cancelRequest)
      this.#abortController = undefined
    }
  }

  /**
   * Select a folder based on its id: fetches the folder and then updates state with its contents
   * TODO rename to something better like selectFolder or navigateToFolder (breaking change?)
   *
   */
  async getFolder(folderId: string | null): Promise<void> {
    this.lastCheckbox = null
    console.log(`____________________________________________GETTING FOLDER "${folderId}"`);
    // Returning cached folder
    const { partialTree } = this.plugin.getPluginState()
    const clickedFolder = partialTree.find((folder) => folder.id === folderId)! as PartialTreeFolder
    if (clickedFolder.cached) {
      console.log("Folder was cached____________________________________________");
      this.plugin.setPluginState({ currentFolderId: folderId, searchString: '' })
      return
    }

    this.setLoading(true)
    await this.#withAbort(async (signal) => {
      let currentPagePath = folderId
      let currentItems: CompanionFile[] = []
      do {
        const { username, nextPagePath, items } = await this.provider.list(currentPagePath, { signal })
        // It's important to set the username during one of our first fetches
        this.username = username

        currentPagePath = nextPagePath
        currentItems = currentItems.concat(items)
        this.setLoading(this.plugin.uppy.i18n('loadedXFiles', { numFiles: items.length }))
      } while (this.opts.loadAllFiles && currentPagePath)

      const newPartialTree = PartialTreeUtils.afterClickOnFolder(partialTree, currentItems, clickedFolder, this.validateRestrictions, currentPagePath)

      this.plugin.setPluginState({
        partialTree: newPartialTree,
        currentFolderId: folderId,
        searchString: ''
      })
    }).catch(this.handleError)

    this.setLoading(false)
  }

  /**
   * Removes session token on client side.
   */
  async logout(): Promise<void> {
    await this.#withAbort(async (signal) => {
      const res = await this.provider.logout<{
        ok: boolean
        revoked: boolean
        manual_revoke_url: string
      }>({
        signal,
      })
      // res.ok is from the JSON body, not to be confused with Response.ok
      if (res.ok) {
        if (!res.revoked) {
          const message = this.plugin.uppy.i18n('companionUnauthorizeHint', {
            provider: this.plugin.title,
            url: res.manual_revoke_url,
          })
          this.plugin.uppy.info(message, 'info', 7000)
        }

        this.plugin.setPluginState({
          ...getDefaultState(this.plugin.rootFolderId),
          authenticated: false
        })
      }
    }).catch(this.handleError)
  }

  async handleAuth(authFormData?: unknown): Promise<void> {
    await this.#withAbort(async (signal) => {
      this.setLoading(true)
      await this.provider.login({ authFormData, signal })
      this.plugin.setPluginState({ authenticated: true })
      await Promise.all([
        this.provider.fetchPreAuthToken(),
        this.getFolder(this.plugin.rootFolderId),
      ])
    }).catch(this.handleError)
    this.setLoading(false)
  }

  async handleScroll(event: Event): Promise<void> {
    const { partialTree, currentFolderId } = this.plugin.getPluginState()
    const currentFolder = partialTree.find((i) => i.id === currentFolderId) as PartialTreeFolder
    if (shouldHandleScroll(event) && !this.isHandlingScroll && currentFolder.nextPagePath) {
      this.isHandlingScroll = true
      await this.#withAbort(async (signal) => {
        const { nextPagePath, items } = await this.provider.list(currentFolder.nextPagePath!, { signal })
        const newPartialTree = PartialTreeUtils.afterScroll(partialTree, currentFolderId, items, nextPagePath, this.validateRestrictions)

        this.plugin.setPluginState({ partialTree: newPartialTree })
      }).catch(this.handleError)
      this.isHandlingScroll = false
    }
  }

  async donePicking(): Promise<void> {
    const { partialTree } = this.plugin.getPluginState()
    this.setLoading(true)

    await this.#withAbort(async (signal) => {
      const uppyFiles: CompanionFile[] = await PartialTreeUtils.fill(partialTree, this.provider, signal)

      const filesToAdd : TagFile<M>[] = []
      const filesAlreadyAdded : TagFile<M>[] = []
      const filesNotPassingRestrictions : TagFile<M>[] = []
  
      uppyFiles.forEach((uppyFile) => {
        const tagFile = getTagFile<M>(uppyFile, this.plugin.id, this.provider, this.plugin.opts.companionUrl)

        if (this.validateRestrictions(uppyFile)) {
          filesNotPassingRestrictions.push(tagFile)
          return
        }
  
        const id = getSafeFileId(tagFile)
        if (this.plugin.uppy.checkIfFileAlreadyExists(id)) {
          filesAlreadyAdded.push(tagFile)
          return
        }
        filesToAdd.push(tagFile)
      })

      if (filesToAdd.length > 0) {
        this.plugin.uppy.info(`${filesToAdd.length} files added`)
      }
      if (filesAlreadyAdded.length > 0) {
        this.plugin.uppy.info(`Not adding ${filesAlreadyAdded.length} files because they already exist`)
      }
      if (filesNotPassingRestrictions.length > 0) {
        this.plugin.uppy.info(`Not adding ${filesNotPassingRestrictions.length} files they didn't pass restrictions`)
      }
      this.plugin.uppy.addFiles(filesToAdd)
    }).catch(this.handleError)

    this.setLoading(false)
  }

  getBreadcrumbs = () : PartialTreeFolder[] => {
    const { partialTree, currentFolderId } = this.plugin.getPluginState()
    if (!currentFolderId) return []

    const breadcrumbs : PartialTreeFolder[] = []
    let parent = partialTree.find((folder) => folder.id === currentFolderId) as PartialTreeFolder
    while (true) {
      breadcrumbs.push(parent)
      if (parent.type === 'root') break

      parent = partialTree.find((folder) => folder.id === (parent as PartialTreeFolderNode).parentId) as PartialTreeFolder
    }

    return breadcrumbs.toReversed()
  }

  toggleCheckbox(e: Event, ourItem: PartialTreeFolderNode | PartialTreeFile) {
    e.stopPropagation()
    e.preventDefault()
    // Prevent shift-clicking from highlighting file names
    // (https://stackoverflow.com/a/1527797/3192470)
    document.getSelection()?.removeAllRanges()

    const { partialTree } = this.plugin.getPluginState()
    const newPartialTree = PartialTreeUtils.afterToggleCheckbox(partialTree, this.getDisplayedPartialTree(), ourItem, this.validateRestrictions, this.isShiftKeyPressed, this.lastCheckbox)

    this.plugin.setPluginState({ partialTree: newPartialTree })
    this.lastCheckbox = ourItem.id!
  }

  getDisplayedPartialTree = () : (PartialTreeFile | PartialTreeFolderNode)[] => {
    const { partialTree, currentFolderId, searchString } = this.plugin.getPluginState()
    const inThisFolder = partialTree.filter((item) => item.type !== 'root' && item.parentId === currentFolderId) as (PartialTreeFile | PartialTreeFolderNode)[]
    const filtered = searchString === ''
      ? inThisFolder
      : inThisFolder.filter((item) => item.data.name.toLowerCase().indexOf(searchString.toLowerCase()) !== -1)

    return filtered
  }

  render(
    state: unknown,
    viewOptions: Omit<ViewOptions<M, B, PluginType>, 'provider'> = {},
  ): JSX.Element {
    const { authenticated, didFirstRender } = this.plugin.getPluginState()
    const { i18n } = this.plugin.uppy

    if (!didFirstRender) {
      this.plugin.setPluginState({ didFirstRender: true })
      this.provider.fetchPreAuthToken()
      this.getFolder(this.plugin.rootFolderId)
    }

    const targetViewOptions = { ...this.opts, ...viewOptions }
    const { partialTree, currentFolderId, searchString, loading } =
      this.plugin.getPluginState()
    const pluginIcon = this.plugin.icon || defaultPickerIcon

    if (authenticated === false) {
      return (
        <AuthView
          pluginName={this.plugin.title}
          pluginIcon={pluginIcon}
          handleAuth={this.handleAuth}
          i18n={this.plugin.uppy.i18nArray}
          renderForm={this.opts.renderAuthForm}
          loading={loading}
        />
      )
    }

    return <Browser<M, B>
      toggleCheckbox={this.toggleCheckbox.bind(this)}
      displayedPartialTree={this.getDisplayedPartialTree()}
      nOfSelectedFiles={getNOfSelectedFiles(partialTree)}
      getFolder={this.getFolder}
      loadAllFiles={this.opts.loadAllFiles}

      // For SearchFilterInput component
      showSearchFilter={targetViewOptions.showFilter}
      searchInputLabel={i18n('filter')}
      clearSearchLabel={i18n('resetFilter')}
      searchString={searchString}
      setSearchString={(searchString: string) => {
        console.log('setting searchString!', searchString);
        this.plugin.setPluginState({ searchString })
      }}
      submitSearchString={() => {}}

      noResultsLabel={i18n('noFilesFound')}
      handleScroll={this.handleScroll}
      done={this.donePicking}
      cancel={this.cancelPicking}
      headerComponent={
        <Header<M, B>
          showBreadcrumbs={targetViewOptions.showBreadcrumbs}
          getFolder={this.getFolder}
          breadcrumbs={this.getBreadcrumbs()}
          pluginIcon={pluginIcon}
          title={this.plugin.title}
          logout={this.logout}
          username={this.username}
          i18n={i18n}
        />
      }
      viewType={targetViewOptions.viewType}
      showTitles={targetViewOptions.showTitles}
      showBreadcrumbs={targetViewOptions.showBreadcrumbs}
      i18n={this.plugin.uppy.i18n}

      validateRestrictions={this.validateRestrictions}
      isLoading={loading}
    />
  }
}
