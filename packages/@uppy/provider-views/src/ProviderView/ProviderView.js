const { h } = require('preact')
const AuthView = require('./AuthView')
const Header = require('./Header')
const Browser = require('../Browser')
const LoaderView = require('../Loader')
const CloseWrapper = require('../CloseWrapper')
const View = require('../View')

function getOrigin () {
  // eslint-disable-next-line no-restricted-globals
  return location.origin
}

/**
 * Class to easily generate generic views for Provider plugins
 */
module.exports = class ProviderView extends View {
  static VERSION = require('../../package.json').version

  /**
   * @param {object} plugin instance of the plugin
   * @param {object} opts
   */
  constructor (plugin, opts) {
    super(plugin, opts)
    // set default options
    const defaultOptions = {
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true,
    }

    // merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    // Logic
    this.filterQuery = this.filterQuery.bind(this)
    this.getFolder = this.getFolder.bind(this)
    this.getNextFolder = this.getNextFolder.bind(this)
    this.logout = this.logout.bind(this)
    this.handleAuth = this.handleAuth.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.listAllFiles = this.listAllFiles.bind(this)
    this.donePicking = this.donePicking.bind(this)

    // Visual
    this.render = this.render.bind(this)

    // Set default state for the plugin
    this.plugin.setPluginState({
      authenticated: false,
      files: [],
      folders: [],
      directories: [],
      filterInput: '',
      isSearchVisible: false,
      currentSelection: [],
    })
  }

  tearDown () {
    // Nothing.
  }

  #updateFilesAndFolders (res, files, folders) {
    this.nextPagePath = res.nextPagePath
    res.items.forEach((item) => {
      if (item.isFolder) {
        folders.push(item)
      } else {
        files.push(item)
      }
    })

    this.plugin.setPluginState({ folders, files })
  }

  /**
   * Based on folder ID, fetch a new folder and update it to state
   *
   * @param  {string} id Folder id
   * @returns {Promise}   Folders/files in folder
   */
  getFolder (id, name) {
    return this.sharedHandler.loaderWrapper(
      this.provider.list(id),
      (res) => {
        const folders = []
        const files = []
        let updatedDirectories

        const state = this.plugin.getPluginState()
        const index = state.directories.findIndex((dir) => id === dir.id)

        if (index !== -1) {
          updatedDirectories = state.directories.slice(0, index + 1)
        } else {
          updatedDirectories = state.directories.concat([{ id, title: name }])
        }

        this.username = res.username || this.username
        this.#updateFilesAndFolders(res, files, folders)
        this.plugin.setPluginState({ directories: updatedDirectories })
      },
      this.handleError,
    )
  }

  /**
   * Fetches new folder
   *
   * @param  {object} folder
   */
  getNextFolder (folder) {
    this.getFolder(folder.requestPath, folder.name)
    this.lastCheckbox = undefined
  }

  /**
   * Removes session token on client side.
   */
  logout () {
    this.provider.logout()
      .then((res) => {
        if (res.ok) {
          if (!res.revoked) {
            const message = this.plugin.uppy.i18n('companionUnauthorizeHint', {
              provider: this.plugin.title,
              url: res.manual_revoke_url,
            })
            this.plugin.uppy.info(message, 'info', 7000)
          }

          const newState = {
            authenticated: false,
            files: [],
            folders: [],
            directories: [],
          }
          this.plugin.setPluginState(newState)
        }
      }).catch(this.handleError)
  }

  filterQuery (e) {
    const state = this.plugin.getPluginState()
    this.plugin.setPluginState({ ...state, filterInput: e ? e.target.value : '' })
  }

  /**
   * Adds all files found inside of specified folder.
   *
   * Uses separated state while folder contents are being fetched and
   * mantains list of selected folders, which are separated from files.
   */
  addFolder (folder) {
    const folderId = this.providerFileToId(folder)
    const state = this.plugin.getPluginState()
    const folders = { ...state.selectedFolders }

    if (folderId in folders && folders[folderId].loading) {
      return
    }

    folders[folderId] = { loading: true, files: [] }

    this.plugin.setPluginState({ selectedFolders: { ...folders } })

    // eslint-disable-next-line consistent-return
    return this.listAllFiles(folder.requestPath).then((files) => {
      let count = 0

      // If the same folder is added again, we don't want to send
      // X amount of duplicate file notifications, we want to say
      // the folder was already added. This checks if all files are duplicate,
      // if that's the case, we don't add the files.
      files.forEach(file => {
        const id = this.providerFileToId(file)
        if (!this.plugin.uppy.checkIfFileAlreadyExists(id)) {
          count++
        }
      })

      if (count > 0) {
        files.forEach((file) => this.addFile(file))
      }

      const ids = files.map(this.providerFileToId)

      folders[folderId] = {
        loading: false,
        files: ids,
      }
      this.plugin.setPluginState({ selectedFolders: folders })

      let message

      if (count === 0) {
        message = this.plugin.uppy.i18n('folderAlreadyAdded', {
          folder: folder.name,
        })
      } else if (files.length) {
        message = this.plugin.uppy.i18n('folderAdded', {
          smart_count: count, folder: folder.name,
        })
      } else {
        message = this.plugin.uppy.i18n('emptyFolderAdded')
      }

      this.plugin.uppy.info(message)
    }).catch((e) => {
      const state = this.plugin.getPluginState()
      const selectedFolders = { ...state.selectedFolders }
      delete selectedFolders[folderId]
      this.plugin.setPluginState({ selectedFolders })
      this.handleError(e)
    })
  }

  async handleAuth () {
    await this.provider.ensurePreAuth()

    const authState = btoa(JSON.stringify({ origin: getOrigin() }))
    const clientVersion = `@uppy/provider-views=${ProviderView.VERSION}`
    const link = this.provider.authUrl({ state: authState, uppyVersions: clientVersion })

    const authWindow = window.open(link, '_blank')
    const handleToken = (e) => {
      if (!this.#isOriginAllowed(e.origin, this.plugin.opts.companionAllowedHosts) || e.source !== authWindow) {
        this.plugin.uppy.log(`rejecting event from ${e.origin} vs allowed pattern ${this.plugin.opts.companionAllowedHosts}`)
        return
      }

      // Check if it's a string before doing the JSON.parse to maintain support
      // for older Companion versions that used object references
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data

      if (data.error) {
        this.plugin.uppy.log('auth aborted')
        const { uppy } = this.plugin
        const message = uppy.i18n('authAborted')
        uppy.info({ message }, 'warning', 5000)
        return
      }

      if (!data.token) {
        this.plugin.uppy.log('did not receive token from auth window')
        return
      }

      authWindow.close()
      window.removeEventListener('message', handleToken)
      this.provider.setAuthToken(data.token)
      this.preFirstRender()
    }
    window.addEventListener('message', handleToken)
  }

  #isOriginAllowed (origin, allowedOrigin) {
    const getRegex = (value) => {
      if (typeof value === 'string') {
        return new RegExp(`^${value}$`)
      } if (value instanceof RegExp) {
        return value
      }
    }

    const patterns = Array.isArray(allowedOrigin) ? allowedOrigin.map(getRegex) : [getRegex(allowedOrigin)]
    return patterns
      .filter((pattern) => pattern != null) // loose comparison to catch undefined
      .some((pattern) => pattern.test(origin) || pattern.test(`${origin}/`)) // allowing for trailing '/'
  }

  async handleScroll (event) {
    const path = this.nextPagePath || null

    if (this.shouldHandleScroll(event) && path) {
      this.isHandlingScroll = true

      try {
        const response = await this.provider.list(path)
        const { files, folders } = this.plugin.getPluginState()

        this.#updateFilesAndFolders(response, files, folders)
      } catch (error) {
        this.handleError(error)
      } finally {
        this.isHandlingScroll = false
      }
    }
  }

  listAllFiles (path, files = null) {
    files = files || []
    return new Promise((resolve, reject) => {
      this.provider.list(path).then((res) => {
        res.items.forEach((item) => {
          if (!item.isFolder) {
            files.push(item)
          } else {
            this.addFolder(item)
          }
        })
        const moreFiles = res.nextPagePath || null
        if (moreFiles) {
          return this.listAllFiles(moreFiles, files)
            .then((files) => resolve(files))
            .catch(e => reject(e))
        }
        return resolve(files)
      }).catch(e => reject(e))
    })
  }

  donePicking () {
    const { currentSelection } = this.plugin.getPluginState()
    const promises = currentSelection.map((file) => {
      if (file.isFolder) {
        return this.addFolder(file)
      }
      return this.addFile(file)
    })

    this.sharedHandler.loaderWrapper(Promise.all(promises), () => {
      this.clearSelection()
    }, () => {})
  }

  render (state, viewOptions = {}) {
    const { authenticated, didFirstRender } = this.plugin.getPluginState()

    if (!didFirstRender) {
      this.preFirstRender()
    }

    const targetViewOptions = { ...this.opts, ...viewOptions }
    const { files, folders, filterInput, loading, currentSelection } = this.plugin.getPluginState()
    const { isChecked, toggleCheckbox, filterItems } = this.sharedHandler
    const hasInput = filterInput !== ''
    const headerProps = {
      showBreadcrumbs: targetViewOptions.showBreadcrumbs,
      getFolder: this.getFolder,
      directories: this.plugin.getPluginState().directories,
      pluginIcon: this.plugin.icon,
      title: this.plugin.title,
      logout: this.logout,
      username: this.username,
      i18n: this.plugin.uppy.i18n,
    }

    const browserProps = {
      isChecked,
      toggleCheckbox,
      currentSelection,
      files: hasInput ? filterItems(files) : files,
      folders: hasInput ? filterItems(folders) : folders,
      username: this.username,
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      filterItems: this.sharedHandler.filterItems,
      filterQuery: this.filterQuery,
      logout: this.logout,
      handleScroll: this.handleScroll,
      listAllFiles: this.listAllFiles,
      done: this.donePicking,
      cancel: this.cancelPicking,
      headerComponent: Header(headerProps),
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

    if (!authenticated) {
      return (
        <CloseWrapper onUnmount={this.clearSelection}>
          <AuthView
            pluginName={this.plugin.title}
            pluginIcon={this.plugin.icon}
            handleAuth={this.handleAuth}
            i18n={this.plugin.uppy.i18n}
            i18nArray={this.plugin.uppy.i18nArray}
          />
        </CloseWrapper>
      )
    }

    return (
      <CloseWrapper onUnmount={this.clearSelection}>
        <Browser {...browserProps} />
      </CloseWrapper>
    )
  }
}
