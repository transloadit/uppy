import { h } from 'preact'
import PQueue from 'p-queue'

import { getSafeFileId } from '@uppy/utils/lib/generateFileID'

import type {
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  Uppy,
} from '@uppy/core/lib/Uppy.ts'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile.ts'
import type Translator from '@uppy/utils/lib/Translator'
import type { DefinePluginOpts } from '@uppy/core/lib/BasePlugin.ts'
import AuthView from './AuthView.tsx'
import Header from './Header.tsx'
import Browser from '../Browser.tsx'
import CloseWrapper from '../CloseWrapper.ts'
import View, { type ViewOptions } from '../View.ts'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../../package.json'

function formatBreadcrumbs(
  breadcrumbs: UnknownProviderPluginState['breadcrumbs'],
): string {
  return breadcrumbs
    .slice(1)
    .map((directory) => directory.name)
    .join('/')
}

function prependPath(path: string | undefined, component: string): string {
  if (!path) return component
  return `${path}/${component}`
}

export function defaultPickerIcon(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="30"
      height="30"
      viewBox="0 0 30 30"
    >
      <path d="M15 30c8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15zm4.258-12.676v6.846h-8.426v-6.846H5.204l9.82-12.364 9.82 12.364H19.26z" />
    </svg>
  )
}

type PluginType = 'Provider'

const defaultOptions = {
  viewType: 'list',
  showTitles: true,
  showFilter: true,
  showBreadcrumbs: true,
  loadAllFiles: false,
}

export interface ProviderViewOptions<M extends Meta, B extends Body>
  extends ViewOptions<M, B, PluginType> {
  renderAuthForm?: (args: {
    pluginName: string
    i18n: Translator['translateArray']
    loading: boolean | string
    onAuth: (authFormData: unknown) => Promise<void>
  }) => JSX.Element
}

type Opts<M extends Meta, B extends Body> = DefinePluginOpts<
  ProviderViewOptions<M, B>,
  keyof typeof defaultOptions
>

/**
 * Class to easily generate generic views for Provider plugins
 */
export default class ProviderView<M extends Meta, B extends Body> extends View<
  M,
  B,
  PluginType,
  Opts<M, B>
