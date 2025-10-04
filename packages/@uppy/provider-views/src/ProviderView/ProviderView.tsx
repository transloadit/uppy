import type {
  Body,
  Meta,
  PartialTree,
  PartialTreeFile,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeId,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  ValidateableFile,
} from '@uppy/core'
import type { CompanionFile, I18n } from '@uppy/utils'
import { remoteFileObjToLocal } from '@uppy/utils'
import classNames from 'classnames'
import type { h } from 'preact'
import packageJson from '../../package.json' with { type: 'json' }
import Browser from '../Browser.js'
import FooterActions from '../FooterActions.js'
import SearchInput from '../SearchInput.js'
import addFiles from '../utils/addFiles.js'
import getClickedRange from '../utils/getClickedRange.js'
import handleError from '../utils/handleError.js'
import getBreadcrumbs from '../utils/PartialTreeUtils/getBreadcrumbs.js'
import getCheckedFilesWithPaths from '../utils/PartialTreeUtils/getCheckedFilesWithPaths.js'
import getNumberOfSelectedFiles from '../utils/PartialTreeUtils/getNumberOfSelectedFiles.js'
import PartialTreeUtils from '../utils/PartialTreeUtils/index.js'
import shouldHandleScroll from '../utils/shouldHandleScroll.js'
import AuthView from './AuthView.js'
import GlobalSearchView from './GlobalSearchView.js'
import Header from './Header.js'

