const ProviderViews = require('@uppy/provider-views')

module.exports = class DriveProviderViews extends ProviderViews {
  toggleCheckbox (e, file) {
    e.stopPropagation()
    e.preventDefault()

    // Team Drives aren't selectable; for all else, defer to the base ProviderView.
    if (!file.custom.isTeamDrive) {
      super.toggleCheckbox(e, file)
    }
  }


  /**
   * Override Fetches new folder
   * @param  {Object} Folder
   * @param  {String} title Folder title
   */
  getNextFolder (folder) {
    this.getFolder(folder.requestPath + '?isTeamDrive=' + folder.custom.isTeamDrive, folder.name)
    this.lastCheckbox = undefined
  }

/**
   * Adds all files found inside of specified folder.
   *
   * Uses separated state while folder contents are being fetched and
   * mantains list of selected folders, which are separated from files.
   */


  find_files (requestPath, files, path){

    this.provider.list(requestPath).then((res) => {
      res.items.forEach((item) => {
        if (!item.isFolder) {
          item.name = path + '/' + item.name
          console.log(item)
          this.addFile(item)
          files.push(this.providerFileToId(item))
        }else {
          path = path + '/' + item.name
          this.find_files(item.requestPath, files, path)
        }
      })
    })
  }

  addFolder (folder){
    console.log(folder)
    const folderId = this.providerFileToId(folder)
    let state = this.plugin.getPluginState()
    let folders = state.selectedFolders || {}
    if (folderId in folders && folders[folderId].loading) {
      return
    }
    folders[folderId] = {loading: true, files: []}
    this.plugin.setPluginState({selectedFolders: folders})

    let files = []
    this.find_files(folder.requestPath, files, folder.name)
    console.log(files)
    state = this.plugin.getPluginState()
    state.selectedFolders[folderId] = {loading: false, files: files}
    this.plugin.setPluginState({selectedFolders: folders})
    const dashboard = this.plugin.uppy.getPlugin('Dashboard')
    let message
    if (files.length) {
      message = dashboard.i18n('folderAdded', {
        smart_count: files.length, folder: folder.name
      })
    } else {
      message = dashboard.i18n('emptyFolderAdded')
    }
    this.plugin.uppy.info(message)

    return
    return this.provider.list(folder.requestPath).then((res) => {
      let files = []
      console.log(res);
      console.log(res.items)
      res.items.forEach((item) => {
        if (!item.isFolder) {
          this.addFile(item)
          files.push(this.providerFileToId(item))
        }
      })
      state = this.plugin.getPluginState()
      state.selectedFolders[folderId] = {loading: false, files: files}
      this.plugin.setPluginState({selectedFolders: folders})
      const dashboard = this.plugin.uppy.getPlugin('Dashboard')
      let message
      if (files.length) {
        message = dashboard.i18n('folderAdded', {
          smart_count: files.length, folder: folder.name
        })
      } else {
        message = dashboard.i18n('emptyFolderAdded')
      }
      this.plugin.uppy.info(message)
    }).catch((e) => {
      state = this.plugin.getPluginState()
      delete state.selectedFolders[folderId]
      this.plugin.setPluginState({selectedFolders: state.selectedFolders})
      this.handleError(e)
    })
  }
}

