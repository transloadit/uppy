const getFileType = require('@uppy/utils/lib/getFileType')
const isPreviewSupported = require('@uppy/utils/lib/isPreviewSupported')
const generateFileID = require('@uppy/utils/lib/generateFileID')

// TODO: now that we have a shared `View` class,
// `SharedHandler` could be cleaned up and moved into here
const SharedHandler = require('./SharedHandler')

module.exports = class View {
  constructor (plugin, opts) {
    this.plugin = plugin
    this.provider = opts.provider
    this.sharedHandler = new SharedHandler(plugin)

    this.isHandlingScroll = false

    this.preFirstRender = this.preFirstRender.bind(this)
    this.handleError = this.handleError.bind(this)
    this.addFile = this.addFile.bind(this)
    this.clearSelection = this.clearSelection.bind(this)
    this.cancelPicking = this.cancelPicking.bind(this)
  }

  // eslint-disable-next-line class-methods-use-this
  providerFileToId (file) {
    return generateFileID({
      data: file,
      name: file.name || file.id,
      type: file.mimetype,
    })
  }

  preFirstRender () {
    this.plugin.setPluginState({ didFirstRender: true })
    this.plugin.onFirstRender()
  }

  // eslint-disable-next-line class-methods-use-this
  shouldHandleScroll (event) {
    const { scrollHeight, scrollTop, offsetHeight } = event.target
    const scrollPosition = scrollHeight - (scrollTop + offsetHeight)

    return scrollPosition < 50 && !this.isHandlingScroll
  }

  clearSelection () {
    this.plugin.setPluginState({ currentSelection: [] })
  }

  cancelPicking () {
    this.clearSelection()

    const dashboard = this.plugin.uppy.getPlugin('Dashboard')

    if (dashboard) {
      dashboard.hideAllPanels()
    }
  }

  handleError (error) {
    const { uppy } = this.plugin
    const message = uppy.i18n('companionError')

    uppy.log(error.toString())

    if (error.isAuthError) {
      return
    }

    uppy.info({ message, details: error.toString() }, 'error', 5000)
  }

  addFile (file) {
    const tagFile = {
      id: this.providerFileToId(file),
      source: this.plugin.id,
      data: file,
      name: file.name || file.id,
      type: file.mimeType,
      isRemote: true,
      meta: {},
      body: {
        fileId: file.id,
      },
      remote: {
        companionUrl: this.plugin.opts.companionUrl,
        url: `${this.provider.fileUrl(file.requestPath)}`,
        body: {
          fileId: file.id,
        },
        providerOptions: this.provider.opts,
        providerName: this.provider.name,
      },
    }

    const fileType = getFileType(tagFile)

    // TODO Should we just always use the thumbnail URL if it exists?
    if (fileType && isPreviewSupported(fileType)) {
      tagFile.preview = file.thumbnail
    }

    if (file.author) {
      if (file.author.name != null) tagFile.meta.authorName = String(file.author.name)
      if (file.author.url) tagFile.meta.authorUrl = file.author.url
    }

    this.plugin.uppy.log('Adding remote file')

    try {
      this.plugin.uppy.addFile(tagFile)
      return true
    } catch (err) {
      if (!err.isRestriction) {
        this.plugin.uppy.log(err)
      }
      return false
    }
  }
}