export function defaultPickerIcon(): h.JSX.Element {
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

const getDefaultState = (
  rootFolderId: string | null,
): UnknownProviderPluginState => ({
  authenticated: undefined, // we don't know yet
  partialTree: [
    {
      type: 'root',
      id: rootFolderId,
      cached: false,
      nextPagePath: null,
    },
  ],
  currentFolderId: rootFolderId,
  searchString: '',
  didFirstRender: false,
  username: null,
  loading: false,
})

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

export interface Opts<M extends Meta, B extends Body> {
  provider: UnknownProviderPlugin<M, B>['provider']
  viewType: 'list' | 'grid'
  showTitles: boolean
  showFilter: boolean
  showBreadcrumbs: boolean
  loadAllFiles: boolean
  renderAuthForm?: (args: {
    pluginName: string
    i18n: I18n
    loading: boolean | string
    onAuth: (authFormData: unknown) => Promise<void>
  }) => h.JSX.Element
  virtualList: boolean
}
type PassedOpts<M extends Meta, B extends Body> = Optional<
  Opts<M, B>,
  | 'viewType'
  | 'showTitles'
  | 'showFilter'
  | 'showBreadcrumbs'
  | 'loadAllFiles'
  | 'virtualList'
>
type DefaultOpts<M extends Meta, B extends Body> = Omit<Opts<M, B>, 'provider'>
type RenderOpts<M extends Meta, B extends Body> = Omit<
  PassedOpts<M, B>,
  'provider'
>

type SearchState = {
  isSearchAvailable: boolean
  isSearchActive: boolean
  searchResult: CompanionFile[]
  scopeId: string | null
}

/**
 * Class to easily generate generic views for Provider plugins
 */
export default class ProviderView<M extends Meta, B extends Body> {
  static VERSION = packageJson.version

  plugin: UnknownProviderPlugin<M, B>

  provider: UnknownProviderPlugin<M, B>['provider']

  opts: Opts<M, B>

  isHandlingScroll: boolean = false

  lastCheckbox: string | null = null

  #searchState: SearchState = {
    isSearchAvailable: false,
    isSearchActive: false,
    searchResult: [],
    scopeId: null,
  }

  constructor(plugin: UnknownProviderPlugin<M, B>, opts: PassedOpts<M, B>) {
    this.plugin = plugin
    this.provider = opts.provider

    const defaultOptions: DefaultOpts<M, B> = {
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true,
      loadAllFiles: false,
      virtualList: false,
    }
    this.opts = { ...defaultOptions, ...opts }

    this.openFolder = this.openFolder.bind(this)
    this.logout = this.logout.bind(this)
    this.handleAuth = this.handleAuth.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.resetPluginState = this.resetPluginState.bind(this)
    this.donePicking = this.donePicking.bind(this)
    this.render = this.render.bind(this)
    this.cancelSelection = this.cancelSelection.bind(this)
    this.toggleCheckbox = this.toggleCheckbox.bind(this)
    this.openSearchResultFolder = this.openSearchResultFolder.bind(this)

    // Set default state for the plugin
    this.resetPluginState()

    // todo
    // @ts-expect-error this should be typed in @uppy/dashboard.
    this.plugin.uppy.on('dashboard:close-panel', this.resetPluginState)

    this.plugin.uppy.registerRequestClient(
      this.provider.provider,
      this.provider,
    )
  }

  resetPluginState(): void {
    this.plugin.setPluginState(getDefaultState(this.plugin.rootFolderId))
  }

  tearDown(): void {
    // Nothing.
  }

  setLoading(loading: boolean | string): void {
    this.plugin.setPluginState({ loading })
  }

  cancelSelection(): void {
    const { partialTree } = this.plugin.getPluginState()
    const newPartialTree: PartialTree = partialTree.map((item) =>
      item.type === 'root' ? item : { ...item, status: 'unchecked' },
    )
    this.plugin.setPluginState({ partialTree: newPartialTree })
  }

  #searchDebounceId: number | undefined

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

  //! this would be checked at the very beginning and set the isSupportedSearch flag to true / false and if this is true only then perform search would be called
  #isSearchMode(): boolean {
    const supportsServerSearch =
      typeof (this.provider as any).search === 'function'

    console.log(
      'this.provider ----> {this.provider.search}',
      this.provider.search,
    )
    return supportsServerSearch
  }

  async #performSearch(): Promise<void> {
    const { partialTree, currentFolderId, searchString } =
      this.plugin.getPluginState()
    const currentFolder = partialTree.find(
      (i) => i.id === currentFolderId,
    ) as PartialTreeFolder

    if (!this.#isSearchMode()) return

    this.setLoading('Searching...')
    await this.#withAbort(async (signal) => {
      // Determine base scope path from current folder
      const baseContextId = currentFolder.id
      const baseContextNode = (partialTree.find(
        (i) => i.id === baseContextId,
      ) || currentFolder) as PartialTreeFolder
      const scopePath = baseContextNode.type === 'root' ? null : baseContextId
      const { items } = await (this.provider as any).search(searchString, {
        signal,
        path: scopePath ?? undefined,
      })

      console.log(
        'logging items companionFile[] returned from performSearch ---> ',
        items,
      )
      // Overlay: store results and cursor; don't mutate tree
      this.#searchState.isSearchActive = true
      this.#searchState.searchResult = items
      this.#searchState.scopeId = scopePath

      console.log('search state after perform search --> ', this.#searchState)
    }).catch(handleError(this.plugin.uppy))
    this.setLoading(false)
  }

  onSearchInput = (s: string): void => {
    this.plugin.setPluginState({ searchString: s })

    if (this.#searchDebounceId) {
      window.clearTimeout(this.#searchDebounceId)
      this.#searchDebounceId = undefined
    }

    const trimmed = s.trim()

    if (trimmed === '') {
      this.#searchState.isSearchActive = false
      this.#searchState.searchResult = []
      this.#searchState.scopeId = null
      return
    }

    // Debounce server-side search
    this.#searchDebounceId = window.setTimeout(() => {
      // Only run if still in search mode with latest value
      if (this.#isSearchMode()) {
        this.#performSearch()
      }
      this.#searchDebounceId = undefined
    }, 500)
  }

  #createSyntheticFolderCompanionFile(
    name: string,
    requestPath: string,
  ): CompanionFile {
    return {
      id: `synthetic:${requestPath}`,
      name: decodeURIComponent(name),
      icon: 'folder',
      type: 'folder',
      mimeType: '',
      extension: '',
      size: 0,
      isFolder: true,
      modifiedDate: '',
      thumbnail: '',
      requestPath,
    }
  }

  /**
   * Ensure that each ancestor segment of the encoded requestPath exists
   * as a folder node in the partialTree, from root to target folder.
   * If an ancestor is missing, we create a synthetic folder node with
   * minimal data so breadcrumbs can render correctly. For the final
   * (clicked) folder we use the real CompanionFile data.
   */
  #buildTree(file: CompanionFile): PartialTree {
    const { partialTree } = this.plugin.getPluginState()
    const newPartialTree: PartialTree = [...partialTree]

    // Decode URI and split into path segments
    const decodedPath = decodeURIComponent(file.requestPath)
    const segments = decodedPath.split('/').filter((s) => s.length > 0)

    let parentId: PartialTreeId = this.plugin.rootFolderId

    segments.forEach((segment, index, arr) => {
      // Build encoded path incrementally
      const pathSegments = segments.slice(0, index + 1)
      const encodedPath = encodeURIComponent(`/${pathSegments.join('/')}`)

      // Skip if node already exists
      const existingNode = newPartialTree.find((n) => n.id === encodedPath)
      if (existingNode) {
        parentId = encodedPath
        return
      }

      // Check if this is the last segment and the file is not a folder
      const isLastSegment = index === arr.length - 1
      const isFile = !file.isFolder && isLastSegment

      let node: PartialTreeFolderNode | PartialTreeFile

      if (isFile) {
        // Create a file node for the last segment
        const restrictionError = this.validateSingleFile(file)
        node = {
          type: 'file',
          id: encodedPath,
          restrictionError,
          status: 'unchecked',
          parentId,
          data: file,
        }
      } else {
        // Create a folder node (either intermediate ancestor or target folder)
        const isTargetFolder = encodedPath === file.requestPath
        const folderData = isTargetFolder
          ? file
          : this.#createSyntheticFolderCompanionFile(segment, encodedPath)

        node = {
          type: 'folder',
          id: encodedPath,
          cached: false,
          nextPagePath: null,
          status: 'unchecked',
          parentId,
          data: folderData,
        }
      }

      newPartialTree.push(node)
      parentId = encodedPath
    })

    return newPartialTree
  }

  async openSearchResultFolder(file: CompanionFile): Promise<void> {
    // 1) Ensure ancestor chain and the folder itself exist in the tree
    const builtTree = this.#buildTree(file)

    // 2) Clear search state and switch back to normal view
    this.#searchState.isSearchActive = false
    this.#searchState.searchResult = []
    this.#searchState.scopeId = null

    this.plugin.setPluginState({
      partialTree: builtTree,
      currentFolderId: file.requestPath,
      searchString: '',
    })

    await this.openFolder(file.requestPath)
  }

  async openFolder(folderId: string | null): Promise<void> {
    this.lastCheckbox = null
    // Returning cached folder
    const { partialTree } = this.plugin.getPluginState()
    const clickedFolder = partialTree.find(
      (folder) => folder.id === folderId,
    )! as PartialTreeFolder
    if (clickedFolder.cached) {
      this.plugin.setPluginState({
        currentFolderId: folderId,
        searchString: '',
      })
      return
    }

    console.log("clickedFolder ---> ", clickedFolder)
    this.setLoading(true)
    await this.#withAbort(async (signal) => {
      let currentPagePath = folderId
      let currentItems: CompanionFile[] = []
      do {
        const { username, nextPagePath, items } = await this.provider.list(
          currentPagePath,
          { signal },
        )
        // It's important to set the username during one of our first fetches
        this.plugin.setPluginState({ username })

        currentPagePath = nextPagePath
        currentItems = currentItems.concat(items)
        this.setLoading(
          this.plugin.uppy.i18n('loadedXFiles', {
            numFiles: currentItems.length,
          }),
        )
      } while (this.opts.loadAllFiles && currentPagePath)

      const newPartialTree = PartialTreeUtils.afterOpenFolder(
        partialTree,
        currentItems,
        clickedFolder,
        currentPagePath,
        this.validateSingleFile,
      )

      this.plugin.setPluginState({
        partialTree: newPartialTree,
        currentFolderId: folderId,
        searchString: '',
      })
    }).catch(handleError(this.plugin.uppy))

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
          authenticated: false,
        })
      }
    }).catch(handleError(this.plugin.uppy))
  }

  async handleAuth(authFormData?: unknown): Promise<void> {
    await this.#withAbort(async (signal) => {
      this.setLoading(true)
      await this.provider.login({ authFormData, signal })
      this.plugin.setPluginState({ authenticated: true })
      await Promise.all([
        this.provider.fetchPreAuthToken(),
        this.openFolder(this.plugin.rootFolderId),
      ])
    }).catch(handleError(this.plugin.uppy))
    this.setLoading(false)
  }

  async handleScroll(event: Event): Promise<void> {
    const { partialTree, currentFolderId } = this.plugin.getPluginState()
    const currentFolder = partialTree.find(
      (i) => i.id === currentFolderId,
    ) as PartialTreeFolder
    if (
      shouldHandleScroll(event) &&
      !this.isHandlingScroll &&
      currentFolder.nextPagePath
    ) {
      this.isHandlingScroll = true
      await this.#withAbort(async (signal) => {
        const { nextPagePath, items } = await this.provider.list(
          currentFolder.nextPagePath,
          { signal },
        )
        const newPartialTree = PartialTreeUtils.afterScrollFolder(
          partialTree,
          currentFolderId,
          items,
          nextPagePath,
          this.validateSingleFile,
        )

        this.plugin.setPluginState({ partialTree: newPartialTree })
      }).catch(handleError(this.plugin.uppy))
      this.isHandlingScroll = false
    }
  }

  validateSingleFile = (file: CompanionFile): string | null => {
    const companionFile: ValidateableFile<M, B> = remoteFileObjToLocal(file)
    const result = this.plugin.uppy.validateSingleFile(companionFile)
    return result
  }

  toggleSearchResultCheckbox = (file: CompanionFile): void => {
    const fileId = file.requestPath
    const { partialTree } = this.plugin.getPluginState()

    const existingItem = partialTree.find((item) => item.id === fileId)
    const isCurrentlyChecked =
      existingItem?.type !== 'root' && existingItem?.status === 'checked'
    const nextIsChecked = !isCurrentlyChecked

    const updatedPartialTree = this.#buildTree(file)

    // Extract parent folder IDs from the file's path for status updates
    const decodedPath = decodeURIComponent(file.requestPath)
    const segments = decodedPath.split('/').filter((s) => s.length > 0)
    const parentSegments = segments.slice(0, segments.length - 1)

    const parentNodeIds: PartialTreeId[] = []
    parentSegments.forEach((_, index) => {
      const pathSegments = segments.slice(0, index + 1)
      const encodedPath = encodeURIComponent(`/${pathSegments.join('/')}`)
      parentNodeIds.push(encodedPath)
    })

    const targetItem = updatedPartialTree.find((item) => item.id === fileId) as
      | PartialTreeFile
      | PartialTreeFolderNode

    // #buildTree guarantees the target node exists; refresh validation if it's a file
    if (targetItem.type === 'file') {
      targetItem.restrictionError = this.validateSingleFile(file)
    }

    const appliedCheckedState =
      nextIsChecked &&
      (targetItem.type !== 'file' || !targetItem.restrictionError)

    if (appliedCheckedState) {
      targetItem.status = 'checked'
    } else if (!nextIsChecked) {
      targetItem.status = 'unchecked'
    }

    parentNodeIds.forEach((parentNodeId) => {
      const parentNode = updatedPartialTree.find(
        (item) => item.id === parentNodeId,
      ) as PartialTreeFolderNode | undefined
      if (!parentNode) return

      if (appliedCheckedState) {
        if (parentNode.status !== 'checked') {
          parentNode.status = 'partial'
        }
      } else if (!nextIsChecked) {
        const hasCheckedChildren = updatedPartialTree.some(
          (item) =>
            item.type !== 'root' &&
            item.parentId === parentNodeId &&
            item.status === 'checked',
        )
        parentNode.status = hasCheckedChildren ? 'partial' : 'unchecked'
      }
    })

    console.log("updatedPartialTree after toggleSearchResultCheckbox ---> ", updatedPartialTree)
    this.plugin.setPluginState({ partialTree: updatedPartialTree })
  }

  async donePicking(): Promise<void> {
    const { partialTree } = this.plugin.getPluginState()

    this.setLoading(true)
    await this.#withAbort(async (signal) => {
      // 1. Enrich our partialTree by fetching all 'checked' but not-yet-fetched folders
      const enrichedTree: PartialTree = await PartialTreeUtils.afterFill(
        partialTree,
        (path: PartialTreeId) => this.provider.list(path, { signal }),
        this.validateSingleFile,
        (n) => {
          this.setLoading(
            this.plugin.uppy.i18n('addedNumFiles', { numFiles: n }),
          )
        },
      )

      // 2. Now that we know how many files there are - recheck aggregateRestrictions!
      const aggregateRestrictionError =
        this.validateAggregateRestrictions(enrichedTree)
      if (aggregateRestrictionError) {
        this.plugin.setPluginState({ partialTree: enrichedTree })
        return
      }

      // 3. Add files
      const companionFiles = getCheckedFilesWithPaths(enrichedTree)
      addFiles(companionFiles, this.plugin, this.provider)

      // 4. Reset state
      this.resetPluginState()
    }).catch(handleError(this.plugin.uppy))
    this.setLoading(false)
  }

  toggleCheckbox(
    ourItem: PartialTreeFolderNode | PartialTreeFile,
    isShiftKeyPressed: boolean,
  ) {
    const { partialTree } = this.plugin.getPluginState()

    const clickedRange = getClickedRange(
      ourItem.id,
      this.getDisplayedPartialTree(),
      isShiftKeyPressed,
      this.lastCheckbox,
    )
    const newPartialTree = PartialTreeUtils.afterToggleCheckbox(
      partialTree,
      clickedRange,
    )

    this.plugin.setPluginState({ partialTree: newPartialTree })
    this.lastCheckbox = ourItem.id
  }

  getDisplayedPartialTree = (): (PartialTreeFile | PartialTreeFolderNode)[] => {
    const { partialTree, currentFolderId, searchString } =
      this.plugin.getPluginState()
    const inThisFolder = partialTree.filter(
      (item) => item.type !== 'root' && item.parentId === currentFolderId,
    ) as (PartialTreeFile | PartialTreeFolderNode)[]
    const filtered =
      searchString === ''
        ? inThisFolder
        : inThisFolder.filter(
            (item) =>
              (item.data.name ?? this.plugin.uppy.i18n('unnamed'))
                .toLowerCase()
                .indexOf(searchString.toLowerCase()) !== -1,
          )

    return filtered
  }

  getBreadcrumbs = (): PartialTreeFolder[] => {
    const { partialTree, currentFolderId } = this.plugin.getPluginState()
    return getBreadcrumbs(partialTree, currentFolderId)
  }

  getSelectedAmount = (): number => {
    const { partialTree } = this.plugin.getPluginState()
    return getNumberOfSelectedFiles(partialTree)
  }

  validateAggregateRestrictions = (partialTree: PartialTree) => {
    const checkedFiles = partialTree.filter(
      (item) => item.type === 'file' && item.status === 'checked',
    ) as PartialTreeFile[]
    const uppyFiles = checkedFiles.map((file) => file.data)
    return this.plugin.uppy.validateAggregateRestrictions(uppyFiles)
  }

  render(state: unknown, viewOptions: RenderOpts<M, B> = {}): h.JSX.Element {
    const { didFirstRender } = this.plugin.getPluginState()
    const { i18n } = this.plugin.uppy
    console.log(
      'logging partialTree in render ---> ',
      this.plugin.getPluginState().partialTree,
    )
    if (!didFirstRender) {
      this.plugin.setPluginState({ didFirstRender: true })
      this.provider.fetchPreAuthToken()
      this.openFolder(this.plugin.rootFolderId)
    }

    const opts: Opts<M, B> = { ...this.opts, ...viewOptions }
    const { authenticated, loading } = this.plugin.getPluginState()
    const pluginIcon = this.plugin.icon || defaultPickerIcon

    if (authenticated === false) {
      return (
        <AuthView
          pluginName={this.plugin.title}
          pluginIcon={pluginIcon}
          handleAuth={this.handleAuth}
          i18n={this.plugin.uppy.i18n}
          renderForm={opts.renderAuthForm}
          loading={loading}
        />
      )
    }

    const { partialTree, username, searchString } = this.plugin.getPluginState()
    const breadcrumbs = this.getBreadcrumbs()

    // Derive checked and partial search results from partialTree
    const searchResultStatuses = new Map<string, 'checked' | 'partial'>(
      partialTree
        .filter((item) => item.type !== 'root' && (item.status === 'checked' || item.status === 'partial'))
        .map((item) => {
          const status = item.type === 'root' ? 'unchecked' : item.status
          return [item.id as string, status as 'checked' | 'partial']
        }),
    )

    return (
      <div
        className={classNames(
          'uppy-ProviderBrowser',
          `uppy-ProviderBrowser-viewType--${opts.viewType}`,
        )}
      >
        <Header<M, B>
          showBreadcrumbs={opts.showBreadcrumbs}
          openFolder={this.openFolder}
          breadcrumbs={breadcrumbs}
          pluginIcon={pluginIcon}
          title={this.plugin.title}
          logout={this.logout}
          username={username}
          i18n={i18n}
        />

        {opts.showFilter && (
          <SearchInput
            searchString={searchString}
            setSearchString={(s: string) => this.onSearchInput(s)}
            submitSearchString={() => {}}
            inputLabel={i18n('filter')}
            clearSearchLabel={i18n('resetFilter')}
            wrapperClassName="uppy-ProviderBrowser-searchFilter"
            inputClassName="uppy-ProviderBrowser-searchFilterInput"
          />
        )}

        {this.#searchState.isSearchActive ? (
          <GlobalSearchView
            searchResults={this.#searchState.searchResult}
            searchResultStatuses={searchResultStatuses}
            openSearchResultFolder={this.openSearchResultFolder}
            toggleSearchResultCheckbox={this.toggleSearchResultCheckbox}
            validateSingleFile={this.validateSingleFile}
            i18n={i18n}
          />
        ) : (
          <Browser<M, B>
            toggleCheckbox={this.toggleCheckbox}
            displayedPartialTree={this.getDisplayedPartialTree()}
            openFolder={this.openFolder}
            virtualList={opts.virtualList}
            noResultsLabel={i18n('noFilesFound')}
            handleScroll={this.handleScroll}
            viewType={opts.viewType}
            showTitles={opts.showTitles}
            i18n={this.plugin.uppy.i18n}
            isLoading={loading}
            utmSource="Companion"
          />
        )}

        <FooterActions
          partialTree={partialTree}
          donePicking={this.donePicking}
          cancelSelection={this.cancelSelection}
          i18n={i18n}
          validateAggregateRestrictions={this.validateAggregateRestrictions}
        />
      </div>
    )
  }
}
