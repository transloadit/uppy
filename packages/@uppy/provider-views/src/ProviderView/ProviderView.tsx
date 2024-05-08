import { h } from 'preact'

import { getSafeFileId } from '@uppy/utils/lib/generateFileID'

import type {
  UnknownProviderPlugin,
  PartialTreeFolder,
  PartialTreeFolderNode,
  PartialTreeFile,
  UnknownProviderPluginState,
  PartialTreeId,
  PartialTree,
} from '@uppy/core/lib/Uppy.ts'
import type { Body, Meta, TagFile } from '@uppy/utils/lib/UppyFile'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile.ts'
import type Translator from '@uppy/utils/lib/Translator'
import AuthView from './AuthView.tsx'
import Header from './Header.tsx'
import Browser from '../Browser.tsx'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../../package.json'
import PartialTreeUtils from '../utils/PartialTreeUtils'
import getTagFile from '../utils/getTagFile.ts'
import getNOfSelectedFiles from '../utils/PartialTreeUtils/getNOfSelectedFiles.ts'
import shouldHandleScroll from '../utils/shouldHandleScroll.ts'
import handleError from '../utils/handleError.ts'
import validateRestrictions from '../utils/validateRestrictions.ts'
import getClickedRange from '../utils/getClickedRange.ts'

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

const getDefaultState = (rootFolderId: string | null) : UnknownProviderPluginState => ({
  authenticated: undefined, // we don't know yet
  partialTree: [
    {
      type: 'root',
      id: rootFolderId,
      cached: false,
      nextPagePath: null
    }
  ],
  currentFolderId: rootFolderId,
  searchString: '',
  didFirstRender: false,
  username: null,
  loading: false
})

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

interface Opts<M extends Meta, B extends Body> {
  provider: UnknownProviderPlugin<M, B>['provider']
  viewType: 'list' | 'grid'
  showTitles: boolean
  showFilter: boolean
  showBreadcrumbs: boolean
  loadAllFiles: boolean
  renderAuthForm?: (args: {
    pluginName: string
    i18n: Translator['translateArray']
    loading: boolean | string
    onAuth: (authFormData: unknown) => Promise<void>
  }) => JSX.Element
}
type PassedOpts<M extends Meta, B extends Body> = Optional<Opts<M, B>, 'viewType' | 'showTitles' | 'showFilter' | 'showBreadcrumbs' | 'loadAllFiles'>
type DefaultOpts<M extends Meta, B extends Body> = Omit<Opts<M, B>, 'provider'>
type RenderOpts<M extends Meta, B extends Body> = Omit<PassedOpts<M, B>, 'provider'>

/**
 * Class to easily generate generic views for Provider plugins
 */
export default class ProviderView<M extends Meta, B extends Body>{
  static VERSION = packageJson.version

  plugin: UnknownProviderPlugin<M, B>
  provider: UnknownProviderPlugin<M, B>['provider']
  opts: Opts<M, B>

  isHandlingScroll: boolean = false
  lastCheckbox: string | null = null