> {
  static VERSION = packageJson.version

  username: string | undefined

  nextPagePath: string | undefined

  constructor(
    plugin: UnknownProviderPlugin<M, B>,
    opts: ProviderViewOptions<M, B>,
  ) {
    super(plugin, { ...defaultOptions, ...opts })

    // Logic
    this.filterQuery = this.filterQuery.bind(this)
    this.clearFilter = this.clearFilter.bind(this)
    this.getFolder = this.getFolder.bind(this)
    this.getNextFolder = this.getNextFolder.bind(this)
    this.logout = this.logout.bind(this)
    this.handleAuth = this.handleAuth.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.donePicking = this.donePicking.bind(this)

    // Visual
    this.render = this.render.bind(this)

    // Set default state for the plugin
    this.plugin.setPluginState({
      authenticated: undefined, // we don't know yet
      files: [],
      folders: [],
      breadcrumbs: [],
      filterInput: '',
      isSearchVisible: false,
      currentSelection: [],
    })

    this.registerRequestClient()
  }

  // eslint-disable-next-line class-methods-use-this
  tearDown(): void {
    // Nothing.
  }

  #abortController: AbortController | undefined

  async #withAbort(op: (signal: AbortSignal) => Promise<void>) {
    // prevent multiple requests in parallel from causing race conditions
    this.#abortController?.abort()
    const abortController = new AbortController()
    this.#abortController = abortController
    const cancelRequest = () => {
      abortController.abort()
      this.clearSelection()
    }
    try {
      // @ts-expect-error this should be typed in @uppy/dashboard.
      // Even then I don't think we can make this work without adding dashboard
      // as a dependency to provider-views.
      this.plugin.uppy.on('dashboard:close-panel', cancelRequest)
      this.plugin.uppy.on('cancel-all', cancelRequest)

      await op(abortController.signal)
    } finally {
      // @ts-expect-error this should be typed in @uppy/dashboard.
      // Even then I don't think we can make this work without adding dashboard
      // as a dependency to provider-views.
      this.plugin.uppy.off('dashboard:close-panel', cancelRequest)
      this.plugin.uppy.off('cancel-all', cancelRequest)
      this.#abortController = undefined
    }
  }

  async #list({
    requestPath,
    absDirPath,
    signal,
  }: {
    requestPath?: string
    absDirPath: string
    signal: AbortSignal
  }) {
    const { username, nextPagePath, items } = await this.provider.list<{
      username: string
      nextPagePath: string
      items: CompanionFile[]
    }>(requestPath, { signal })
    this.username = username || this.username

    return {
      items: items.map((item) => ({
        ...item,
        absDirPath,
      })),
      nextPagePath,
    }
  }

  async #listFilesAndFolders({
    breadcrumbs,
    signal,
  }: {
    breadcrumbs: UnknownProviderPluginState['breadcrumbs']
    signal: AbortSignal
  }) {
    const absDirPath = formatBreadcrumbs(breadcrumbs)

    const { items, nextPagePath } = await this.#list({
      requestPath: this.nextPagePath,
      absDirPath,
      signal,
    })

    this.nextPagePath = nextPagePath

    const files: CompanionFile[] = []
    const folders: CompanionFile[] = []

    items.forEach((item) => {
      if (item.isFolder) {
        folders.push(item)
      } else {
        files.push(item)
      }
    })

    return { files, folders }
  }

  /**
   * Select a folder based on its id: fetches the folder and then updates state with its contents
   * TODO rename to something better like selectFolder or navigateToFolder (breaking change?)
   *
   */
  async getFolder(requestPath?: string, name?: string): Promise<void> {
    this.setLoading(true)
    try {
      await this.#withAbort(async (signal) => {
        this.lastCheckbox = undefined

        let { breadcrumbs } = this.plugin.getPluginState()

        const index = breadcrumbs.findIndex(
          (dir) => requestPath === dir.requestPath,
        )

        if (index !== -1) {
          // means we navigated back to a known directory (already in the stack), so cut the stack off there
          breadcrumbs = breadcrumbs.slice(0, index + 1)
        } else {
          // we have navigated into a new (unknown) folder, add it to the stack
          breadcrumbs = [...breadcrumbs, { requestPath, name }]
        }

        this.nextPagePath = requestPath
        let files: CompanionFile[] = []
        let folders: CompanionFile[] = []
        do {
          const { files: newFiles, folders: newFolders } =
            await this.#listFilesAndFolders({
              breadcrumbs,
              signal,
            })

          files = files.concat(newFiles)
          folders = folders.concat(newFolders)

          this.setLoading(
            this.plugin.uppy.i18n('loadedXFiles', {
              numFiles: files.length + folders.length,
            }),
          )
        } while (this.opts.loadAllFiles && this.nextPagePath)

        this.plugin.setPluginState({
          folders,
          files,
          breadcrumbs,
          filterInput: '',
        })
      })
    } catch (err) {
      // This is the first call that happens when the provider view loads, after auth, so it's probably nice to show any
      // error occurring here to the user.
      if (err?.name === 'UserFacingApiError') {
        this.plugin.uppy.info(
          { message: this.plugin.uppy.i18n(err.message) },
          'warning',
          5000,
        )
        return
      }

      this.handleError(err)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Fetches new folder
   */
  getNextFolder(folder: CompanionFile): void {
    this.getFolder(folder.requestPath, folder.name)
    this.lastCheckbox = undefined
  }

  /**
   * Removes session token on client side.
   */
  async logout(): Promise<void> {
    try {
      await this.#withAbort(async (signal) => {
        const res = await this.provider.logout<{
          ok: boolean
          revoked: boolean
          manual_revoke_url: string
        }>({
          signal,
        })
        // res.ok is from the JSON body, not to be confused with Response.ok
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
            breadcrumbs: [],
            filterInput: '',
          }
          this.plugin.setPluginState(newState)
        }
      })
    } catch (err) {
      this.handleError(err)
    }
  }

  filterQuery(input: string): void {
    this.plugin.setPluginState({ filterInput: input })
  }

  clearFilter(): void {
    this.plugin.setPluginState({ filterInput: '' })
  }

  async handleAuth(authFormData?: unknown): Promise<void> {
    try {
      await this.#withAbort(async (signal) => {
        this.setLoading(true)
        await this.provider.login({ authFormData, signal })
        this.plugin.setPluginState({ authenticated: true })
        this.preFirstRender()
      })
    } catch (err) {
      if (err.name === 'UserFacingApiError') {
        this.plugin.uppy.info(
          { message: this.plugin.uppy.i18n(err.message) },
          'warning',
          5000,
        )
        return
      }

      this.plugin.uppy.log(`login failed: ${err.message}`)
    } finally {
      this.setLoading(false)
    }
  }

  async handleScroll(event: Event): Promise<void> {
    if (this.shouldHandleScroll(event) && this.nextPagePath) {
      this.isHandlingScroll = true

      try {
        await this.#withAbort(async (signal) => {
          const { files, folders, breadcrumbs } = this.plugin.getPluginState()

          const { files: newFiles, folders: newFolders } =
            await this.#listFilesAndFolders({
              breadcrumbs,
              signal,
            })

          const combinedFiles = files.concat(newFiles)
          const combinedFolders = folders.concat(newFolders)

          this.plugin.setPluginState({
            folders: combinedFolders,
            files: combinedFiles,
          })
        })
      } catch (error) {
        this.handleError(error)
      } finally {
        this.isHandlingScroll = false
      }
    }
  }

  async #recursivelyListAllFiles({
    requestPath,
    absDirPath,
    relDirPath,
    queue,
    onFiles,
    signal,
  }: {
    requestPath: string
    absDirPath: string
    relDirPath: string
    queue: PQueue
    onFiles: (files: CompanionFile[]) => void
    signal: AbortSignal
  }) {
    let curPath = requestPath

    while (curPath) {
      const res = await this.#list({ requestPath: curPath, absDirPath, signal })
      curPath = res.nextPagePath

      const files = res.items.filter((item) => !item.isFolder)
      const folders = res.items.filter((item) => item.isFolder)

      onFiles(files)

      // recursively queue call to self for each folder
      const promises = folders.map(async (folder) =>
        queue.add(async () =>
          this.#recursivelyListAllFiles({
            requestPath: folder.requestPath,
            absDirPath: prependPath(absDirPath, folder.name),
            relDirPath: prependPath(relDirPath, folder.name),
            queue,
            onFiles,
            signal,
          }),
        ),
      )
      await Promise.all(promises) // in case we get an error
    }
  }

  async donePicking(): Promise<void> {
    this.setLoading(true)
    try {
      await this.#withAbort(async (signal) => {
        const { currentSelection } = this.plugin.getPluginState()

        const messages: string[] = []
        const newFiles: CompanionFile[] = []

        for (const selectedItem of currentSelection) {
          const { requestPath } = selectedItem

          const withRelDirPath = (newItem: CompanionFile) => ({
            ...newItem,
            // calculate the file's path relative to the user's selected item's path
            // see https://github.com/transloadit/uppy/pull/4537#issuecomment-1614236655
            relDirPath: (newItem.absDirPath as string)
              .replace(selectedItem.absDirPath as string, '')
              .replace(/^\//, ''),
          })

          if (selectedItem.isFolder) {
            let isEmpty = true
            let numNewFiles = 0

            const queue = new PQueue({ concurrency: 6 })

            const onFiles = (files: CompanionFile[]) => {
              for (const newFile of files) {
                const tagFile = this.getTagFile(newFile)

                const id = getSafeFileId(tagFile)
                // If the same folder is added again, we don't want to send
                // X amount of duplicate file notifications, we want to say
                // the folder was already added. This checks if all files are duplicate,
                // if that's the case, we don't add the files.
                if (!this.plugin.uppy.checkIfFileAlreadyExists(id)) {
                  newFiles.push(withRelDirPath(newFile))
                  numNewFiles++
                  this.setLoading(
                    this.plugin.uppy.i18n('addedNumFiles', {
                      numFiles: numNewFiles,
                    }),
                  )
                }
                isEmpty = false
              }
            }

            await this.#recursivelyListAllFiles({
              requestPath,
              absDirPath: prependPath(
                selectedItem.absDirPath,
                selectedItem.name,
              ),
              relDirPath: selectedItem.name,
              queue,
              onFiles,
              signal,
            })
            await queue.onIdle()

            let message
            if (isEmpty) {
              message = this.plugin.uppy.i18n('emptyFolderAdded')
            } else if (numNewFiles === 0) {
              message = this.plugin.uppy.i18n('folderAlreadyAdded', {
                folder: selectedItem.name,
              })
            } else {
              // TODO we don't really know at this point whether any files were actually added
              // (only later after addFiles has been called) so we should probably rewrite this.
              // Example: If all files fail to add due to restriction error, it will still say "Added 100 files from folder"
              message = this.plugin.uppy.i18n('folderAdded', {
                smart_count: numNewFiles,
                folder: selectedItem.name,
              })
            }

            messages.push(message)
          } else {
            newFiles.push(withRelDirPath(selectedItem))
          }
        }

        // Note: this.plugin.uppy.addFiles must be only run once we are done fetching all files,
        // because it will cause the loading screen to disappear,
        // and that will allow the user to start the upload, so we need to make sure we have
        // finished all async operations before we add any file
        // see https://github.com/transloadit/uppy/pull/4384
        this.plugin.uppy.log('Adding files from a remote provider')
        this.plugin.uppy.addFiles(
          // @ts-expect-error `addFiles` expects `body` to be `File` or `Blob`,
          // but as the todo comment in `View.ts` indicates, we strangly pass `CompanionFile` as `body`.
          // For now it's better to ignore than to have a potential breaking change.
          newFiles.map((file) => this.getTagFile(file, this.requestClientId)),
        )

        this.plugin.setPluginState({ filterInput: '' })
        messages.forEach((message) => this.plugin.uppy.info(message))

        this.clearSelection()
      })
    } catch (err) {
      this.handleError(err)
    } finally {
      this.setLoading(false)
    }
  }

  render(
    state: unknown,
    viewOptions: Omit<ViewOptions<M, B, PluginType>, 'provider'> = {},
  ): JSX.Element {
    const { authenticated, didFirstRender } = this.plugin.getPluginState()
    const { i18n } = this.plugin.uppy

    if (!didFirstRender) {
      this.preFirstRender()
    }

    const targetViewOptions = { ...this.opts, ...viewOptions }
    const { files, folders, filterInput, loading, currentSelection } =
      this.plugin.getPluginState()
    const { isChecked, recordShiftKeyPress, filterItems } = this
    const hasInput = filterInput !== ''
    const pluginIcon = this.plugin.icon || defaultPickerIcon

    const headerProps = {
      showBreadcrumbs: targetViewOptions.showBreadcrumbs,
      getFolder: this.getFolder,
      breadcrumbs: this.plugin.getPluginState().breadcrumbs,
      pluginIcon,
      title: this.plugin.title,
      logout: this.logout,
      username: this.username,
      i18n,
    }

    const browserProps = {
      isChecked,
      toggleCheckbox: this.toggleCheckbox.bind(this),
      recordShiftKeyPress,
      currentSelection,
      files: hasInput ? filterItems(files) : files,
      folders: hasInput ? filterItems(folders) : folders,
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      loadAllFiles: this.opts.loadAllFiles,

      // For SearchFilterInput component
      showSearchFilter: targetViewOptions.showFilter,
      search: this.filterQuery,
      clearSearch: this.clearFilter,
      searchTerm: filterInput,
      searchOnInput: true,
      searchInputLabel: i18n('filter'),
      clearSearchLabel: i18n('resetFilter'),

      noResultsLabel: i18n('noFilesFound'),
      logout: this.logout,
      handleScroll: this.handleScroll,
      done: this.donePicking,
      cancel: this.cancelPicking,
      // eslint-disable-next-line react/jsx-props-no-spreading
      headerComponent: <Header<M, B> {...headerProps} />,
      title: this.plugin.title,
      viewType: targetViewOptions.viewType,
      showTitles: targetViewOptions.showTitles,
      showBreadcrumbs: targetViewOptions.showBreadcrumbs,
      pluginIcon,
      i18n: this.plugin.uppy.i18n,
      uppyFiles: this.plugin.uppy.getFiles(),
      validateRestrictions: (
        ...args: Parameters<Uppy<M, B>['validateRestrictions']>
      ) => this.plugin.uppy.validateRestrictions(...args),
      isLoading: loading,
    }

    if (authenticated === false) {
      return (
        <CloseWrapper onUnmount={this.clearSelection}>
          <AuthView
            pluginName={this.plugin.title}
            pluginIcon={pluginIcon}
            handleAuth={this.handleAuth}
            i18n={this.plugin.uppy.i18nArray}
            renderForm={this.opts.renderAuthForm}
            loading={loading}
          />
        </CloseWrapper>
      )
    }

    return (
      <CloseWrapper onUnmount={this.clearSelection}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Browser<M, B> {...browserProps} />
      </CloseWrapper>
    )
  }
}
