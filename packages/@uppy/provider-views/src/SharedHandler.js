import remoteFileObjToLocal from '@uppy/utils/lib/remoteFileObjToLocal'

export default class SharedHandler {
  constructor (plugin) {
    this.plugin = plugin
    this.filterItems = this.filterItems.bind(this)
    this.toggleCheckbox = this.toggleCheckbox.bind(this)
    this.recordShiftKeyPress = this.recordShiftKeyPress.bind(this)
    this.isChecked = this.isChecked.bind(this)
    this.loaderWrapper = this.loaderWrapper.bind(this)
  }

  filterItems (items) {
    const state = this.plugin.getPluginState()
    if (!state.filterInput || state.filterInput === '') {
      return items
    }
    return items.filter((folder) => {
      return folder.name.toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1
    })
  }

  recordShiftKeyPress (e) {
    this.isShiftKeyPressed = e.shiftKey
  }

  /**
   * Toggles file/folder checkbox to on/off state while updating files list.
   *
   * Note that some extra complexity comes from supporting shift+click to
   * toggle multiple checkboxes at once, which is done by getting all files
   * in between last checked file and current one.
   */
  toggleCheckbox (e, file) {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.focus()
    const { folders, files } = this.plugin.getPluginState()
    const items = this.filterItems(folders.concat(files))
    // Shift-clicking selects a single consecutive list of items
    // starting at the previous click and deselects everything else.
    if (this.lastCheckbox && this.isShiftKeyPressed) {
      const prevIndex = items.indexOf(this.lastCheckbox)
      const currentIndex = items.indexOf(file)
      const currentSelection = (prevIndex < currentIndex)
        ? items.slice(prevIndex, currentIndex + 1)
        : items.slice(currentIndex, prevIndex + 1)
      const reducedCurrentSelection = []

      // Check restrictions on each file in currentSelection,
      // reduce it to only contain files that pass restrictions
      for (const item of currentSelection) {
        const { uppy } = this.plugin
        const restrictionError = uppy.validateRestrictions(
          remoteFileObjToLocal(item),
          [...uppy.getFiles(), ...reducedCurrentSelection],
        )

        if (!restrictionError) {
          reducedCurrentSelection.push(item)
        } else {
          uppy.info({ message: restrictionError.message }, 'error', uppy.opts.infoTimeout)
        }
      }
      this.plugin.setPluginState({ currentSelection: reducedCurrentSelection })
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

  isChecked (file) {
    const { currentSelection } = this.plugin.getPluginState()
    // comparing id instead of the file object, because the reference to the object
    // changes when we switch folders, and the file list is updated
    return currentSelection.some((item) => item.id === file.id)
  }

  loaderWrapper (promise, then, catch_) {
    promise
      .then((result) => {
        this.plugin.setPluginState({ loading: false })
        then(result)
      }).catch((err) => {
        this.plugin.setPluginState({ loading: false })
        catch_(err)
      })
    this.plugin.setPluginState({ loading: true })
  }
}
