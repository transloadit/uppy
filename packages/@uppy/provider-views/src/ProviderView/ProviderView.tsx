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
import debounce from 'lodash/debounce.js'
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
  supportsSearch?: boolean
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
/**
 * Class to easily generate generic views for Provider plugins
 *
 * We have a *search view* and a *normal view*.
 * Search view is only used when the Provider supports server side search i.e. provider.search method is implemented for the provider.
 * The state is stored in searchResults.
 * Search view is implemented in components GlobalSearchView and SearchResultItem.
 * We conditionally switch between search view and normal in the render method when a server side search is initiated.
 * When users type their search query in search input box (SearchInput component), we debounce the input and call provider.search method to fetch results from the server.
 * when the user enters a folder in search results or clears the search input query we switch back to Normal View.
 */
export default class ProviderView<M extends Meta, B extends Body> {
  static VERSION = packageJson.version

  plugin: UnknownProviderPlugin<M, B>

  provider: UnknownProviderPlugin<M, B>['provider']

  opts: Opts<M, B>

  isHandlingScroll: boolean = false

  previousCheckbox: string | null = null

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

  get isLoading() {
    return this.plugin.getPluginState().loading
  }

  cancelSelection(): void {
    const { partialTree } = this.plugin.getPluginState()
    const newPartialTree: PartialTree = partialTree.map((item) =>
      item.type === 'root' ? item : { ...item, status: 'unchecked' },
    )
    this.plugin.setPluginState({ partialTree: newPartialTree })
  }

