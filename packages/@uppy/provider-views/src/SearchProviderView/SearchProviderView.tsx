import { h } from 'preact'

import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { PartialTree, PartialTreeFile, PartialTreeFolderNode, UnknownSearchProviderPlugin, UnknownSearchProviderPluginState } from '@uppy/core/lib/Uppy.ts'
import type { DefinePluginOpts } from '@uppy/core/lib/BasePlugin.ts'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import SearchFilterInput from '../SearchFilterInput.tsx'
import Browser from '../Browser.tsx'
import CloseWrapper from '../CloseWrapper.ts'
import View, { type ViewOptions } from '../View.ts'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../../package.json'
import getTagFile from '../utils/getTagFile.ts'
import getNOfSelectedFiles from '../utils/getNOfSelectedFiles.ts'
import PartialTreeUtils from '../utils/PartialTreeUtils.ts'

const defaultState : Partial<UnknownSearchProviderPluginState> = {
  isInputMode: true,
  searchString: '',
  partialTree: [
    {
      type: 'root',
      id: null,
      cached: false,
      nextPagePath: null
    }
  ],
  currentFolderId: null,
}

type PluginType = 'SearchProvider'

const defaultOptions = {
  viewType: 'grid',
  showTitles: true,
  showFilter: true,
  showBreadcrumbs: true,
}

type Opts<
  M extends Meta,
  B extends Body,
  T extends PluginType,
> = DefinePluginOpts<ViewOptions<M, B, T>, keyof typeof defaultOptions>

type Res = {
  items: CompanionFile[]
  nextPageQuery: string | null
  searchedFor: string
}

/**
 * SearchProviderView, used for Unsplash and future image search providers.
 * Extends generic View, shared with regular providers like Google Drive and Instagram.
 */
export default class SearchProviderView<
  M extends Meta,
  B extends Body,
