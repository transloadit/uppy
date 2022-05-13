import { h } from 'preact'

import SearchInput from './InputView.jsx'
import Browser from '../Browser.jsx'
import LoaderView from '../Loader.jsx'
import Header from './Header.jsx'
import CloseWrapper from '../CloseWrapper.js'
import View from '../View.js'

import packageJson from '../../package.json'

/**
 * Class to easily generate generic views for Provider plugins
 */
export default class SearchProviderView extends View {
  static VERSION = packageJson.version

  /**
   * @param {object} plugin instance of the plugin
   * @param {object} opts
   */
  constructor (plugin, opts) {
    super(plugin, opts)

    // set default options
    const defaultOptions = {
      viewType: 'grid',
      showTitles: false,
      showFilter: false,
      showBreadcrumbs: false,
    }

    // merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    // Logic
    this.search = this.search.bind(this)
    this.triggerSearchInput = this.triggerSearchInput.bind(this)
    this.addFile = this.addFile.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.donePicking = this.donePicking.bind(this)

    // Visual
    this.render = this.render.bind(this)

    // Set default state for the plugin
    this.plugin.setPluginState({
      isInputMode: true,
      files: [],
      folders: [],
      directories: [],
      filterInput: '',
      currentSelection: [],
      searchTerm: null,
    })
  }

  // eslint-disable-next-line class-methods-use-this
  tearDown () {
    // Nothing.
  }

  clearSelection () {
    this.plugin.setPluginState({
      currentSelection: [],
      isInputMode: true,
      files: [],
      searchTerm: null,
    })
  }

  #updateFilesAndInputMode (res, files) {
    this.nextPageQuery = res.nextPageQuery
    res.items.forEach((item) => { files.push(item) })
    this.plugin.setPluginState({
      isInputMode: false,
      files,
      searchTerm: res.searchedFor,
    })
  }

  search (query) {
    const { searchTerm } = this.plugin.getPluginState()
    if (query && query === searchTerm) {
      // no need to search again as this is the same as the previous search
      return undefined
    }

    return this.sharedHandler.loaderWrapper(
      this.provider.search(query),
      (res) => {
        this.#updateFilesAndInputMode(res, [])
      },
      this.handleError,
    )
  }

  triggerSearchInput () {
    this.plugin.setPluginState({ isInputMode: true })
  }

  async handleScroll (event) {
    const query = this.nextPageQuery || null

    if (this.shouldHandleScroll(event) && query) {
      this.isHandlingScroll = true

      try {
        const { files, searchTerm } = this.plugin.getPluginState()
        const response = await this.provider.search(searchTerm, query)

        this.#updateFilesAndInputMode(response, files)
      } catch (error) {
        this.handleError(error)
      } finally {
        this.isHandlingScroll = false
      }
    }
  }

  donePicking () {
    const { currentSelection } = this.plugin.getPluginState()
    const promises = currentSelection.map((file) => this.addFile(file))

    this.sharedHandler.loaderWrapper(Promise.all(promises), () => {
      this.clearSelection()
    }, () => {})
  }

  render (state, viewOptions = {}) {
    const { didFirstRender, isInputMode, searchTerm } = this.plugin.getPluginState()

    if (!didFirstRender) {
      this.preFirstRender()
    }

    const targetViewOptions = { ...this.opts, ...viewOptions }
    const { files, folders, filterInput, loading, currentSelection } = this.plugin.getPluginState()
    const { isChecked, toggleCheckbox, filterItems } = this.sharedHandler
    const hasInput = filterInput !== ''

    const browserProps = {
      isChecked,
      toggleCheckbox,
      currentSelection,
      files: hasInput ? filterItems(files) : files,
      folders: hasInput ? filterItems(folders) : folders,
      handleScroll: this.handleScroll,
      done: this.donePicking,
      cancel: this.cancelPicking,
      headerComponent: Header({
        search: this.search,
        i18n: this.plugin.uppy.i18n,
        searchTerm,
      }),
      title: this.plugin.title,
      viewType: targetViewOptions.viewType,
      showTitles: targetViewOptions.showTitles,
      showFilter: targetViewOptions.showFilter,
      showBreadcrumbs: targetViewOptions.showBreadcrumbs,
      pluginIcon: this.plugin.icon,
      i18n: this.plugin.uppy.i18n,
      uppyFiles: this.plugin.uppy.getFiles(),
      validateRestrictions: (...args) => this.plugin.uppy.validateRestrictions(...args),
    }

    if (loading) {
      return (
        <CloseWrapper onUnmount={this.clearSelection}>
          <LoaderView i18n={this.plugin.uppy.i18n} />
        </CloseWrapper>
      )
    }

    if (isInputMode) {
      return (
        <CloseWrapper onUnmount={this.clearSelection}>
          <SearchInput
            search={this.search}
            i18n={this.plugin.uppy.i18n}
          />
        </CloseWrapper>
      )
    }

    return (
      <CloseWrapper onUnmount={this.clearSelection}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Browser {...browserProps} />
      </CloseWrapper>
    )
  }
}
