const { h } = require('preact')
const generateFileID = require('@uppy/utils/lib/generateFileID')
const getFileType = require('@uppy/utils/lib/getFileType')
const isPreviewSupported = require('@uppy/utils/lib/isPreviewSupported')
const SearchInput = require('./InputView')
const Browser = require('../Browser')
const LoaderView = require('../Loader')
const Header = require('./Header')
const SharedHandler = require('../SharedHandler')
const CloseWrapper = require('../CloseWrapper')

/**
 * Class to easily generate generic views for Provider plugins
 */
module.exports = class ProviderView {
  static VERSION = require('../../package.json').version

  #isHandlingScroll

  #searchTerm

  #sharedHandler

  /**
   * @param {object} plugin instance of the plugin
   * @param {object} opts
   */
  constructor (plugin, opts) {
    this.plugin = plugin
    this.provider = opts.provider
    this.#sharedHandler = new SharedHandler(plugin)

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
    this.preFirstRender = this.preFirstRender.bind(this)
    this.handleError = this.handleError.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.donePicking = this.donePicking.bind(this)
    this.cancelPicking = this.cancelPicking.bind(this)
    this.clearSelection = this.clearSelection.bind(this)

    // Visual
    this.render = this.render.bind(this)

    this.clearSelection()

    // Set default state for the plugin
    this.plugin.setPluginState({
      isInputMode: true,
      files: [],
      folders: [],
      directories: [],
      filterInput: '',
      isSearchVisible: false,
    })
  }

  tearDown () {
    // Nothing.
  }

  #updateFilesAndInputMode (res, files) {
    this.nextPageQuery = res.nextPageQuery
    this.#searchTerm = res.searchedFor
    res.items.forEach((item) => { files.push(item) })
    this.plugin.setPluginState({ isInputMode: false, files })
  }

  /**
   * Called only the first time the provider view is rendered.
   * Kind of like an init function.
   */
  preFirstRender () {
    this.plugin.setPluginState({ didFirstRender: true })
    this.plugin.onFirstRender()
  }

  search (query) {
    if (query && query === this.#searchTerm) {
      // no need to search again as this is the same as the previous search
      this.plugin.setPluginState({ isInputMode: false })
      return
    }

    return this.#sharedHandler.loaderWrapper(
      this.provider.search(query),
      (res) => {
        this.#updateFilesAndInputMode(res, [])
      },
      this.handleError
    )
  }

  triggerSearchInput () {
    this.plugin.setPluginState({ isInputMode: true })
  }

  // @todo this function should really be a function of the plugin and not the view.
  // maybe we should consider creating a base ProviderPlugin class that has this method
  addFile (file) {
    const tagFile = {
      id: this.providerFileToId(file),
      source: this.plugin.id,
      data: file,
      name: file.name || file.id,
      type: file.mimeType,
      isRemote: true,
      body: {
        fileId: file.id,
      },
      remote: {
        companionUrl: this.plugin.opts.companionUrl,
        url: `${this.provider.fileUrl(file.requestPath)}`,
        body: {
          fileId: file.id,
        },
        providerOptions: { ...this.provider.opts, provider: null },
      },
    }

    const fileType = getFileType(tagFile)
    // TODO Should we just always use the thumbnail URL if it exists?
    if (fileType && isPreviewSupported(fileType)) {
      tagFile.preview = file.thumbnail
    }
    this.plugin.uppy.log('Adding remote file')
    try {
      this.plugin.uppy.addFile(tagFile)
    } catch (err) {
      if (!err.isRestriction) {
        this.plugin.uppy.log(err)
      }
    }
  }

  providerFileToId (file) {
    return generateFileID({
      data: file,
      name: file.name || file.id,
      type: file.mimeType,
    })
  }

  handleError (error) {
    const { uppy } = this.plugin
    uppy.log(error.toString())
    const message = uppy.i18n('companionError')
    uppy.info({ message, details: error.toString() }, 'error', 5000)
  }

  handleScroll (e) {
    const scrollPos = e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight)
    const query = this.nextPageQuery || null

    if (scrollPos < 50 && query && !this.#isHandlingScroll) {
      this.provider.search(this.#searchTerm, query)
        .then((res) => {
          const { files } = this.plugin.getPluginState()
          this.#updateFilesAndInputMode(res, files)
        }).catch(this.handleError)
        .then(() => { this.#isHandlingScroll = false }) // always called

      this.#isHandlingScroll = true
    }
  }

  donePicking () {
    const { currentSelection } = this.plugin.getPluginState()
    const promises = currentSelection.map((file) => this.addFile(file))

    this.#sharedHandler.loaderWrapper(Promise.all(promises), () => {
      this.clearSelection()
    }, () => {})
  }

  cancelPicking () {
    this.clearSelection()

    const dashboard = this.plugin.uppy.getPlugin('Dashboard')
    if (dashboard) dashboard.hideAllPanels()
  }

  clearSelection () {
    this.plugin.setPluginState({ currentSelection: [] })
  }

  render (state, viewOptions = {}) {
    const { didFirstRender, isInputMode } = this.plugin.getPluginState()
    if (!didFirstRender) {
      this.preFirstRender()
    }

    // reload pluginState for "loading" attribute because it might
    // have changed above.
    if (this.plugin.getPluginState().loading) {
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

    const targetViewOptions = { ...this.opts, ...viewOptions }
    const browserProps = {
      ...this.plugin.getPluginState(),
      isChecked: this.#sharedHandler.isChecked,
      toggleCheckbox: this.#sharedHandler.toggleCheckbox,
      handleScroll: this.handleScroll,
      done: this.donePicking,
      cancel: this.cancelPicking,
      headerComponent: Header({
        triggerSearchInput: this.triggerSearchInput,
        i18n: this.plugin.uppy.i18n,
      }),
      title: this.plugin.title,
      viewType: targetViewOptions.viewType,
      showTitles: targetViewOptions.showTitles,
      showFilter: targetViewOptions.showFilter,
      showBreadcrumbs: targetViewOptions.showBreadcrumbs,
      pluginIcon: this.plugin.icon,
      i18n: this.plugin.uppy.i18n,
      uppyFiles: this.plugin.uppy.getFiles(),
      validateRestrictions: this.plugin.uppy.validateRestrictions,
    }

    return (
      <CloseWrapper onUnmount={this.clearSelection}>
        <Browser {...browserProps} />
      </CloseWrapper>
    )
  }
}
