import { h } from 'preact'

import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { PartialTree, PartialTreeFile, PartialTreeFolderNode, PartialTreeFolderRoot, UnknownSearchProviderPlugin, UnknownSearchProviderPluginState } from '@uppy/core/lib/Uppy.ts'
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

  constructor(
    plugin: UnknownSearchProviderPlugin<M, B>,
    opts: ViewOptions<M, B, PluginType>,
  ) {
    super(plugin, { ...defaultOptions, ...opts })

    this.setSearchString = this.setSearchString.bind(this)
    this.search = this.search.bind(this)
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

  async search(): Promise<void> {
    const { searchString } = this.plugin.getPluginState()
    if (searchString === '') return

    this.setLoading(true)
    try {
      const response = await this.provider.search<Res>(searchString)

      const newPartialTree : PartialTree = [
        {
          type: 'root',
          id: null,
          cached: false,
          nextPagePath: response.nextPageQuery
        },
        ...response.items.map((item) => ({
          type: 'file',
          id: item.requestPath,
          status: 'unchecked',
          parentId: null,
          data: item
        }) as PartialTreeFile)
      ]
      this.plugin.setPluginState({
        partialTree: newPartialTree,
        isInputMode: false
      })
    } catch (err) {
      this.handleError(err)
    }
    this.setLoading(false)
  }

  async handleScroll(event: Event): Promise<void> {
    const { partialTree, searchString } = this.plugin.getPluginState()
    const root = partialTree.find((i) => i.type === 'root') as PartialTreeFolderRoot

    if (this.shouldHandleScroll(event) && root.nextPagePath) {
      this.isHandlingScroll = true
      try {
        const response = await this.provider.search<Res>(searchString, root.nextPagePath)

        const newRoot : PartialTreeFolderRoot = {
          ...root,
          nextPagePath: response.nextPageQuery
        }
        const oldItems = partialTree.filter((i) => i.type !== 'root')

        const newPartialTree : PartialTree = [
          newRoot,
          ...oldItems,
          ...response.items.map((item) => ({
            type: 'file',
            id: item.requestPath,
            status: 'unchecked',
            parentId: null,
            data: item
          }) as PartialTreeFile)
        ]
        this.plugin.setPluginState({ partialTree: newPartialTree })
      } catch (error) {
        this.handleError(error)
      }
      this.isHandlingScroll = false
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

    const { partialTree, currentFolderId } = this.plugin.getPluginState()

    const displayedPartialTree = partialTree.filter((item) => item.type !== 'root' && item.parentId === currentFolderId) as (PartialTreeFolderNode | PartialTreeFile)[]
    const newPartialTree = PartialTreeUtils.afterToggleCheckbox(partialTree, displayedPartialTree, ourItem, this.validateRestrictions, this.isShiftKeyPressed, this.lastCheckbox)

    this.plugin.setPluginState({ partialTree: newPartialTree })
    this.lastCheckbox = ourItem.id!
  }

  setSearchString = (searchString: string) => {
    this.plugin.setPluginState({ searchString })
    if (searchString === '') {
      this.plugin.setPluginState({ partialTree: [] })
    }
  }

  render(
    state: unknown,
    viewOptions: Omit<ViewOptions<M, B, PluginType>, 'provider'> = {},
  ): JSX.Element {
    const { isInputMode, searchString, loading, partialTree, currentFolderId } =
      this.plugin.getPluginState()
    const { i18n } = this.plugin.uppy
    const targetViewOptions = { ...this.opts, ...viewOptions }

    if (isInputMode) {
      return (
        <CloseWrapper onUnmount={this.resetPluginState}>
          <SearchFilterInput
            searchString={searchString}
            setSearchString={this.setSearchString}
            submitSearchString={this.search}

            inputLabel={i18n('enterTextToSearch')}
            buttonLabel={i18n('searchImages')}
            wrapperClassName="uppy-SearchProvider"
            inputClassName="uppy-c-textInput uppy-SearchProvider-input"
            buttonCSSClassName="uppy-SearchProvider-searchButton"
            showButton
          />
        </CloseWrapper>
      )
    }

    return (
      <CloseWrapper onUnmount={this.resetPluginState}>
        <Browser
          toggleCheckbox={this.toggleCheckbox.bind(this)}
          displayedPartialTree={partialTree.filter((item) => item.type !== 'root' && item.parentId === currentFolderId) as (PartialTreeFolderNode | PartialTreeFile)[]}
          nOfSelectedFiles={getNOfSelectedFiles(partialTree)}
          handleScroll={this.handleScroll}
          done={this.donePicking}
          cancel={this.cancelPicking}
          getFolder={() => {}}
          showSearchFilter={targetViewOptions.showFilter}
          search={this.search}
          searchString={searchString}
          setSearchString={this.setSearchString}
          submitSearchString={this.search}
          searchInputLabel={i18n('search')}
          clearSearchLabel={i18n('resetSearch')}
          noResultsLabel={i18n('noSearchResults')}
          viewType={targetViewOptions.viewType}
          showTitles={targetViewOptions.showTitles}
          isLoading={loading}
          showBreadcrumbs={targetViewOptions.showBreadcrumbs}
          i18n={i18n}
          validateRestrictions={this.validateRestrictions}
        />
      </CloseWrapper>
    )
  }
}
