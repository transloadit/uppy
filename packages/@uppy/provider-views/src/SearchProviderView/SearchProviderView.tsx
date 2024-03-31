import { h } from 'preact'

import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { PartialTree, StatusInPartialTree, UnknownSearchProviderPlugin } from '@uppy/core/lib/Uppy.ts'
import type { DefinePluginOpts } from '@uppy/core/lib/BasePlugin.ts'
import type Uppy from '@uppy/core'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import SearchFilterInput from '../SearchFilterInput.tsx'
import Browser from '../Browser.tsx'
import CloseWrapper from '../CloseWrapper.ts'
import View, { type ViewOptions } from '../View.ts'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../../package.json'

const defaultState = {
  isInputMode: true,
  breadcrumbs: [],
  filterInput: '',
  searchTerm: null,
  partialTree: [],
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

  #updateFilesAndInputMode(res: Res, files: PartialTree): void {
    this.nextPageQuery = res.nextPageQuery
    const { partialTree } = this.plugin.getPluginState()
    const newPartialTree : PartialTree = [
      ...partialTree,
      ...res.items.map((item) => ({
        id: item.requestPath,
        cached: null,
        status: "unchecked" as StatusInPartialTree,
        parentId: null,
        data: item
      }))
    ]
    this.plugin.setPluginState({
      partialTree: newPartialTree,
      isInputMode: false,
      searchTerm: res.searchedFor,
    })
  }

  async search(query: string): Promise<void> {
    const { searchTerm } = this.plugin.getPluginState()
    if (query && query === searchTerm) {
      // no need to search again as this is the same as the previous search
      return
    }

    this.setLoading(true)
    try {
      const res = await this.provider.search<Res>(query)
      this.#updateFilesAndInputMode(res, [])
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
      searchTerm: null,
    })
  }

  async handleScroll(event: Event): Promise<void> {
    const query = this.nextPageQuery || null

    if (this.shouldHandleScroll(event) && query) {
      this.isHandlingScroll = true

      try {
        const { partialTree, searchTerm } = this.plugin.getPluginState()
        const response = await this.provider.search<Res>(searchTerm!, query)

        this.#updateFilesAndInputMode(response, partialTree)
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
    this.plugin.uppy.addFiles(
      partialTree.map((file) => this.getTagFile(file.data)),
    )
    this.resetPluginState()
  }

  render(
    state: unknown,
    viewOptions: Omit<ViewOptions<M, B, PluginType>, 'provider'> = {},
  ): JSX.Element {
    const { didFirstRender, isInputMode, searchTerm } =
      this.plugin.getPluginState()
    const { i18n } = this.plugin.uppy

    if (!didFirstRender) {
      this.preFirstRender()
    }

    const targetViewOptions = { ...this.opts, ...viewOptions }
    const { loading, partialTree, currentFolderId } =
      this.plugin.getPluginState()
    const { filterItems, recordShiftKeyPress } = this

    const displayedPartialTree = filterItems(partialTree.filter((item) => item.parentId === currentFolderId))

    const browserProps = {
      toggleCheckbox: this.toggleCheckbox.bind(this),
      recordShiftKeyPress,
      currentSelection: partialTree.filter((item) => item.status === "checked"),
      displayedPartialTree,
      handleScroll: this.handleScroll,
      done: this.donePicking,
      cancel: this.cancelPicking,
      getFolder: () => {},

      // For SearchFilterInput component
      showSearchFilter: targetViewOptions.showFilter,
      search: this.search,
      clearSearch: this.clearSearch,
      searchTerm,
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
      uppyFiles: this.plugin.uppy.getFiles(),
      validateRestrictions: (
        ...args: Parameters<Uppy<M, B>['validateRestrictions']>
      ) => this.plugin.uppy.validateRestrictions(...args),
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
