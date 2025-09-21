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
  // If true, uses Companion server-side search (dedicated endpoint) and flat results mode.
  // If false, keeps legacy behavior: client-side filtering within the current folder only.
  useServerSearch?: boolean
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

  constructor(plugin: UnknownProviderPlugin<M, B>, opts: PassedOpts<M, B>) {
    this.plugin = plugin
    this.provider = opts.provider

    const defaultOptions: DefaultOpts<M, B> = {
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true,
      loadAllFiles: false,
      // Default to legacy, non-intrusive behavior unless explicitly enabled.
      useServerSearch: false,
      virtualList: false,
    }
    this.opts = { ...defaultOptions, ...opts }

    this.openFolder = this.openFolder.bind(this)
    this.setSearchString = this.setSearchString.bind(this)
    this.search = this.search.bind(this)
    this.logout = this.logout.bind(this)
    this.handleAuth = this.handleAuth.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.resetPluginState = this.resetPluginState.bind(this)
    this.donePicking = this.donePicking.bind(this)
    this.render = this.render.bind(this)
    this.cancelSelection = this.cancelSelection.bind(this)
    this.toggleCheckbox = this.toggleCheckbox.bind(this)
    this.toggleSearchMode = this.toggleSearchMode.bind(this)

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

  #searchDebounce: number | undefined

  setSearchString(s: string): void {
    // Update input immediately
    this.plugin.setPluginState({ searchString: s })

    // If server-side search is disabled, do nothing else (client-side filter happens in getDisplayedPartialTree)
    if (!this.opts.useServerSearch) return

    // Clear previous debounce
    if (this.#searchDebounce != null) {
      clearTimeout(this.#searchDebounce)
      this.#searchDebounce = undefined
    }

    // Empty string -> exit search mode, restore browsing (re-open current folder)
    if (s.trim() === '') {
      // Always return to the provider root when search is cleared
      this.plugin.setPluginState(getDefaultState(this.plugin.rootFolderId))
      void this.openFolder(this.plugin.rootFolderId)
      return
    }

    // Debounce 2s before firing server-side search
    this.#searchDebounce = window.setTimeout(() => {
      void this.search()
    }, 500)
  }

  async search(): Promise<void> {
    if (!this.opts.useServerSearch) return
    const { searchString } = this.plugin.getPluginState()
    const q = searchString?.trim()
    if (!q) return

    this.setLoading(`Searching…`)
    await this.#withAbort(async (signal) => {
      // Call dedicated search endpoint
      const resp = await (this.provider.search?.(q, { signal }) ??
        this.provider.list(`?q=${encodeURIComponent(q)}`, { signal }))
      const { username, nextPagePath, items } = resp as {
        username: string
        nextPagePath: string | null
        items: CompanionFile[]
      }

      // Build a flat result list under a special root indicating search mode.
      // Preserve file vs folder to allow clicking folders to open them.
      const rootId = '__search__'
      const mapped = items.map((item: CompanionFile) => {
        if (item.isFolder) {
          return {
            type: 'folder',
            id: item.requestPath,
            cached: false,
            nextPagePath: null,
            status: 'unchecked',
            parentId: rootId,
            data: item,
          } as PartialTreeFolderNode
        }
        return {
          type: 'file',
          id: item.requestPath,
          status: 'unchecked',
          parentId: rootId,
          data: item,
        } as PartialTreeFile
      })

      const newPartialTree: PartialTree = [
        { type: 'root', id: rootId, cached: false, nextPagePath },
        ...mapped,
      ]
      this.plugin.setPluginState({
        username,
        partialTree: newPartialTree,
        currentFolderId: rootId,
      })
    }).catch(handleError(this.plugin.uppy))
    this.setLoading(false)
  }

  #isSearchMode(): boolean {
    const { partialTree } = this.plugin.getPluginState()
    const root = partialTree.find((i) => i.type === 'root') as
      | PartialTreeFolder
      | undefined
    return (this.opts.useServerSearch ?? false) && root?.id === '__search__'
  }

  async openFolder(folderId: string | null): Promise<void> {
    this.lastCheckbox = null
    // Returning cached folder
    const { partialTree, searchString: prevSearchString } =
      this.plugin.getPluginState()
    let clickedFolder = partialTree.find((folder) => folder.id === folderId) as
      | PartialTreeFolder
      | undefined

    // If we're in search mode and a folder from search results is opened,
    // transition to normal browse mode by constructing the ancestor chain
    // from the item's path (so breadcrumbs reflect the true location).
    if (
      this.#isSearchMode() &&
      clickedFolder &&
      clickedFolder.type === 'folder'
    ) {
      // Derive the real path from available fields. For search results we
      // always have requestPath; path_lower is preferred if present. Fallback
      // to the node id which we set to requestPath in search mode.
      const cf = (clickedFolder as any)?.data as CompanionFile | undefined
      const pathFromData =
        cf?.requestPath ??
        (typeof clickedFolder.id === 'string' ? clickedFolder.id : '')
      // requestPath might be URL-encoded (e.g. "/arch%2Frolling_release%2Fpatternfly").
      // Decode before splitting so we can construct proper ancestors.
      let pathLower: string = pathFromData || ''
      try {
        pathLower = decodeURIComponent(pathLower)
      } catch {
        // If it's not encoded, keep as-is.
      }
      const rootId = this.plugin.rootFolderId

      // Build ancestors from the path (excluding the last segment which is the folder itself)
      const segments = (pathLower || '')
        .replace(/^\/+/, '')
        .split('/')
        .filter(Boolean)
      const parentSegments = segments.slice(0, Math.max(segments.length - 1, 0))

      let parentId: string | null = rootId
      const ancestorNodes: PartialTreeFolderNode[] = []
      let accum = ''
      for (const seg of parentSegments) {
        accum += `/${seg}`
        const id = encodeURIComponent(accum)
        // Only create if missing
        const exists = partialTree.some((n) => n.id === id)
        if (!exists) {
          ancestorNodes.push({
            type: 'folder',
            id,
            cached: false,
            nextPagePath: null,
            status: 'unchecked',
            parentId,
            // minimal data for breadcrumbs
            // @ts-expect-error minimal CompanionFile-like
            data: { name: seg, requestPath: id, isFolder: true },
          })
        }
        parentId = id
      }

      const updatedClicked: PartialTreeFolderNode = {
        ...(clickedFolder as any),
        parentId,
        cached: false,
        nextPagePath: null,
      }

      const newTree: PartialTree = [
        { type: 'root', id: rootId, cached: false, nextPagePath: null },
        ...ancestorNodes,
        updatedClicked,
      ]

      this.plugin.setPluginState({
        partialTree: newTree,
        currentFolderId: updatedClicked.id,
        // Keep the user's query visible; clearing the box will return to root
      })
      // Repoint our local clickedFolder reference to the updated node
      clickedFolder = updatedClicked as unknown as PartialTreeFolder
    }
    // Defensive: if the folder isn't part of the current tree (e.g. just exited search mode),
    // fall back to the root node so we can rebuild the tree.
    if (!clickedFolder) {
      clickedFolder = partialTree.find((i) => i.type === 'root') as
        | PartialTreeFolder
        | undefined
    }
    if (!clickedFolder) {
      // As a last resort, reset and try again
      this.resetPluginState()
      clickedFolder = this.plugin
        .getPluginState()
        .partialTree.find((i) => i.type === 'root') as PartialTreeFolder
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
        // Use the latest tree in case we reconstructed it above
        this.plugin.getPluginState().partialTree,
        currentItems,
        clickedFolder,
        currentPagePath,
        this.validateSingleFile,
      )

      this.plugin.setPluginState({
        partialTree: newPartialTree,
        currentFolderId: folderId,
        // In server-search mode, preserve the query; in client mode, clear it so
        // we don't filter the newly opened folder's children away.
        searchString:
          (this.opts.useServerSearch ?? false) ? prevSearchString : '',
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

  toggleSearchMode(): void {
    const prev = this.plugin.getPluginState().searchString || ''
    const next = !(this.opts.useServerSearch ?? false)
    this.opts.useServerSearch = next
    // Visible console log for developers
    // eslint-disable-next-line no-console
    console.log(`[ProviderViews] Search mode: ${next ? 'server' : 'client'}`)

    if (!next) {
      // Leaving server-search mode: reset to normal tree and preserve the text for client filter
      this.plugin.setPluginState(getDefaultState(this.plugin.rootFolderId))
      void this.openFolder(this.plugin.rootFolderId)
      this.plugin.setPluginState({ searchString: prev })
      return
    }
    // Entering server-search mode: if we already have a query, execute it
    if (prev.trim() !== '') {
      void this.search()
    } else {
      // Ensure we are at a clean root in server mode
      this.plugin.setPluginState(getDefaultState(this.plugin.rootFolderId))
      void this.openFolder(this.plugin.rootFolderId)
    }
  }

  async handleScroll(event: Event): Promise<void> {
    const { partialTree, currentFolderId } = this.plugin.getPluginState()

    const root = partialTree.find((i) => i.type === 'root') as
      | PartialTreeFolder
      | undefined

    // When in search mode, paginate using root.nextPagePath and append flat items
    if (
      this.#isSearchMode() &&
      shouldHandleScroll(event) &&
      !this.isHandlingScroll &&
      root?.nextPagePath
    ) {
      this.isHandlingScroll = true
      await this.#withAbort(async (signal) => {
        // Parse cursor from nextPagePath (e.g. "?cursor=abc")
        const params = new URLSearchParams(
          (root.nextPagePath || '').replace(/^\?/, ''),
        )
        const cursor = params.get('cursor') || ''
        const resp = await (this.provider.search?.('', {
          signal,
          qs: cursor ? { cursor } : undefined,
        }) ?? this.provider.list(root.nextPagePath!, { signal }))
        const { nextPagePath, items } = resp as {
          nextPagePath: string | null
          items: CompanionFile[]
        }

        const newRoot = { ...(root as any), nextPagePath }
        const oldItems = partialTree.filter((i) => i.type !== 'root')
        const appended = items.map((item: CompanionFile) => {
          if (item.isFolder) {
            return {
              type: 'folder',
              id: item.requestPath,
              cached: false,
              nextPagePath: null,
              status: 'unchecked',
              parentId: root.id,
              data: item,
            } as PartialTreeFolderNode
          }
          return {
            type: 'file',
            id: item.requestPath,
            status: 'unchecked',
            parentId: root.id,
            data: item,
          } as PartialTreeFile
        })
        this.plugin.setPluginState({
          partialTree: [newRoot as any, ...oldItems, ...appended],
        })
      }).catch(handleError(this.plugin.uppy))
      this.isHandlingScroll = false
      return
    }

    // Default: folder-based infinite scroll
    const currentFolder = partialTree.find(
      (i) => i.id === currentFolderId,
    ) as PartialTreeFolder
    if (
      shouldHandleScroll(event) &&
      !this.isHandlingScroll &&
      currentFolder?.nextPagePath
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

    // Server-side search mode: the partialTree already holds flat, filtered results
    if (this.#isSearchMode()) return inThisFolder

    // Client-side filter mode: filter items in the current folder only
    if (!this.opts.useServerSearch && searchString?.trim()) {
      const q = searchString.toLowerCase()
      return inThisFolder.filter((item) =>
        (item.data.name ?? this.plugin.uppy.i18n('unnamed'))
          .toLowerCase()
          .includes(q),
      )
    }
    return inThisFolder
  }

  getBreadcrumbs = (): PartialTreeFolder[] => {
    const { partialTree, currentFolderId } = this.plugin.getPluginState()
    // Only alter breadcrumbs in server-search mode with synthetic root
    const root = partialTree.find((i) => i.type === 'root') as
      | PartialTreeFolder
      | undefined
    const idForBreadcrumbs = this.opts.useServerSearch
      ? (currentFolderId ?? root?.id ?? null)
      : currentFolderId
    return getBreadcrumbs(partialTree, idForBreadcrumbs)
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

    const { partialTree, username, searchString, currentFolderId } =
      this.plugin.getPluginState()
    // Hide breadcrumbs only when we're at the synthetic search root id in server-search mode.
    const showBreadcrumbs =
      opts.showBreadcrumbs &&
      (!this.opts.useServerSearch || currentFolderId !== '__search__')
    const breadcrumbs = showBreadcrumbs ? this.getBreadcrumbs() : []

    return (
      <div
        className={classNames(
          'uppy-ProviderBrowser',
          `uppy-ProviderBrowser-viewType--${opts.viewType}`,
        )}
      >
        <Header<M, B>
          showBreadcrumbs={showBreadcrumbs}
          openFolder={this.openFolder}
          breadcrumbs={breadcrumbs}
          pluginIcon={pluginIcon}
          title={this.plugin.title}
          logout={this.logout}
          username={username}
          i18n={i18n}
        />

        {opts.showFilter && (
          <div
            className="uppy-ProviderBrowser-searchModeToggle"
            style={{ padding: '4px 12px' }}
          >
            <label
              className="uppy-ProviderBrowser-searchModeToggleLabel"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <input
                type="checkbox"
                checked={this.opts.useServerSearch ?? false}
                onChange={this.toggleSearchMode}
              />
              <span style={{ fontSize: 12 }}>Server-side search</span>
            </label>
          </div>
        )}

        {opts.showFilter && (
          <SearchInput
            searchString={searchString}
            setSearchString={this.setSearchString}
            submitSearchString={this.search}
            inputLabel={i18n('filter')}
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
