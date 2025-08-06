import type {
  Body,
  DefinePluginOpts,
  Meta,
  PartialTree,
  PartialTreeFile,
  PartialTreeFolderNode,
  PartialTreeFolderRoot,
  UnknownSearchProviderPlugin,
  UnknownSearchProviderPluginState,
} from '@uppy/core'
import type { ValidateableFile } from '@uppy/core/lib/Restricter.js'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'
import classNames from 'classnames'
import { h } from 'preact'
import packageJson from '../../package.json' with { type: 'json' }
import Browser from '../Browser.js'
import FooterActions from '../FooterActions.js'
import SearchInput from '../SearchInput.js'
import addFiles from '../utils/addFiles.js'
import getClickedRange from '../utils/getClickedRange.js'
import handleError from '../utils/handleError.js'
import getCheckedFilesWithPaths from '../utils/PartialTreeUtils/getCheckedFilesWithPaths.js'
import PartialTreeUtils from '../utils/PartialTreeUtils/index.js'
import shouldHandleScroll from '../utils/shouldHandleScroll.js'

const defaultState: UnknownSearchProviderPluginState = {
  loading: false,
  searchString: '',
  partialTree: [
    {
      type: 'root',
      id: null,
      cached: false,
      nextPagePath: null,
    },
  ],
  currentFolderId: null,
  isInputMode: true,
}

interface Opts<M extends Meta, B extends Body> {
  provider: UnknownSearchProviderPlugin<M, B>['provider']
  viewType?: 'list' | 'grid' | 'unsplash'
  showTitles?: boolean
  showFilter?: boolean
  utmSource?: string
}

type RenderOpts<M extends Meta, B extends Body> = Omit<Opts<M, B>, 'provider'>

type Res = {
  items: CompanionFile[]
  nextPageQuery: string | null
  searchedFor: string
}

const defaultOptions = {
  viewType: 'grid' as const,
  showTitles: true,
  showFilter: true,
  utmSource: 'Companion',
}

/**
 * SearchProviderView, used for Unsplash and future image search providers.
 * Extends generic View, shared with regular providers like Google Drive and Instagram.
 */
export default class SearchProviderView<M extends Meta, B extends Body> {
  static VERSION = packageJson.version

  plugin: UnknownSearchProviderPlugin<M, B>

  provider: UnknownSearchProviderPlugin<M, B>['provider']

  opts: DefinePluginOpts<Opts<M, B>, keyof typeof defaultOptions>

  isHandlingScroll: boolean = false

  lastCheckbox: string | null = null

  constructor(plugin: UnknownSearchProviderPlugin<M, B>, opts: Opts<M, B>) {
    this.plugin = plugin
    this.provider = opts.provider
    this.opts = { ...defaultOptions, ...opts }

    this.setSearchString = this.setSearchString.bind(this)
    this.search = this.search.bind(this)
    this.resetPluginState = this.resetPluginState.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.donePicking = this.donePicking.bind(this)
    this.cancelSelection = this.cancelSelection.bind(this)
    this.toggleCheckbox = this.toggleCheckbox.bind(this)

    this.render = this.render.bind(this)

    // Set default state for the plugin
    this.resetPluginState()

    // @ts-expect-error this should be typed in @uppy/dashboard.
    this.plugin.uppy.on('dashboard:close-panel', this.resetPluginState)

    this.plugin.uppy.registerRequestClient(
      this.provider.provider,
      this.provider,
    )
  }

  tearDown(): void {
    // Nothing.
  }

  setLoading(loading: boolean | string): void {
    this.plugin.setPluginState({ loading })
  }

  resetPluginState(): void {
    this.plugin.setPluginState(defaultState)
  }

  cancelSelection(): void {
    const { partialTree } = this.plugin.getPluginState()
    const newPartialTree: PartialTree = partialTree.map((item) =>
      item.type === 'root' ? item : { ...item, status: 'unchecked' },
    )
    this.plugin.setPluginState({ partialTree: newPartialTree })
  }

  async search(): Promise<void> {
    const { searchString } = this.plugin.getPluginState()
    if (searchString === '') return

    this.setLoading(true)
    try {
      const response = await this.provider.search<Res>(searchString)

      const newPartialTree: PartialTree = [
        {
          type: 'root',
          id: null,
          cached: false,
          nextPagePath: response.nextPageQuery,
        },
        ...response.items.map(
          (item) =>
            ({
              type: 'file',
              id: item.requestPath,
              status: 'unchecked',
              parentId: null,
              data: item,
            }) as PartialTreeFile,
        ),
      ]
      this.plugin.setPluginState({
        partialTree: newPartialTree,
        isInputMode: false,
      })
    } catch (error) {
      handleError(this.plugin.uppy)(error)
    }
    this.setLoading(false)
  }

