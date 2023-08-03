import getFileType from '@uppy/utils/lib/getFileType'
import isPreviewSupported from '@uppy/utils/lib/isPreviewSupported'
import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'

export default class View {
  constructor (plugin, opts) {
    this.plugin = plugin
    this.provider = opts.provider

    this.isHandlingScroll = false

    this.preFirstRender = this.preFirstRender.bind(this)
    this.handleError = this.handleError.bind(this)
    this.clearSelection = this.clearSelection.bind(this)
    this.cancelPicking = this.cancelPicking.bind(this)
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
    this.plugin.setPluginState({ currentSelection: [], filterInput: '' })
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

    if (error.isAuthError || error.cause?.name === 'AbortError') {
      // authError just means we're not authenticated, don't show to user
      // AbortError means the user has clicked "cancel" on an operation
      return
    }

    uppy.info({ message, details: error.toString() }, 'error', 5000)
  }

  // todo document what is a "tagFile" or get rid of this concept
  getTagFile (file) {
    const tagFile = {
      id: file.id,
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
        provider: this.provider.provider,
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

    // add relativePath similar to non-remote files: https://github.com/transloadit/uppy/pull/4486#issuecomment-1579203717
    if (file.relDirPath != null) tagFile.meta.relativePath = file.relDirPath ? `${file.relDirPath}/${tagFile.name}` : null
    // and absolutePath (with leading slash) https://github.com/transloadit/uppy/pull/4537#issuecomment-1614236655
    if (file.absDirPath != null) tagFile.meta.absolutePath = file.absDirPath ? `/${file.absDirPath}/${tagFile.name}` : `/${tagFile.name}`

    return tagFile
  }

  filterItems = (items) => {
    const state = this.plugin.getPluginState()
    if (!state.filterInput || state.filterInput === '') {
      return items
    }
    return items.filter((folder) => {
      return folder.name.toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1
    })
  }

  recordShiftKeyPress = (e) => {
    this.isShiftKeyPressed = e.shiftKey
  }

  /**
   * Toggles file/folder checkbox to on/off state while updating files list.
   *
   * Note that some extra complexity comes from supporting shift+click to
   * toggle multiple checkboxes at once, which is done by getting all files
   * in between last checked file and current one.
   */
  toggleCheckbox = (e, file) => {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.focus()
    const { folders, files } = this.plugin.getPluginState()
    const items = this.filterItems(folders.concat(files))
    // Shift-clicking selects a single consecutive list of items
    // starting at the previous click.
    if (this.lastCheckbox && this.isShiftKeyPressed) {
      const { currentSelection } = this.plugin.getPluginState()
      const prevIndex = items.indexOf(this.lastCheckbox)
      const currentIndex = items.indexOf(file)
      const newSelection = (prevIndex < currentIndex)
        ? items.slice(prevIndex, currentIndex + 1)
        : items.slice(currentIndex, prevIndex + 1)
      const reducedNewSelection = []

      // Check restrictions on each file in currentSelection,
      // reduce it to only contain files that pass restrictions
      for (const item of newSelection) {
        const { uppy } = this.plugin
        const restrictionError = uppy.validateRestrictions(
          remoteFileObjToLocal(item),
          [...uppy.getFiles(), ...reducedNewSelection],
        )

        if (!restrictionError) {
          reducedNewSelection.push(item)
        } else {
          uppy.info({ message: restrictionError.message }, 'error', uppy.opts.infoTimeout)
        }
      }
      this.plugin.setPluginState({ currentSelection: [...new Set([...currentSelection, ...reducedNewSelection])] })
      return
    }

    this.lastCheckbox = file
    const { currentSelection } = this.plugin.getPluginState()
    if (this.isChecked(file)) {
      this.plugin.setPluginState({
        currentSelection: currentSelection.filter((item) => item.id !== file.id),
      })
    } else {
      this.plugin.setPluginState({
        currentSelection: currentSelection.concat([file]),
      })
    }
  }

  isChecked = (file) => {
    const { currentSelection } = this.plugin.getPluginState()
    // comparing id instead of the file object, because the reference to the object
    // changes when we switch folders, and the file list is updated
    return currentSelection.some((item) => item.id === file.id)
  }

  setLoading (loading) {
    this.plugin.setPluginState({ loading })
  }
}
