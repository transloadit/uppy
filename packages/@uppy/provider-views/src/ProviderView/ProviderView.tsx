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
import {
  percolateDown,
  percolateUp,
} from '../utils/PartialTreeUtils/afterToggleCheckbox.js'
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
  isSearchActive: false,
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
  searchResult: CompanionFile[]
  scopeId: string | null
  debounceId?: number
}

/**
 * SEARCH VIEW vs NORMAL VIEW
 * --------------------------------
 * Explanation:
 * We have Two Views Search View and Normal View
 * SearchView is only used when the Provider supports server side search i.e. provider.search is implemented for the provider
 * Search View is implemented through Components GlobalSearchView and SearchResultItem
 * we conditionally switch between Search View and Normal in the render method
 * Search View is used to display Server Side Search Results , which is stored in #searchState : SearchState
 * When users type their search query in search input box (SearchInput component) , we debounce the input and call provider.search api to fetch results
 * store it in #searchState and switch the view to Search View.
 * when the user enters a folder in search results or clears the search input query we switch back to Normal View.
 * Switching between Search View and Normal View happens by setting PluginState({ isSearchActive: true/false })
 */

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
    searchResult: [],
    scopeId: null,
    debounceId: undefined,
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
    this.clearSearchState = this.clearSearchState.bind(this)

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

  clearSearchState(): void {
    this.#clearSearchDebounce()
    this.#searchState.searchResult = []
    this.#searchState.scopeId = null
    this.plugin.setPluginState({ isSearchActive: false })
  }

  #clearSearchDebounce(): void {
    if (this.#searchState.debounceId != null) {
      window.clearTimeout(this.#searchState.debounceId)
      this.#searchState.debounceId = undefined
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

  #hasServerSideSearch(): boolean {
    const supportsServerSearch = typeof this.provider.search === 'function'
    return supportsServerSearch
  }

  async #performSearch(): Promise<void> {
    const { partialTree, currentFolderId, searchString } =
      this.plugin.getPluginState()
    const currentFolder = partialTree.find(
      (i) => i.id === currentFolderId,
    ) as PartialTreeFolder

    this.setLoading('Searching...')
    await this.#withAbort(async (signal) => {
      const scopePath = currentFolder.type === 'root' ? null : currentFolderId
      const { items } = await (this.provider as any).search(searchString, {
        signal,
        path: scopePath ?? undefined,
      })

      // ! any alternatives ?
      // return if user clears search before results arrive
      const currentSearchString = this.plugin.getPluginState().searchString
      if (currentSearchString.trim() === '') {
        return
      }

      this.#searchState.searchResult = items
      this.#searchState.scopeId = scopePath
      this.plugin.setPluginState({ isSearchActive: true })
    }).catch(handleError(this.plugin.uppy))
    this.setLoading(false)
  }

  onSearchInput = (s: string): void => {
    this.plugin.setPluginState({ searchString: s })
    this.#clearSearchDebounce()
    const trimmed = s.trim()

    if (trimmed === '') {
      this.clearSearchState()
      return
    }

    if (!this.#hasServerSideSearch()) {
      return
    }

    this.#searchState.debounceId = window.setTimeout(() => {
      this.#performSearch()
      this.#searchState.debounceId = undefined
    }, 500)
  }

  // Create a minimal CompanionFile object for ancestor folders when building the path
  #createMinimalFolderData(name: string, requestPath: string): CompanionFile {
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

  // build the Leaf Node , it can be a file ( PartialTreeFile ) or a folder ( PartialTreeFolderNode )
  // Since we Already have the leaf node's data ( file : CompanionFile) from the searchResults: CompanionFile[]  , we just use that.
  #buildLastNode(
    file: CompanionFile,
    encodedPath: string,
    parentId: PartialTreeId,
  ): PartialTreeFolderNode | PartialTreeFile {
    const isFile = !file.isFolder
    let node: PartialTreeFolderNode | PartialTreeFile

    if (isFile) {
      node = {
        type: 'file',
        id: encodedPath,
        restrictionError: this.validateSingleFile(file),
        status: 'unchecked',
        parentId,
        data: file,
      }
    } else {
      node = {
        type: 'folder',
        id: encodedPath,
        cached: false,
        nextPagePath: null,
        status: 'unchecked',
        parentId,
        data: file,
      }
    }

    return node
  }

  /**
   * This is function is used to build the Entire Path ( ancestor + Leaf Node ) for the clicked Item in Search Result displayed in Search View ( Refer to the comment Explaining Search View at the top of the file )
   * We use this when User Checks / opens a folder in search results
   * We need to make sure all ancestor folders are present in the partialTree before we open the folder or check the file
   * Why do we need to build ancestor path ? , Because when we open a folder we need to have all it's parent folders in the partialTree to be able to render the breadcrumbs correctly
   * Similarly when we check a file, we need to have all it's ancestor folders in the partialTree to be able to percolateUp the checked state correctly.
   */
  #buildPath(file: CompanionFile): PartialTree {
    const { partialTree } = this.plugin.getPluginState()
    const newPartialTree: PartialTree = [...partialTree]

    // Decode URI and split into path segments
    const decodedPath = decodeURIComponent(file.requestPath)
    const segments = decodedPath.split('/').filter((s) => s.length > 0)

    // Start from root
    let parentId: PartialTreeId = this.plugin.rootFolderId

    // Walk through each segment and build ancestor nodes if they don't exist
    segments.forEach((segment, index, arr) => {
      const pathSegments = segments.slice(0, index + 1)
      const encodedPath = encodeURIComponent(`/${pathSegments.join('/')}`)

      // Skip if node already exists
      const existingNode = newPartialTree.find((n) => n.id === encodedPath)
      if (existingNode) {
        parentId = encodedPath
        return
      }

      const isLeafNode = index === arr.length - 1
      let node: PartialTreeFolderNode | PartialTreeFile

      if (isLeafNode) {
        node = this.#buildLastNode(file, encodedPath, parentId)
      } else {
        node = {
          type: 'folder',
          id: encodedPath,
          cached: false,
          nextPagePath: null,
          status: 'unchecked',
          parentId,
          data: this.#createMinimalFolderData(segment, encodedPath),
        }
      }
      newPartialTree.push(node)
      parentId = encodedPath // This node becomes parent for next iteration
    })

    return newPartialTree
  }

  // Derive Checked State from PartialTree
  #returnCheckedState(tree: PartialTree): Map<string, 'checked' | 'partial'> {
    const checkedState = new Map<string, 'checked' | 'partial'>()
    tree.forEach((item) => {
      if (item.type !== 'root' && item.status !== 'unchecked') {
        checkedState.set(
          item.id as string,
          item.status as 'checked' | 'partial',
        )
      }
    })
    return checkedState
  }

  async openSearchResultFolder(file: CompanionFile): Promise<void> {
    // Ensure the entire path to the folder is built
    const builtTree = this.#buildPath(file)

    this.clearSearchState()

    this.plugin.setPluginState({
      partialTree: builtTree,
      currentFolderId: file.requestPath,
      searchString: '',
      isSearchActive: false, // Switch back to Normal View
    })

    await this.openFolder(file.requestPath) // Open Folder using normal flow
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

  /**
   * We still build the ancestor path when the user checks or unchecks a search result.
   * Building ancestor nodes isn’t expensive anymore since it doesn’t involve network calls.
   * Even if a checked item is later unchecked without being uploaded, it still gets added to the partialTree.
   *
   * While it might seem intuitive to build the ancestor path only when opening a folder and,
   * when checking and uploading a file/folder from search view, that approach would require patching edge cases
   * related to checked state across the two views ( Search View and Normal View) in openFolder and afterOpenFolder.
   */
  toggleSearchResultCheckbox = (file: CompanionFile): void => {
    const fileId = file.requestPath
    const builtTree = this.#buildPath(file)

    const targetItem = builtTree.find((item) => item.id === fileId) as
      | PartialTreeFile
      | PartialTreeFolderNode

    if (targetItem.type === 'file') {
      targetItem.restrictionError = this.validateSingleFile(file)
    }

    // Toggle the status: partial/unchecked → checked, checked → unchecked
    targetItem.status =
      targetItem.status === 'checked' ? 'unchecked' : 'checked'

    percolateDown(builtTree, targetItem.id, targetItem.status === 'checked')
    percolateUp(builtTree, targetItem.parentId)

    this.plugin.setPluginState({ partialTree: builtTree })
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

    const { partialTree, username, searchString, isSearchActive } =
      this.plugin.getPluginState()
    const breadcrumbs = this.getBreadcrumbs()
    const searchResultStatusMap = this.#returnCheckedState(partialTree)

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

        {isSearchActive ? (
          <GlobalSearchView
            searchResults={this.#searchState.searchResult}
            searchResultStatuses={searchResultStatusMap}
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