  clearSearchState(): void {
    this.plugin.setPluginState({
      searchResults: undefined,
    })
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

  async #search(): Promise<void> {
    const { partialTree, currentFolderId, searchString } =
      this.plugin.getPluginState()

    const currentFolder = partialTree.find((i) => i.id === currentFolderId)!

    if (searchString.trim() === '') {
      this.#abortController?.abort()
      this.clearSearchState()
      return
    }

    this.setLoading(true)
    await this.#withAbort(async (signal) => {
      const scopePath =
        currentFolder.type === 'root' ? undefined : currentFolderId
      const { items } = await this.provider.search!(searchString, {
        signal,
        path: scopePath,
      })

      // For each searched file, build the entire path (from the root all the way to the leaf node)
      // This is because we need to make sure all ancestor folders are present in the partialTree before we open the folder or check the file.
      // This is needed because when the user opens a folder we need to have all its parent folders in the partialTree to be able to render the breadcrumbs correctly.
      // Similarly when the user checks a file, we need to have all it's ancestor folders in the partialTree to be able to percolateUp the checked state correctly to its ancestors.

      const { partialTree } = this.plugin.getPluginState()
      const newPartialTree: PartialTree = [...partialTree]

      for (const file of items) {
        // Decode URI and split into path segments
        const decodedPath = decodeURIComponent(file.requestPath)
        const segments = decodedPath.split('/').filter((s) => s.length > 0)

        // Start from root
        let parentId: PartialTreeId = this.plugin.rootFolderId
        let isParentFolderChecked: boolean

        // Walk through each segment starting from the root and build child nodes if they don't exist
        segments.forEach((segment, index, arr) => {
          const pathSegments = segments.slice(0, index + 1)
          const encodedPath = encodeURIComponent(`/${pathSegments.join('/')}`)

          // Skip if node already exists
          const existingNode = newPartialTree.find(
            (n) => n.id === encodedPath && n.type !== 'root',
          ) as PartialTreeFolderNode | PartialTreeFile | undefined
          if (existingNode) {
            parentId = encodedPath
            isParentFolderChecked = existingNode.status === 'checked'
            return
          }

          const isLeafNode = index === arr.length - 1
          let node: PartialTreeFolderNode | PartialTreeFile

          // propagate checked state from parent to children, if the user has checked the parent folder before searching
          // and the parent folder is an ancestor of the searched file
          // see also afterOpenFolder which contains similar logic, we should probably refactor and reuse some
          const status = isParentFolderChecked ? 'checked' : 'unchecked'

          // Build the Leaf Node, it can be a file (`PartialTreeFile`) or a folder (`PartialTreeFolderNode`).
          // Since we Already have the leaf node's data (`file`, `CompanionFile`) from the searchResults: CompanionFile[], we just use that.
          if (isLeafNode) {
            if (file.isFolder) {
              node = {
                type: 'folder',
                id: encodedPath,
                cached: false,
                nextPagePath: null,
                status,
                parentId,
                data: file,
              }
            } else {
              const restrictionError = this.validateSingleFile(file)
              node = {
                type: 'file',
                id: encodedPath,
                restrictionError,
                status: !restrictionError ? status : 'unchecked',
                parentId,
                data: file,
              }
            }
          } else {
            // not leaf node, so by definition it is a folder leading up to the leaf node
            node = {
              type: 'folder',
              id: encodedPath,
              cached: false,
              nextPagePath: null,
              status,
              parentId,
              data: {
                // we don't have any data, so fill only the necessary fields
                name: decodeURIComponent(segment),
                icon: 'folder',
                isFolder: true,
              },
            }
          }
          newPartialTree.push(node)
          parentId = encodedPath // This node becomes parent for the next iteration
          isParentFolderChecked = status === 'checked'
        })
      }

      this.plugin.setPluginState({
        partialTree: newPartialTree,
        searchResults: items.map((item) => item.requestPath),
      })
    }).catch(handleError(this.plugin.uppy))
    this.setLoading(false)
  }

  #searchDebounced = debounce(this.#search, 500)

  onSearchInput = (s: string): void => {
    this.plugin.setPluginState({ searchString: s })
    if (this.opts.supportsSearch) this.#searchDebounced()
  }

  async openSearchResultFolder(folderId: PartialTreeId): Promise<void> {
    // stop searching
    this.plugin.setPluginState({ searchString: '' })

    // now open folder using the normal view
    await this.openFolder(folderId)
  }

  async openFolder(folderId: PartialTreeId): Promise<void> {
    // always switch away from the search view when opening a folder, whether it happens from the search view or by clicking breadcrumbs
    this.clearSearchState()

    this.previousCheckbox = null
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

  async donePicking(): Promise<void> {
    const { partialTree } = this.plugin.getPluginState()

    if (this.isLoading) return
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
      this.previousCheckbox,
    )

    const newPartialTree = PartialTreeUtils.afterToggleCheckbox(
      partialTree,
      clickedRange,
    )

    this.plugin.setPluginState({ partialTree: newPartialTree })
    this.previousCheckbox = ourItem.id
  }

  getDisplayedPartialTree = (): (PartialTreeFile | PartialTreeFolderNode)[] => {
    const { partialTree, currentFolderId, searchString } =
      this.plugin.getPluginState()
    const inThisFolder = partialTree.filter(
      (item) => item.type !== 'root' && item.parentId === currentFolderId,
    ) as (PartialTreeFile | PartialTreeFolderNode)[]

    // If provider supports server side search, we don't filter the items client side
    const filtered =
      this.opts.supportsSearch || searchString.trim() === ''
        ? inThisFolder
        : inThisFolder.filter(
            (item) =>
              (item.data.name ?? this.plugin.uppy.i18n('unnamed'))
                .toLowerCase()
                .indexOf(searchString.trim().toLowerCase()) !== -1,
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

  #renderSearchResults() {
    const { i18n } = this.plugin.uppy

    const { searchResults: ids, partialTree } = this.plugin.getPluginState()

    // todo memoize this so we don't have to do it on every render
    const itemsById = new Map<string, PartialTreeFile | PartialTreeFolderNode>()
    partialTree.forEach((item) => {
      if (item.type !== 'root') {
        itemsById.set(item.id, item)
      }
    })

    // the search results view needs data from the partial tree,
    const searchResults = ids!.map((id) => {
      const partialTreeItem = itemsById.get(id)
      if (partialTreeItem == null) throw new Error('Partial tree not complete')
      return partialTreeItem
    })

    return (
      <GlobalSearchView
        searchResults={searchResults}
        openFolder={this.openSearchResultFolder}
        toggleCheckbox={this.toggleCheckbox}
        i18n={i18n}
      />
    )
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

    const { partialTree, username, searchString, searchResults } =
      this.plugin.getPluginState()
    const breadcrumbs = this.getBreadcrumbs()

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

        {searchResults ? (
          this.#renderSearchResults()
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
