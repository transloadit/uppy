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
import { materializePath } from '../utils/PartialTreeUtils/pathLoaderCore.js'
import shouldHandleScroll from '../utils/shouldHandleScroll.js'
import AuthView from './AuthView.js'
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

  // Ephemeral server-side search overlay state (kept out of partialTree)
  #search: {
    active: boolean
    results: CompanionFile[]
    cursor: string | null
    scopeId: PartialTreeId
  } = {
    active: false,
    results: [],
    cursor: null,
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
    this.#clearSearchOverlay()
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

  #abortController: AbortController | undefined

  #searchDebounceId: number | undefined

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

  #isSearchMode(): boolean {
    const { searchString } = this.plugin.getPluginState()
    const supportsServerSearch = typeof (this.provider as any).search === 'function'
    return supportsServerSearch && searchString.trim() !== ''
  }

  #extractCursor(nextPagePath: string | null): string | null {
    if (!nextPagePath) return null
    // Accept either raw cursor or a query string like "?cursor=..."
    if (!nextPagePath.startsWith('?')) return nextPagePath
    const params = new URLSearchParams(nextPagePath.replace(/^\?/, ''))
    return params.get('cursor')
  }

  // Identify ephemeral search overlay items by their synthetic id prefix
  #isSearchEphemeralId(id: PartialTreeId | string | null | undefined): boolean {
    return typeof id === 'string' && id.includes('/__search__/')
  }

  // Clear overlay search state to free memory and avoid stale state
  #clearSearchOverlay(): void {
    this.#search.active = false
    this.#search.results = []
    this.#search.cursor = null
    this.#search.scopeId = null
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
      const baseContextNode = (partialTree.find((i) => i.id === baseContextId) || currentFolder) as PartialTreeFolder
      const scopePath = baseContextNode.type === 'root' ? null : baseContextId
      const { items, nextPagePath } = await (this.provider as any).search(
        searchString,
        { signal, path: scopePath ?? undefined },
      )
      // Overlay: store results and cursor; don't mutate tree
      this.#search.active = true
      this.#search.results = items
      this.#search.cursor = this.#extractCursor(nextPagePath)
      this.#search.scopeId = scopePath
      this.plugin.setPluginState({ partialTree: partialTree.slice() })

    }).catch(handleError(this.plugin.uppy))
    this.setLoading(false)
  }


  onSearchInput(s: string): void {
    // Update state immediately for controlled input
    this.plugin.setPluginState({ searchString: s })

    // Clear pending debounce
    if (this.#searchDebounceId) {
      window.clearTimeout(this.#searchDebounceId)
      this.#searchDebounceId = undefined
    }

    const trimmed = s.trim()
    if (trimmed === '') {
      // Clear overlay state only
      this.#search.active = false
      this.#search.results = []
      this.#search.cursor = null
      this.#search.scopeId = null
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

  async openFolder(folderId: string | null): Promise<void> {
    this.lastCheckbox = null

    // If trying to open an item inside the search overlay, materialize its real path
    if (this.#isSearchEphemeralId(folderId)) {
      const { partialTree } = this.plugin.getPluginState()
      this.setLoading(true)
      await this.#withAbort(async (signal) => {
        // Build a small apiList wrapper over provider.list to match util signature
        const apiList = async (directory: PartialTreeId) => {
          const { items, nextPagePath } = await this.provider.list(directory, { signal })
          return { items, nextPagePath }
        }

        const { partialTree: materializedTree, targetId } = await materializePath(
          partialTree,
          folderId,
          apiList,
          this.validateSingleFile,
          { includeTargetFirstPage: true },
        )

        this.plugin.setPluginState({
          partialTree: materializedTree,
          currentFolderId: targetId,
          searchString: '',
        })
        // Exit overlay mode
        this.#search.active = false
        this.#search.results = []
        this.#search.cursor = null
        this.#search.scopeId = null
      }).catch(handleError(this.plugin.uppy))
      this.setLoading(false)
      return
    }

    // Returning cached folder
    const { partialTree } = this.plugin.getPluginState()
    const clickedFolder = partialTree.find(
      (folder) => folder.id === folderId,
    ) as PartialTreeFolder

    // If user is searching and navigates to a real folder, clear search and proceed normally
    if (this.#isSearchMode()) {
      this.#clearSearchOverlay()
      this.plugin.setPluginState({ currentFolderId: folderId, searchString: '' })
    }

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

        this.#clearSearchOverlay()
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
    const isSearch = this.#isSearchMode()
    const hasCursor = isSearch ? !!this.#search.cursor : !!currentFolder.nextPagePath
    if (shouldHandleScroll(event) && !this.isHandlingScroll && hasCursor) {
      this.isHandlingScroll = true
      await this.#withAbort(async (signal) => {
        if (isSearch) {
          const { items, nextPagePath } = await (this.provider as any).search(
            this.plugin.getPluginState().searchString,
            {
              signal,
              path: this.#search.scopeId ?? undefined,
              cursor: this.#search.cursor ?? undefined,
            },
          )
          this.#search.results = this.#search.results.concat(items)
          this.#search.cursor = this.#extractCursor(nextPagePath)
          this.plugin.setPluginState({ partialTree: partialTree.slice() })
        } else {
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
        }
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

    // Special handling: if toggling an item surfaced from search results,
    // ensure its real ancestors exist and toggle the real node only.
    if (this.#isSearchEphemeralId(ourItem.id)) {
      const rawId = ourItem.id
      this.#withAbort(async (signal) => {
        const apiList = async (directory: PartialTreeId) => {
          const { items, nextPagePath } = await this.provider.list(directory, { signal })
          return { items, nextPagePath }
        }
        const { partialTree: withAncestors, targetId } = await materializePath(
          partialTree,
          rawId,
          apiList,
          this.validateSingleFile,
          { includeTargetFirstPage: false },
        )
        const realId = (targetId ?? '').toString()
        const toggledTree = PartialTreeUtils.afterToggleCheckbox(withAncestors, [realId])
        this.plugin.setPluginState({ partialTree: toggledTree })
        this.lastCheckbox = rawId
      }).catch(handleError(this.plugin.uppy))
      return
    }

    // Default behavior (non-search): compute range and toggle
    const clickedRange = getClickedRange(
      ourItem.id,
      this.getDisplayedPartialTree(),
      isShiftKeyPressed,
      this.lastCheckbox,
    )
    const newPartialTree = PartialTreeUtils.afterToggleCheckbox(partialTree, clickedRange)

    this.plugin.setPluginState({ partialTree: newPartialTree })
    this.lastCheckbox = ourItem.id
  }

  // Map server-side search results to ephemeral items for overlay rendering
  #mapSearchResultsToEphemeral(
    partialTree: PartialTree,
  ): (PartialTreeFile | PartialTreeFolderNode)[] {
    const baseContextId = this.#search.scopeId
    const baseScope =
      baseContextId && typeof baseContextId === 'string'
        ? decodeURIComponent(baseContextId)
        : ''

    return this.#search.results.map((file) => {
      if (file.isFolder) {
        const node: PartialTreeFolderNode = {
          type: 'folder',
          id: `/__search__/${file.requestPath}`,
          cached: true,
          nextPagePath: null,
          status: (partialTree.find((n) => n.id === file.requestPath) as
            | PartialTreeFolderNode
            | undefined)?.status || 'unchecked',
          parentId: '/__search__',
          data: file,
        }
        return node
      }

      const restrictionError = this.validateSingleFile(file)
      const fullPath = decodeURIComponent(file.requestPath)
      const lastSlash = fullPath.lastIndexOf('/')
      const absDirPath = lastSlash > 0 ? fullPath.slice(0, lastSlash) : '/'
      let relDirPath: string | undefined
      if (baseScope && absDirPath.startsWith(baseScope)) {
        const rel = absDirPath.slice(baseScope.length).replace(/^\//, '')
        relDirPath = rel === '' ? undefined : rel
      }
      const node: PartialTreeFile = {
        type: 'file',
        id: `/__search__/${file.requestPath}`,
        restrictionError,
        status:
          (partialTree.find((n) => n.id === file.requestPath) as
            | PartialTreeFile
            | undefined)?.status || 'unchecked',
        parentId: '/__search__',
        data: { ...file, absDirPath, relDirPath },
      }
      return node
    })
  }

  getDisplayedPartialTree = (): (PartialTreeFile | PartialTreeFolderNode)[] => {
    const { partialTree, currentFolderId, searchString } =
      this.plugin.getPluginState()
    // Server-side search overlay: map results to ephemeral items
    if (this.#isSearchMode() && this.#search.active) {
      return this.#mapSearchResultsToEphemeral(partialTree)
    }

    // Default: items under the current folder (client-side filter if any)
    const inThisFolder = partialTree.filter(
      (item) => item.type !== 'root' && item.parentId === currentFolderId,
    ) as (PartialTreeFile | PartialTreeFolderNode)[]

    const lowered = searchString.toLowerCase()
    return searchString === ''
      ? inThisFolder
      : inThisFolder.filter((item) =>
          (item.data.name ?? this.plugin.uppy.i18n('unnamed'))
            .toLowerCase()
            .includes(lowered),
        )
  }

  getBreadcrumbs = (): PartialTreeFolder[] => {
    const { partialTree, currentFolderId } = this.plugin.getPluginState()
    return getBreadcrumbs(partialTree, currentFolderId)
  }

  getSelectedAmount = (): number => {
    const { partialTree } = this.plugin.getPluginState()
    return getNumberOfSelectedFiles(partialTree)
  }

  // Compute dynamic placeholder based on current scope (root vs folder)
  #buildSearchPlaceholder(
    currentFolderId: PartialTreeId,
    partialTree: PartialTree,
  ): string {
    const effectiveId = currentFolderId
    const node = partialTree.find((n) => n.id === effectiveId)
    const lastPathLabel =
      node && node.type !== 'root'
        ? (node as PartialTreeFolderNode).data.name
        : this.plugin.title
    return `search in ${lastPathLabel}`
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

    const { partialTree, username, searchString, currentFolderId } = this.plugin.getPluginState()
    const breadcrumbs = this.getBreadcrumbs()
    const dynamicPlaceholder = this.#buildSearchPlaceholder(currentFolderId, partialTree)

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
            submitSearchString={() => {
              if (this.#isSearchMode()) this.#performSearch()
            }}
            inputLabel={dynamicPlaceholder}
            clearSearchLabel={i18n('resetFilter')}
            wrapperClassName="uppy-ProviderBrowser-searchFilter"
            inputClassName="uppy-ProviderBrowser-searchFilterInput"
          />
        )}

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