  async handleScroll(event: Event): Promise<void> {
    const { partialTree, searchString } = this.plugin.getPluginState()
    const root = partialTree.find(
      (i) => i.type === 'root',
    ) as PartialTreeFolderRoot

    if (
      shouldHandleScroll(event) &&
      !this.isHandlingScroll &&
      root.nextPagePath
    ) {
      this.isHandlingScroll = true
      try {
        const response = await this.provider.search<Res>(
          searchString,
          root.nextPagePath,
        )

        const newRoot: PartialTreeFolderRoot = {
          ...root,
          nextPagePath: response.nextPageQuery,
        }
        const oldItems = partialTree.filter((i) => i.type !== 'root')

        const newPartialTree: PartialTree = [
          newRoot,
          ...oldItems,
          ...response.items.map(
            (item) =>
              ({
                type: 'file',
                id: item.requestPath,
                status: 'unchecked',
                parentId: null,
                data: item,
              }) as PartialTreeFile,
          ),
        ]
        this.plugin.setPluginState({ partialTree: newPartialTree })
      } catch (error) {
        handleError(this.plugin.uppy)(error)
      }
      this.isHandlingScroll = false
    }
  }

  async donePicking(): Promise<void> {
    const { partialTree } = this.plugin.getPluginState()

    // 1. Add files
    const companionFiles = getCheckedFilesWithPaths(partialTree)
    addFiles(companionFiles, this.plugin, this.provider)

    // 2. Reset state
    this.resetPluginState()
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

  validateSingleFile = (file: CompanionFile): string | null => {
    const companionFile: ValidateableFile<M, B> = remoteFileObjToLocal(file)
    const result = this.plugin.uppy.validateSingleFile(companionFile)
    return result
  }

  getDisplayedPartialTree = (): (PartialTreeFile | PartialTreeFolderNode)[] => {
    const { partialTree } = this.plugin.getPluginState()
    return partialTree.filter((item) => item.type !== 'root') as (
      | PartialTreeFolderNode
      | PartialTreeFile
    )[]
  }

  setSearchString = (searchString: string) => {
    this.plugin.setPluginState({ searchString })
    if (searchString === '') {
      this.plugin.setPluginState({ partialTree: [] })
    }
  }

  validateAggregateRestrictions = (partialTree: PartialTree) => {
    const checkedFiles = partialTree.filter(
      (item) => item.type === 'file' && item.status === 'checked',
    ) as PartialTreeFile[]
    const uppyFiles = checkedFiles.map((file) => file.data)
    return this.plugin.uppy.validateAggregateRestrictions(uppyFiles)
  }

  render(state: unknown, viewOptions: RenderOpts<M, B> = {}): h.JSX.Element {
    const { isInputMode, searchString, loading, partialTree } =
      this.plugin.getPluginState()
    const { i18n } = this.plugin.uppy
    const opts = { ...this.opts, ...viewOptions }

    if (isInputMode) {
      return (
        <SearchInput
          searchString={searchString}
          setSearchString={this.setSearchString}
          submitSearchString={this.search}
          inputLabel={i18n('enterTextToSearch')}
          buttonLabel={i18n('searchImages')}
          wrapperClassName="uppy-SearchProvider"
          inputClassName="uppy-c-textInput uppy-SearchProvider-input"
          showButton
          buttonCSSClassName="uppy-SearchProvider-searchButton"
        />
      )
    }

    return (
      <div
        className={classNames(
          'uppy-ProviderBrowser',
          `uppy-ProviderBrowser-viewType--${opts.viewType}`,
        )}
      >
        {opts.showFilter && (
          <SearchInput
            searchString={searchString}
            setSearchString={this.setSearchString}
            submitSearchString={this.search}
            inputLabel={i18n('search')}
            clearSearchLabel={i18n('resetSearch')}
            wrapperClassName="uppy-ProviderBrowser-searchFilter"
            inputClassName="uppy-ProviderBrowser-searchFilterInput"
          />
        )}

        <Browser
          toggleCheckbox={this.toggleCheckbox}
          displayedPartialTree={this.getDisplayedPartialTree()}
          handleScroll={this.handleScroll}
          openFolder={async () => {}}
          noResultsLabel={i18n('noSearchResults')}
          viewType={opts.viewType}
          showTitles={opts.showTitles}
          isLoading={loading}
          i18n={i18n}
          virtualList={false}
          utmSource={this.opts.utmSource}
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