> extends View<M, B, PluginType, Opts<M, B, PluginType>> {
  static VERSION = packageJson.version

  nextPageQuery: string | null = null

  constructor(
    plugin: UnknownSearchProviderPlugin<M, B>,
    opts: ViewOptions<M, B, PluginType>,
  ) {
    super(plugin, { ...defaultOptions, ...opts })

    this.search = this.search.bind(this)
    this.clearSearch = this.clearSearch.bind(this)
    this.resetPluginState = this.resetPluginState.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.donePicking = this.donePicking.bind(this)

    this.render = this.render.bind(this)

    this.plugin.setPluginState(defaultState)

    this.registerRequestClient()
  }

  // eslint-disable-next-line class-methods-use-this
  tearDown(): void {
    // Nothing.
  }

  resetPluginState(): void {
    this.plugin.setPluginState(defaultState)
  }

  #updateFilesAndInputMode(res: Res): void {
    this.nextPageQuery = res.nextPageQuery
    const { partialTree } = this.plugin.getPluginState()
    const newPartialTree : PartialTree = [
      ...partialTree,
      ...res.items.map((item) => ({
        type: 'file',
        id: item.requestPath,
        status: 'unchecked',
        parentId: null,
        data: item
      }) as PartialTreeFile)
    ]
    this.plugin.setPluginState({
      partialTree: newPartialTree,
      isInputMode: false,
      searchString: res.searchedFor,
    })
  }

  async search(query: string): Promise<void> {
    const { searchString } = this.plugin.getPluginState()
    if (query && query === searchString) {
      // no need to search again as this is the same as the previous search
      return
    }

    this.setLoading(true)
    try {
      const res = await this.provider.search<Res>(query)
      this.#updateFilesAndInputMode(res)
    } catch (err) {
      this.handleError(err)
    } finally {
      this.setLoading(false)
    }
  }

  clearSearch(): void {
    this.plugin.setPluginState({
      partialTree: [],
      currentFolderId: null,
      searchString: '',
    })
  }

  async handleScroll(event: Event): Promise<void> {
    const query = this.nextPageQuery || null

    if (this.shouldHandleScroll(event) && query) {
      this.isHandlingScroll = true

      try {
        const { searchString } = this.plugin.getPluginState()
        const response = await this.provider.search<Res>(searchString, query)

        this.#updateFilesAndInputMode(response)
      } catch (error) {
        this.handleError(error)
      } finally {
        this.isHandlingScroll = false
      }
    }
  }

  donePicking(): void {
    const { partialTree } = this.plugin.getPluginState()
    this.plugin.uppy.log('Adding remote search provider files')
    const files = partialTree.filter((i) => i.type !== 'root' && i.status === 'checked') as PartialTreeFile[]
    const tagFiles = files.map((file) =>
      getTagFile<M>(file.data, this.plugin.id, this.provider, this.plugin.opts.companionUrl)
    )
    this.plugin.uppy.addFiles(tagFiles)

    this.resetPluginState()
  }

  toggleCheckbox(e: Event, ourItem: PartialTreeFolderNode | PartialTreeFile) {
    e.stopPropagation()
    e.preventDefault()
    // Prevent shift-clicking from highlighting file names
    // (https://stackoverflow.com/a/1527797/3192470)
    document.getSelection()?.removeAllRanges()

    const { partialTree, currentFolderId, searchString } = this.plugin.getPluginState()

    const displayedPartialTree = partialTree.filter((item) => item.type !== 'root' && item.parentId === currentFolderId) as (PartialTreeFolderNode | PartialTreeFile)[]
    const newPartialTree = PartialTreeUtils.afterToggleCheckbox(partialTree, displayedPartialTree, ourItem, this.validateRestrictions, this.isShiftKeyPressed, this.lastCheckbox)

    this.plugin.setPluginState({ partialTree: newPartialTree })
    this.lastCheckbox = ourItem.id!
  }

  render(
    state: unknown,
    viewOptions: Omit<ViewOptions<M, B, PluginType>, 'provider'> = {},
  ): JSX.Element {
    const { isInputMode, searchString } =
      this.plugin.getPluginState()
    const { i18n } = this.plugin.uppy

    const targetViewOptions = { ...this.opts, ...viewOptions }
    const { loading, partialTree, currentFolderId } =
      this.plugin.getPluginState()

    const browserProps = {
      toggleCheckbox: this.toggleCheckbox.bind(this),
      displayedPartialTree: partialTree.filter((item) => item.type !== 'root' && item.parentId === currentFolderId) as (PartialTreeFolderNode | PartialTreeFile)[],
      nOfSelectedFiles: getNOfSelectedFiles(partialTree),
      currentFolderId,
      handleScroll: this.handleScroll,
      done: this.donePicking,
      cancel: this.cancelPicking,
      getFolder: () => {},

      // For SearchFilterInput component
      showSearchFilter: targetViewOptions.showFilter,
      search: this.search,
      clearSearch: this.clearSearch,
      searchString,
      searchOnInput: false,
      searchInputLabel: i18n('search'),
      clearSearchLabel: i18n('resetSearch'),

      noResultsLabel: i18n('noSearchResults'),
      title: this.plugin.title,
      viewType: targetViewOptions.viewType,
      showTitles: targetViewOptions.showTitles,
      showFilter: targetViewOptions.showFilter,
      isLoading: loading,
      showBreadcrumbs: targetViewOptions.showBreadcrumbs,
      pluginIcon: this.plugin.icon,
      i18n,
      validateRestrictions: this.validateRestrictions,
    }

    if (isInputMode) {
      return (
        <CloseWrapper onUnmount={this.resetPluginState}>
          <div className="uppy-SearchProvider">
            <SearchFilterInput
              search={this.search}
              inputLabel={i18n('enterTextToSearch')}
              buttonLabel={i18n('searchImages')}
              inputClassName="uppy-c-textInput uppy-SearchProvider-input"
              buttonCSSClassName="uppy-SearchProvider-searchButton"
              showButton
            />
          </div>
        </CloseWrapper>
      )
    }

    return (
      <CloseWrapper onUnmount={this.resetPluginState}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Browser {...browserProps} />
      </CloseWrapper>
    )
  }
}