  constructor(
    plugin: UnknownProviderPlugin<M, B>,
    opts: PassedOpts<M, B>,
  ) {
    this.plugin = plugin
    this.provider = opts.provider

    const defaultOptions : DefaultOpts<M, B> = {
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true,
      loadAllFiles: false,
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

    // @ts-expect-error this should be typed in @uppy/dashboard.
    this.plugin.uppy.on('dashboard:close-panel', this.resetPluginState)

    this.plugin.uppy.registerRequestClient(this.provider.provider, this.provider)
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
    const newPartialTree : PartialTree = partialTree.map((item) =>
      item.type === 'root' ? item : { ...item, status: 'unchecked' }
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

  async openFolder(folderId: string | null): Promise<void> {
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
        this.plugin.setPluginState({ username })

        currentPagePath = nextPagePath
        currentItems = currentItems.concat(items)
        this.setLoading(this.plugin.uppy.i18n('loadedXFiles', { numFiles: items.length }))
      } while (this.opts.loadAllFiles && currentPagePath)

      const newPartialTree = PartialTreeUtils.afterOpenFolder(partialTree, currentItems, clickedFolder, validateRestrictions(this.plugin), currentPagePath)

      this.plugin.setPluginState({
        partialTree: newPartialTree,
        currentFolderId: folderId,
        searchString: ''
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
          authenticated: false
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
    const currentFolder = partialTree.find((i) => i.id === currentFolderId) as PartialTreeFolder
    if (shouldHandleScroll(event) && !this.isHandlingScroll && currentFolder.nextPagePath) {
      this.isHandlingScroll = true
      await this.#withAbort(async (signal) => {
        const { nextPagePath, items } = await this.provider.list(currentFolder.nextPagePath!, { signal })
        const newPartialTree = PartialTreeUtils.afterScrollFolder(partialTree, currentFolderId, items, nextPagePath, validateRestrictions(this.plugin))

        this.plugin.setPluginState({ partialTree: newPartialTree })
      }).catch(handleError(this.plugin.uppy))
      this.isHandlingScroll = false
    }
  }

  async donePicking(): Promise<void> {
    const { partialTree } = this.plugin.getPluginState()
    this.setLoading(true)

    await this.#withAbort(async (signal) => {
      const uppyFiles: CompanionFile[] = await PartialTreeUtils.afterFill(
        partialTree,
        (path: PartialTreeId) => this.provider.list(path, { signal })
      )

      const filesToAdd : TagFile<M>[] = []
      const filesAlreadyAdded : TagFile<M>[] = []
      const filesNotPassingRestrictions : TagFile<M>[] = []
  
      uppyFiles.forEach((uppyFile) => {
        const tagFile = getTagFile<M>(uppyFile, this.plugin.id, this.provider, this.plugin.opts.companionUrl)

        if (validateRestrictions(this.plugin)(uppyFile)) {
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
        // TODO I don't think we need to be showing this - we don't show this info when we're dropping files e.g.
        this.plugin.uppy.info(
          this.plugin.uppy.i18n('addedNumFiles', { numFiles: filesToAdd.length })
        )
      }
      if (filesAlreadyAdded.length > 0) {
        this.plugin.uppy.info(`Not adding ${filesAlreadyAdded.length} files because they already exist`)
      }
      if (filesNotPassingRestrictions.length > 0) {
        this.plugin.uppy.info(`Not adding ${filesNotPassingRestrictions.length} files because they didn't pass restrictions`)
      }
      this.plugin.uppy.addFiles(filesToAdd)
    }).catch(handleError(this.plugin.uppy))

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

  toggleCheckbox(ourItem: PartialTreeFolderNode | PartialTreeFile, isShiftKeyPressed: boolean) {
    const { partialTree } = this.plugin.getPluginState()

    const clickedRange = getClickedRange(ourItem.id, this.getDisplayedPartialTree(), isShiftKeyPressed, this.lastCheckbox)
    const newPartialTree = PartialTreeUtils.afterToggleCheckbox(partialTree, clickedRange, validateRestrictions(this.plugin))

    this.plugin.setPluginState({ partialTree: newPartialTree })
    this.lastCheckbox = ourItem.id
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
    viewOptions: RenderOpts<M, B> = {}
  ): JSX.Element {
    const { didFirstRender } = this.plugin.getPluginState()
    const { i18n } = this.plugin.uppy

    if (!didFirstRender) {
      this.plugin.setPluginState({ didFirstRender: true })
      this.provider.fetchPreAuthToken()
      this.openFolder(this.plugin.rootFolderId)
    }

    const opts : Opts<M, B> = { ...this.opts, ...viewOptions }
    const { authenticated, partialTree, username, searchString, loading } =
      this.plugin.getPluginState()
    const pluginIcon = this.plugin.icon || defaultPickerIcon

    if (authenticated === false) {
      return (
        <AuthView
          pluginName={this.plugin.title}
          pluginIcon={pluginIcon}
          handleAuth={this.handleAuth}
          i18n={this.plugin.uppy.i18nArray}
          renderForm={opts.renderAuthForm}
          loading={loading}
        />
      )
    }

    return <Browser<M, B>
      toggleCheckbox={this.toggleCheckbox}
      displayedPartialTree={this.getDisplayedPartialTree()}
      nOfSelectedFiles={getNOfSelectedFiles(partialTree)}
      openFolder={this.openFolder}
      loadAllFiles={opts.loadAllFiles}

      // For SearchFilterInput component
      showSearchFilter={opts.showFilter}
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
      donePicking={this.donePicking}
      cancelSelection={this.cancelSelection}
      headerComponent={
        <Header<M, B>
          showBreadcrumbs={opts.showBreadcrumbs}
          openFolder={this.openFolder}
          breadcrumbs={this.getBreadcrumbs()}
          pluginIcon={pluginIcon}
          title={this.plugin.title}
          logout={this.logout}
          username={username}
          i18n={i18n}
        />
      }
      viewType={opts.viewType}
      showTitles={opts.showTitles}
      i18n={this.plugin.uppy.i18n}

      validateRestrictions={validateRestrictions(this.plugin)}
      isLoading={loading}
    />
  }
}
