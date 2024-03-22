/* eslint-disable max-classes-per-file */
/* global AggregateError */

import Translator from '@uppy/utils/lib/Translator'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import ee from 'namespace-emitter'
import { nanoid } from 'nanoid/non-secure'
import throttle from 'lodash/throttle.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore store-default types not always available on that branch
import DefaultStore from '@uppy/store-default'
import getFileType from '@uppy/utils/lib/getFileType'
import getFileNameAndExtension from '@uppy/utils/lib/getFileNameAndExtension'
import { getSafeFileId } from '@uppy/utils/lib/generateFileID'
import type {
  UppyFile,
  Meta,
  Body,
  MinimalRequiredUppyFile,
} from '@uppy/utils/lib/UppyFile'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import type {
  CompanionClientProvider,
  CompanionClientSearchProvider,
} from '@uppy/utils/lib/CompanionClientProvider'
import type {
  FileProgressNotStarted,
  FileProgressStarted,
} from '@uppy/utils/lib/FileProgress'
import type {
  Locale,
  I18n,
  OptionalPluralizeLocale,
} from '@uppy/utils/lib/Translator'
import supportsUploadProgress from './supportsUploadProgress.ts'
import getFileName from './getFileName.ts'
import { justErrorsLogger, debugLogger } from './loggers.ts'
import {
  Restricter,
  defaultOptions as defaultRestrictionOptions,
  RestrictionError,
} from './Restricter.ts'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'
import locale from './locale.ts'

import type BasePlugin from './BasePlugin.ts'
import type { Restrictions, ValidateableFile } from './Restricter.ts'

type Processor = (
  fileIDs: string[],
  uploadID: string,
) => Promise<unknown> | void

type FileRemoveReason = 'user' | 'cancel-all'

type LogLevel = 'info' | 'warning' | 'error' | 'success'

export type UnknownPlugin<
  M extends Meta,
  B extends Body,
  PluginState extends Record<string, unknown> = Record<string, unknown>,
> = BasePlugin<any, M, B, PluginState>

export type UnknownProviderPluginState = {
  authenticated: boolean | undefined
  breadcrumbs: {
    requestPath?: string
    name?: string
    id?: string
  }[]
  didFirstRender: boolean
  currentSelection: CompanionFile[]
  filterInput: string
  loading: boolean | string
  folders: CompanionFile[]
  files: CompanionFile[]
  isSearchVisible: boolean
}
/*
 * UnknownProviderPlugin can be any Companion plugin (such as Google Drive).
 * As the plugins are passed around throughout Uppy we need a generic type for this.
 * It may seems like duplication, but this type safe. Changing the type of `storage`
 * will error in the `Provider` class of @uppy/companion-client and vice versa.
 *
 * Note that this is the *plugin* class, not a version of the `Provider` class.
 * `Provider` does operate on Companion plugins with `uppy.getPlugin()`.
 */
export type UnknownProviderPlugin<
  M extends Meta,
  B extends Body,
> = UnknownPlugin<M, B, UnknownProviderPluginState> & {
  onFirstRender: () => void
  title: string
  files: UppyFile<M, B>[]
  icon: () => JSX.Element
  provider: CompanionClientProvider
  storage: {
    getItem: (key: string) => Promise<string | null>
    setItem: (key: string, value: string) => Promise<void>
    removeItem: (key: string) => Promise<void>
  }
}

/*
 * UnknownSearchProviderPlugin can be any search Companion plugin (such as Unsplash).
 * As the plugins are passed around throughout Uppy we need a generic type for this.
 * It may seems like duplication, but this type safe. Changing the type of `title`
 * will error in the `SearchProvider` class of @uppy/companion-client and vice versa.
 *
 * Note that this is the *plugin* class, not a version of the `SearchProvider` class.
 * `SearchProvider` does operate on Companion plugins with `uppy.getPlugin()`.
 */
export type UnknownSearchProviderPluginState = {
  isInputMode?: boolean
  searchTerm?: string | null
} & Pick<
  UnknownProviderPluginState,
  | 'loading'
  | 'files'
  | 'folders'
  | 'currentSelection'
  | 'filterInput'
  | 'didFirstRender'
>
export type UnknownSearchProviderPlugin<
  M extends Meta,
  B extends Body,
> = UnknownPlugin<M, B, UnknownSearchProviderPluginState> & {
  onFirstRender: () => void
  title: string
  icon: () => JSX.Element
  provider: CompanionClientSearchProvider
}

export interface UploadResult<M extends Meta, B extends Body> {
  successful?: UppyFile<M, B>[]
  failed?: UppyFile<M, B>[]
  uploadID?: string
  [key: string]: unknown
}

interface CurrentUpload<M extends Meta, B extends Body> {
  fileIDs: string[]
  step: number
  result: UploadResult<M, B>
}

// TODO: can we use namespaces in other plugins to populate this?
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Plugins extends Record<string, Record<string, unknown> | undefined> {}

export interface State<M extends Meta, B extends Body>
  extends Record<string, unknown> {
  meta: M
  capabilities: {
    uploadProgress: boolean
    individualCancellation: boolean
    resumableUploads: boolean
    isMobileDevice?: boolean
    darkMode?: boolean
  }
  currentUploads: Record<string, CurrentUpload<M, B>>
  allowNewUpload: boolean
  recoveredState: null | Required<Pick<State<M, B>, 'files' | 'currentUploads'>>
  error: string | null
  files: {
    [key: string]: UppyFile<M, B>
  }
  info: Array<{
    isHidden?: boolean
    type: LogLevel
    message: string
    details?: string | Record<string, string> | null
  }>
  plugins: Plugins
  totalProgress: number
  companion?: Record<string, string>
}

export interface UppyOptions<M extends Meta, B extends Body> {
  id?: string
  autoProceed?: boolean
  /**
   * @deprecated Use allowMultipleUploadBatches
   */
  allowMultipleUploads?: boolean
  allowMultipleUploadBatches?: boolean
  logger?: typeof debugLogger
  debug?: boolean
  restrictions: Restrictions
  meta?: M
  onBeforeFileAdded?: (
    currentFile: UppyFile<M, B>,
    files: { [key: string]: UppyFile<M, B> },
  ) => UppyFile<M, B> | boolean | undefined
  onBeforeUpload?: (files: {
    [key: string]: UppyFile<M, B>
  }) => { [key: string]: UppyFile<M, B> } | boolean
  locale?: Locale
  // TODO: add <State<M, B>> when landing on `4.x`
  store?: DefaultStore
  infoTimeout?: number
}

export interface UppyOptionsWithOptionalRestrictions<
  M extends Meta,
  B extends Body,
> extends Omit<UppyOptions<M, B>, 'restrictions'> {
  restrictions?: Partial<Restrictions>
}

// The user facing type for UppyOptions used in uppy.setOptions()
type MinimalRequiredOptions<M extends Meta, B extends Body> = Partial<
  Omit<UppyOptions<M, B>, 'locale' | 'meta' | 'restrictions'> & {
    locale: OptionalPluralizeLocale
    meta: Partial<M>
    restrictions: Partial<Restrictions>
  }
>

export type NonNullableUppyOptions<M extends Meta, B extends Body> = Required<
  UppyOptions<M, B>
>

type GenericEventCallback = () => void
type FileAddedCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B>,
) => void
type FilesAddedCallback<M extends Meta, B extends Body> = (
  files: UppyFile<M, B>[],
) => void
type FileRemovedCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B>,
  reason?: FileRemoveReason,
) => void
type UploadCallback = (data: { id: string; fileIDs: string[] }) => void
type ProgressCallback = (progress: number) => void
type PreProcessProgressCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B> | undefined,
  progress: NonNullable<FileProgressStarted['preprocess']>,
) => void
type PostProcessProgressCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B> | undefined,
  progress: NonNullable<FileProgressStarted['postprocess']>,
) => void
type ProcessCompleteCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B> | undefined,
  progress?: NonNullable<FileProgressStarted['preprocess']>,
) => void
type UploadPauseCallback<M extends Meta, B extends Body> = (
  fileID: UppyFile<M, B>['id'] | undefined,
  isPaused: boolean,
) => void
type UploadStartCallback<M extends Meta, B extends Body> = (
  files: UppyFile<M, B>[],
) => void
type UploadStartedCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B>,
) => void
type UploadProgressCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B> | undefined,
  progress: FileProgressStarted,
) => void
type UploadSuccessCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B> | undefined,
  response: NonNullable<UppyFile<M, B>['response']>,
) => void
type UploadCompleteCallback<M extends Meta, B extends Body> = (
  result: UploadResult<M, B>,
) => void
type ErrorCallback<M extends Meta, B extends Body> = (
  error: { name: string; message: string; details?: string },
  file?: UppyFile<M, B>,
  response?: UppyFile<M, B>['response'],
) => void
type UploadErrorCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B> | undefined,
  error: { name: string; message: string; details?: string },
  response?:
    | Omit<NonNullable<UppyFile<M, B>['response']>, 'uploadURL'>
    | undefined,
) => void
type UploadStalledCallback<M extends Meta, B extends Body> = (
  error: { message: string; details?: string },
  files: UppyFile<M, B>[],
) => void
type UploadRetryCallback = (fileID: string) => void
type RetryAllCallback = (fileIDs: string[]) => void
type RestrictionFailedCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B> | undefined,
  error: Error,
) => void
type StateUpdateCallback<M extends Meta, B extends Body> = (
  prevState: State<M, B>,
  nextState: State<M, B>,
  patch?: Partial<State<M, B>>,
) => void
type CancelAllCallback = (reason: { reason?: FileRemoveReason }) => void
type PluginCallback = (plugin: UnknownPlugin<any, any>) => void

export interface _UppyEventMap<M extends Meta, B extends Body> {
  'back-online': GenericEventCallback
  'cancel-all': CancelAllCallback
  complete: UploadCompleteCallback<M, B>
  error: ErrorCallback<M, B>
  'file-added': FileAddedCallback<M, B>
  'file-removed': FileRemovedCallback<M, B>
  'files-added': FilesAddedCallback<M, B>
  'info-hidden': GenericEventCallback
  'info-visible': GenericEventCallback
  'is-offline': GenericEventCallback
  'is-online': GenericEventCallback
  'pause-all': GenericEventCallback
  'plugin-added': PluginCallback
  'plugin-remove': PluginCallback
  'postprocess-complete': ProcessCompleteCallback<M, B>
  'postprocess-progress': PostProcessProgressCallback<M, B>
  'preprocess-complete': ProcessCompleteCallback<M, B>
  'preprocess-progress': PreProcessProgressCallback<M, B>
  progress: ProgressCallback
  'reset-progress': GenericEventCallback
  restored: (pluginData: any) => void
  'restore-confirmed': GenericEventCallback
  'restore-canceled': GenericEventCallback
  'restriction-failed': RestrictionFailedCallback<M, B>
  'resume-all': GenericEventCallback
  'retry-all': RetryAllCallback
  'state-update': StateUpdateCallback<M, B>
  upload: UploadCallback
  'upload-error': UploadErrorCallback<M, B>
  'upload-pause': UploadPauseCallback<M, B>
  'upload-progress': UploadProgressCallback<M, B>
  'upload-retry': UploadRetryCallback
  'upload-stalled': UploadStalledCallback<M, B>
  'upload-success': UploadSuccessCallback<M, B>
}

/** @deprecated */
export interface DeprecatedUppyEventMap<M extends Meta, B extends Body> {
  'upload-start': UploadStartCallback<M, B>
  'upload-started': UploadStartedCallback<M, B>
}

export interface UppyEventMap<M extends Meta, B extends Body>
  extends _UppyEventMap<M, B>,
    DeprecatedUppyEventMap<M, B> {}

const defaultUploadState = {
  totalProgress: 0,
  allowNewUpload: true,
  error: null,
  recoveredState: null,
}

/**
 * Uppy Core module.
 * Manages plugins, state updates, acts as an event bus,
 * adds/removes files and metadata.
 */
export class Uppy<M extends Meta, B extends Body> {
  static VERSION = packageJson.version

  #plugins: Record<string, UnknownPlugin<M, B>[]> = Object.create(null)

  #restricter

  #storeUnsubscribe

  #emitter = ee()

  #preProcessors: Set<Processor> = new Set()

  #uploaders: Set<Processor> = new Set()

  #postProcessors: Set<Processor> = new Set()

  defaultLocale: Locale

  locale!: Locale

  // The user optionally passes in options, but we set defaults for missing options.
  // We consider all options present after the contructor has run.
  opts: NonNullableUppyOptions<M, B>

  store: NonNullableUppyOptions<M, B>['store']

  i18n!: I18n

  i18nArray!: Translator['translateArray']

  scheduledAutoProceed: ReturnType<typeof setTimeout> | null = null

  wasOffline = false

  /**
   * Instantiate Uppy
   */
  constructor(opts?: UppyOptionsWithOptionalRestrictions<M, B>) {
    this.defaultLocale = locale as any as Locale

    const defaultOptions: UppyOptions<Record<string, unknown>, B> = {
      id: 'uppy',
      autoProceed: false,
      allowMultipleUploadBatches: true,
      debug: false,
      restrictions: defaultRestrictionOptions,
      meta: {},
      onBeforeFileAdded: (file, files) => !Object.hasOwn(files, file.id),
      onBeforeUpload: (files) => files,
      store: new DefaultStore(),
      logger: justErrorsLogger,
      infoTimeout: 5000,
    }

    const merged = { ...defaultOptions, ...opts } as Omit<
      NonNullableUppyOptions<M, B>,
      'restrictions'
    >
    // Merge default options with the ones set by user,
    // making sure to merge restrictions too
    this.opts = {
      ...merged,
      restrictions: {
        ...(defaultOptions.restrictions as Restrictions),
        ...(opts && opts.restrictions),
      },
    }

    // Support debug: true for backwards-compatability, unless logger is set in opts
    // opts instead of this.opts to avoid comparing objects — we set logger: justErrorsLogger in defaultOptions
    if (opts && opts.logger && opts.debug) {
      this.log(
        'You are using a custom `logger`, but also set `debug: true`, which uses built-in logger to output logs to console. Ignoring `debug: true` and using your custom `logger`.',
        'warning',
      )
    } else if (opts && opts.debug) {
      this.opts.logger = debugLogger
    }

    this.log(`Using Core v${Uppy.VERSION}`)

    this.i18nInit()

    this.store = this.opts.store
    this.setState({
      ...defaultUploadState,
      plugins: {},
      files: {},
      currentUploads: {},
      capabilities: {
        uploadProgress: supportsUploadProgress(),
        individualCancellation: true,
        resumableUploads: false,
      },
      meta: { ...this.opts.meta },
      info: [],
    })

    this.#restricter = new Restricter<M, B>(() => this.opts, this.i18n)

    this.#storeUnsubscribe = this.store.subscribe(
      // eslint-disable-next-line
      // @ts-ignore Store is incorrectly typed
      (prevState, nextState, patch) => {
        // eslint-disable-next-line
        // @ts-ignore Store is incorrectly typed
        this.emit('state-update', prevState, nextState, patch)
        this.updateAll(nextState)
      },
    )

    // Exposing uppy object on window for debugging and testing
    if (this.opts.debug && typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Mutating the global object for debug purposes
      window[this.opts.id] = this
    }

    this.#addListeners()
  }

  emit<T extends keyof UppyEventMap<M, B>>(
    event: T,
    ...args: Parameters<UppyEventMap<M, B>[T]>
  ): void {
    this.#emitter.emit(event, ...args)
  }

  on<K extends keyof UppyEventMap<M, B>>(
    event: K,
    callback: UppyEventMap<M, B>[K],
  ): this {
    this.#emitter.on(event, callback)
    return this
  }

  once<K extends keyof UppyEventMap<M, B>>(
    event: K,
    callback: UppyEventMap<M, B>[K],
  ): this {
    this.#emitter.once(event, callback)
    return this
  }

  off<K extends keyof UppyEventMap<M, B>>(
    event: K,
    callback: UppyEventMap<M, B>[K],
  ): this {
    this.#emitter.off(event, callback)
    return this
  }

  /**
   * Iterate on all plugins and run `update` on them.
   * Called each time state changes.
   *
   */
  updateAll(state: Partial<State<M, B>>): void {
    this.iteratePlugins((plugin: UnknownPlugin<M, B>) => {
      plugin.update(state)
    })
  }

  /**
   * Updates state with a patch
   */
  setState(patch?: Partial<State<M, B>>): void {
    // eslint-disable-next-line
    // @ts-ignore Store is incorrectly typed
    this.store.setState(patch)
  }

  /**
   * Returns current state.
   */
  getState(): State<M, B> {
    // eslint-disable-next-line
    // @ts-ignore Store is incorrectly typed
    return this.store.getState()
  }

  patchFilesState(filesWithNewState: {
    [id: string]: Partial<UppyFile<M, B>>
  }): void {
    const existingFilesState = this.getState().files

    this.setState({
      files: {
        ...existingFilesState,
        ...Object.fromEntries(
          Object.entries(filesWithNewState).map(([fileID, newFileState]) => [
            fileID,
            {
              ...existingFilesState[fileID],
              ...newFileState,
            },
          ]),
        ),
      },
    })
  }

  /**
   * Shorthand to set state for a specific file.
   */
  setFileState(fileID: string, state: Partial<UppyFile<M, B>>): void {
    if (!this.getState().files[fileID]) {
      throw new Error(
        `Can’t set state for ${fileID} (the file could have been removed)`,
      )
    }

    this.patchFilesState({ [fileID]: state })
  }

  i18nInit(): void {
    const onMissingKey = (key: string): void =>
      this.log(`Missing i18n string: ${key}`, 'error')
    const translator = new Translator([this.defaultLocale, this.opts.locale], {
      onMissingKey,
    })
    this.i18n = translator.translate.bind(translator)
    this.i18nArray = translator.translateArray.bind(translator)
    this.locale = translator.locale
  }

  setOptions(newOpts: MinimalRequiredOptions<M, B>): void {
    this.opts = {
      ...this.opts,
      ...(newOpts as UppyOptions<M, B>),
      restrictions: {
        ...this.opts.restrictions,
        ...(newOpts?.restrictions as Restrictions),
      },
    }

    if (newOpts.meta) {
      this.setMeta(newOpts.meta)
    }

    this.i18nInit()

    if (newOpts.locale) {
      this.iteratePlugins((plugin) => {
        plugin.setOptions(newOpts)
      })
    }

    // Note: this is not the preact `setState`, it's an internal function that has the same name.
    this.setState(undefined) // so that UI re-renders with new options
  }

  // todo next major: remove
  resetProgress(): void {
    const defaultProgress: Omit<FileProgressNotStarted, 'bytesTotal'> = {
      percentage: 0,
      bytesUploaded: 0,
      uploadComplete: false,
      uploadStarted: null,
    }
    const files = { ...this.getState().files }
    const updatedFiles: State<M, B>['files'] = {}

    Object.keys(files).forEach((fileID) => {
      updatedFiles[fileID] = {
        ...files[fileID],
        progress: {
          ...files[fileID].progress,
          ...defaultProgress,
        },
      }
    })

    this.setState({ files: updatedFiles, ...defaultUploadState })

    this.emit('reset-progress')
  }

  // @todo next major: rename to `clear()`, make it also cancel ongoing uploads
  // or throw and say you need to cancel manually
  clearUploadedFiles(): void {
    this.setState({ ...defaultUploadState, files: {} })
  }

  addPreProcessor(fn: Processor): void {
    this.#preProcessors.add(fn)
  }

  removePreProcessor(fn: Processor): boolean {
    return this.#preProcessors.delete(fn)
  }

  addPostProcessor(fn: Processor): void {
    this.#postProcessors.add(fn)
  }

  removePostProcessor(fn: Processor): boolean {
    return this.#postProcessors.delete(fn)
  }

  addUploader(fn: Processor): void {
    this.#uploaders.add(fn)
  }

  removeUploader(fn: Processor): boolean {
    return this.#uploaders.delete(fn)
  }

  setMeta(data: Partial<M>): void {
    const updatedMeta = { ...this.getState().meta, ...data }
    const updatedFiles = { ...this.getState().files }

    Object.keys(updatedFiles).forEach((fileID) => {
      updatedFiles[fileID] = {
        ...updatedFiles[fileID],
        meta: { ...updatedFiles[fileID].meta, ...data },
      }
    })

    this.log('Adding metadata:')
    this.log(data)

    this.setState({
      meta: updatedMeta,
      files: updatedFiles,
    })
  }

  setFileMeta(fileID: string, data: State<M, B>['meta']): void {
    const updatedFiles = { ...this.getState().files }
    if (!updatedFiles[fileID]) {
      this.log(
        'Was trying to set metadata for a file that has been removed: ',
        fileID,
      )
      return
    }
    const newMeta = { ...updatedFiles[fileID].meta, ...data }
    updatedFiles[fileID] = { ...updatedFiles[fileID], meta: newMeta }
    this.setState({ files: updatedFiles })
  }

  /**
   * Get a file object.
   */
  getFile(fileID: string): UppyFile<M, B> {
    return this.getState().files[fileID]
  }

  /**
   * Get all files in an array.
   */
  getFiles(): UppyFile<M, B>[] {
    const { files } = this.getState()
    return Object.values(files)
  }

  getFilesByIds(ids: string[]): UppyFile<M, B>[] {
    return ids.map((id) => this.getFile(id))
  }

  // TODO: remove or refactor this method. It's very inefficient
  getObjectOfFilesPerState(): {
    newFiles: UppyFile<M, B>[]
    startedFiles: UppyFile<M, B>[]
    uploadStartedFiles: UppyFile<M, B>[]
    pausedFiles: UppyFile<M, B>[]
    completeFiles: UppyFile<M, B>[]
    erroredFiles: UppyFile<M, B>[]
    inProgressFiles: UppyFile<M, B>[]
    inProgressNotPausedFiles: UppyFile<M, B>[]
    processingFiles: UppyFile<M, B>[]
    isUploadStarted: boolean
    isAllComplete: boolean
    isAllErrored: boolean
    isAllPaused: boolean
    isUploadInProgress: boolean
    isSomeGhost: boolean
  } {
    const { files: filesObject, totalProgress, error } = this.getState()
    const files = Object.values(filesObject)
    const inProgressFiles = files.filter(
      ({ progress }) => !progress.uploadComplete && progress.uploadStarted,
    )
    const newFiles = files.filter((file) => !file.progress.uploadStarted)
    const startedFiles = files.filter(
      (file) =>
        file.progress.uploadStarted ||
        file.progress.preprocess ||
        file.progress.postprocess,
    )
    const uploadStartedFiles = files.filter(
      (file) => file.progress.uploadStarted,
    )
    const pausedFiles = files.filter((file) => file.isPaused)
    const completeFiles = files.filter((file) => file.progress.uploadComplete)
    const erroredFiles = files.filter((file) => file.error)
    const inProgressNotPausedFiles = inProgressFiles.filter(
      (file) => !file.isPaused,
    )
    const processingFiles = files.filter(
      (file) => file.progress.preprocess || file.progress.postprocess,
    )

    return {
      newFiles,
      startedFiles,
      uploadStartedFiles,
      pausedFiles,
      completeFiles,
      erroredFiles,
      inProgressFiles,
      inProgressNotPausedFiles,
      processingFiles,

      isUploadStarted: uploadStartedFiles.length > 0,
      isAllComplete:
        totalProgress === 100 &&
        completeFiles.length === files.length &&
        processingFiles.length === 0,
      isAllErrored: !!error && erroredFiles.length === files.length,
      isAllPaused:
        inProgressFiles.length !== 0 &&
        pausedFiles.length === inProgressFiles.length,
      isUploadInProgress: inProgressFiles.length > 0,
      isSomeGhost: files.some((file) => file.isGhost),
    }
  }

  #informAndEmit(
    errors: {
      name: string
      message: string
      isUserFacing?: boolean
      details?: string
      isRestriction?: boolean
      file?: UppyFile<M, B>
    }[],
  ): void {
    for (const error of errors) {
      if (error.isRestriction) {
        this.emit(
          'restriction-failed',
          error.file,
          error as RestrictionError<M, B>,
        )
      } else {
        this.emit('error', error, error.file)
      }
      this.log(error, 'warning')
    }

    const userFacingErrors = errors.filter((error) => error.isUserFacing)

    // don't flood the user: only show the first 4 toasts
    const maxNumToShow = 4
    const firstErrors = userFacingErrors.slice(0, maxNumToShow)
    const additionalErrors = userFacingErrors.slice(maxNumToShow)
    firstErrors.forEach(({ message, details = '' }) => {
      this.info({ message, details }, 'error', this.opts.infoTimeout)
    })

    if (additionalErrors.length > 0) {
      this.info({
        message: this.i18n('additionalRestrictionsFailed', {
          count: additionalErrors.length,
        }),
      })
    }
  }

  validateRestrictions(
    file: ValidateableFile<M, B>,
    files: ValidateableFile<M, B>[] = this.getFiles(),
  ): RestrictionError<M, B> | null {
    try {
      this.#restricter.validate(files, [file])
    } catch (err) {
      return err as any
    }
    return null
  }

  #checkRequiredMetaFieldsOnFile(file: UppyFile<M, B>): boolean {
    const { missingFields, error } =
      this.#restricter.getMissingRequiredMetaFields(file)

    if (missingFields.length > 0) {
      this.setFileState(file.id, { missingRequiredMetaFields: missingFields })
      this.log(error.message)
      this.emit('restriction-failed', file, error)
      return false
    }
    return true
  }

  #checkRequiredMetaFields(files: State<M, B>['files']): boolean {
    let success = true
    for (const file of Object.values(files)) {
      if (!this.#checkRequiredMetaFieldsOnFile(file)) {
        success = false
      }
    }
    return success
  }

  #assertNewUploadAllowed(file?: UppyFile<M, B>): void {
    const { allowNewUpload } = this.getState()

    if (allowNewUpload === false) {
      const error = new RestrictionError<M, B>(
        this.i18n('noMoreFilesAllowed'),
        {
          file,
        },
      )
      this.#informAndEmit([error])
      throw error
    }
  }

  checkIfFileAlreadyExists(fileID: string): boolean {
    const { files } = this.getState()

    if (files[fileID] && !files[fileID].isGhost) {
      return true
    }
    return false
  }

  /**
   * Create a file state object based on user-provided `addFile()` options.
   */
  #transformFile(fileDescriptorOrFile: File | UppyFile<M, B>): UppyFile<M, B> {
    // Uppy expects files in { name, type, size, data } format.
    // If the actual File object is passed from input[type=file] or drag-drop,
    // we normalize it to match Uppy file object
    const file = (
      fileDescriptorOrFile instanceof File ?
        {
          name: fileDescriptorOrFile.name,
          type: fileDescriptorOrFile.type,
          size: fileDescriptorOrFile.size,
          data: fileDescriptorOrFile,
        }
      : fileDescriptorOrFile) as UppyFile<M, B>

    const fileType = getFileType(file)
    const fileName = getFileName(fileType, file)
    const fileExtension = getFileNameAndExtension(fileName).extension
    const id = getSafeFileId(file)

    const meta = file.meta || {}
    meta.name = fileName
    meta.type = fileType

    // `null` means the size is unknown.
    const size = Number.isFinite(file.data.size) ? file.data.size : null

    return {
      source: file.source || '',
      id,
      name: fileName,
      extension: fileExtension || '',
      meta: {
        ...this.getState().meta,
        ...meta,
      },
      type: fileType,
      data: file.data,
      progress: {
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: size,
        uploadComplete: false,
        uploadStarted: null,
      } satisfies FileProgressNotStarted,
      size,
      isGhost: false,
      isRemote: file.isRemote || false,
      // TODO: this should not be a string
      // @ts-expect-error wrong
      remote: file.remote || '',
      preview: file.preview,
    }
  }

  // Schedule an upload if `autoProceed` is enabled.
  #startIfAutoProceed(): void {
    if (this.opts.autoProceed && !this.scheduledAutoProceed) {
      this.scheduledAutoProceed = setTimeout(() => {
        this.scheduledAutoProceed = null
        this.upload().catch((err) => {
          if (!err.isRestriction) {
            this.log(err.stack || err.message || err)
          }
        })
      }, 4)
    }
  }

  #checkAndUpdateFileState(filesToAdd: UppyFile<M, B>[]): {
    nextFilesState: State<M, B>['files']
    validFilesToAdd: UppyFile<M, B>[]
    errors: RestrictionError<M, B>[]
  } {
    const { files: existingFiles } = this.getState()

    // create a copy of the files object only once
    const nextFilesState = { ...existingFiles }
    const validFilesToAdd: UppyFile<M, B>[] = []
    const errors: RestrictionError<M, B>[] = []

    for (const fileToAdd of filesToAdd) {
      try {
        let newFile = this.#transformFile(fileToAdd)

        // If a file has been recovered (Golden Retriever), but we were unable to recover its data (probably too large),
        // users are asked to re-select these half-recovered files and then this method will be called again.
        // In order to keep the progress, meta and everything else, we keep the existing file,
        // but we replace `data`, and we remove `isGhost`, because the file is no longer a ghost now
        const isGhost = existingFiles[newFile.id]?.isGhost
        if (isGhost) {
          const existingFileState = existingFiles[newFile.id]
          newFile = {
            ...existingFileState,
            isGhost: false,
            data: fileToAdd.data,
          }
          this.log(
            `Replaced the blob in the restored ghost file: ${newFile.name}, ${newFile.id}`,
          )
        }

        const onBeforeFileAddedResult = this.opts.onBeforeFileAdded(
          newFile,
          nextFilesState,
        )

        if (
          !onBeforeFileAddedResult &&
          this.checkIfFileAlreadyExists(newFile.id)
        ) {
          throw new RestrictionError(
            this.i18n('noDuplicates', { fileName: newFile.name }),
            { file: fileToAdd },
          )
        }

        // Pass through reselected files from Golden Retriever
        if (onBeforeFileAddedResult === false && !isGhost) {
          // Don’t show UI info for this error, as it should be done by the developer
          throw new RestrictionError(
            'Cannot add the file because onBeforeFileAdded returned false.',
            { isUserFacing: false, file: fileToAdd },
          )
        } else if (
          typeof onBeforeFileAddedResult === 'object' &&
          onBeforeFileAddedResult !== null
        ) {
          newFile = onBeforeFileAddedResult
        }

        this.#restricter.validateSingleFile(newFile)

        // need to add it to the new local state immediately, so we can use the state to validate the next files too
        nextFilesState[newFile.id] = newFile
        validFilesToAdd.push(newFile)
      } catch (err) {
        errors.push(err as any)
      }
    }

    try {
      // need to run this separately because it's much more slow, so if we run it inside the for-loop it will be very slow
      // when many files are added
      this.#restricter.validateAggregateRestrictions(
        Object.values(existingFiles),
        validFilesToAdd,
      )
    } catch (err) {
      errors.push(err as any)

      // If we have any aggregate error, don't allow adding this batch
      return {
        nextFilesState: existingFiles,
        validFilesToAdd: [],
        errors,
      }
    }

    return {
      nextFilesState,
      validFilesToAdd,
      errors,
    }
  }

  /**
   * Add a new file to `state.files`. This will run `onBeforeFileAdded`,
   * try to guess file type in a clever way, check file against restrictions,
   * and start an upload if `autoProceed === true`.
   */
  addFile(file: File | MinimalRequiredUppyFile<M, B>): UppyFile<M, B>['id'] {
    this.#assertNewUploadAllowed(file as UppyFile<M, B>)

    const { nextFilesState, validFilesToAdd, errors } =
      this.#checkAndUpdateFileState([file as UppyFile<M, B>])

    const restrictionErrors = errors.filter((error) => error.isRestriction)
    this.#informAndEmit(restrictionErrors)

    if (errors.length > 0) throw errors[0]

    this.setState({ files: nextFilesState })

    const [firstValidFileToAdd] = validFilesToAdd

    this.emit('file-added', firstValidFileToAdd)
    this.emit('files-added', validFilesToAdd)
    this.log(
      `Added file: ${firstValidFileToAdd.name}, ${firstValidFileToAdd.id}, mime type: ${firstValidFileToAdd.type}`,
    )

    this.#startIfAutoProceed()

    return firstValidFileToAdd.id
  }

  /**
   * Add multiple files to `state.files`. See the `addFile()` documentation.
   *
   * If an error occurs while adding a file, it is logged and the user is notified.
   * This is good for UI plugins, but not for programmatic use.
   * Programmatic users should usually still use `addFile()` on individual files.
   */
  addFiles(fileDescriptors: MinimalRequiredUppyFile<M, B>[]): void {
    this.#assertNewUploadAllowed()

    const { nextFilesState, validFilesToAdd, errors } =
      this.#checkAndUpdateFileState(fileDescriptors as UppyFile<M, B>[])

    const restrictionErrors = errors.filter((error) => error.isRestriction)
    this.#informAndEmit(restrictionErrors)

    const nonRestrictionErrors = errors.filter((error) => !error.isRestriction)

    if (nonRestrictionErrors.length > 0) {
      let message = 'Multiple errors occurred while adding files:\n'
      nonRestrictionErrors.forEach((subError) => {
        message += `\n * ${subError.message}`
      })

      this.info(
        {
          message: this.i18n('addBulkFilesFailed', {
            smart_count: nonRestrictionErrors.length,
          }),
          details: message,
        },
        'error',
        this.opts.infoTimeout,
      )

      if (typeof AggregateError === 'function') {
        throw new AggregateError(nonRestrictionErrors, message)
      } else {
        const err = new Error(message)
        // @ts-expect-error fallback when AggregateError is not available
        err.errors = nonRestrictionErrors
        throw err
      }
    }

    // OK, we haven't thrown an error, we can start updating state and emitting events now:

    this.setState({ files: nextFilesState })

    validFilesToAdd.forEach((file) => {
      this.emit('file-added', file)
    })

    this.emit('files-added', validFilesToAdd)

    if (validFilesToAdd.length > 5) {
      this.log(`Added batch of ${validFilesToAdd.length} files`)
    } else {
      Object.values(validFilesToAdd).forEach((file) => {
        this.log(
          `Added file: ${file.name}\n id: ${file.id}\n type: ${file.type}`,
        )
      })
    }

    if (validFilesToAdd.length > 0) {
      this.#startIfAutoProceed()
    }
  }

  removeFiles(fileIDs: string[], reason?: FileRemoveReason): void {
    const { files, currentUploads } = this.getState()
    const updatedFiles = { ...files }
    const updatedUploads = { ...currentUploads }

    const removedFiles = Object.create(null)
    fileIDs.forEach((fileID) => {
      if (files[fileID]) {
        removedFiles[fileID] = files[fileID]
        delete updatedFiles[fileID]
      }
    })

    // Remove files from the `fileIDs` list in each upload.
    function fileIsNotRemoved(uploadFileID: string): boolean {
      return removedFiles[uploadFileID] === undefined
    }

    Object.keys(updatedUploads).forEach((uploadID) => {
      const newFileIDs =
        currentUploads[uploadID].fileIDs.filter(fileIsNotRemoved)

      // Remove the upload if no files are associated with it anymore.
      if (newFileIDs.length === 0) {
        delete updatedUploads[uploadID]
        return
      }

      const { capabilities } = this.getState()
      if (
        newFileIDs.length !== currentUploads[uploadID].fileIDs.length &&
        !capabilities.individualCancellation
      ) {
        throw new Error('individualCancellation is disabled')
      }

      updatedUploads[uploadID] = {
        ...currentUploads[uploadID],
        fileIDs: newFileIDs,
      }
    })

    const stateUpdate: Partial<State<M, B>> = {
      currentUploads: updatedUploads,
      files: updatedFiles,
    }

    // If all files were removed - allow new uploads,
    // and clear recoveredState
    if (Object.keys(updatedFiles).length === 0) {
      stateUpdate.allowNewUpload = true
      stateUpdate.error = null
      stateUpdate.recoveredState = null
    }

    this.setState(stateUpdate)
    this.calculateTotalProgress()

    const removedFileIDs = Object.keys(removedFiles)
    removedFileIDs.forEach((fileID) => {
      this.emit('file-removed', removedFiles[fileID], reason)
    })

    if (removedFileIDs.length > 5) {
      this.log(`Removed ${removedFileIDs.length} files`)
    } else {
      this.log(`Removed files: ${removedFileIDs.join(', ')}`)
    }
  }

  removeFile(fileID: string, reason?: FileRemoveReason): void {
    this.removeFiles([fileID], reason)
  }

  pauseResume(fileID: string): boolean | undefined {
    if (
      !this.getState().capabilities.resumableUploads ||
      this.getFile(fileID).progress.uploadComplete
    ) {
      return undefined
    }

    const wasPaused = this.getFile(fileID).isPaused || false
    const isPaused = !wasPaused

    this.setFileState(fileID, {
      isPaused,
    })

    this.emit('upload-pause', fileID, isPaused)

    return isPaused
  }

  pauseAll(): void {
    const updatedFiles = { ...this.getState().files }
    const inProgressUpdatedFiles = Object.keys(updatedFiles).filter((file) => {
      return (
        !updatedFiles[file].progress.uploadComplete &&
        updatedFiles[file].progress.uploadStarted
      )
    })

    inProgressUpdatedFiles.forEach((file) => {
      const updatedFile = { ...updatedFiles[file], isPaused: true }
      updatedFiles[file] = updatedFile
    })

    this.setState({ files: updatedFiles })
    this.emit('pause-all')
  }

  resumeAll(): void {
    const updatedFiles = { ...this.getState().files }
    const inProgressUpdatedFiles = Object.keys(updatedFiles).filter((file) => {
      return (
        !updatedFiles[file].progress.uploadComplete &&
        updatedFiles[file].progress.uploadStarted
      )
    })

    inProgressUpdatedFiles.forEach((file) => {
      const updatedFile = {
        ...updatedFiles[file],
        isPaused: false,
        error: null,
      }
      updatedFiles[file] = updatedFile
    })
    this.setState({ files: updatedFiles })

    this.emit('resume-all')
  }

  retryAll(): Promise<UploadResult<M, B> | undefined> {
    const updatedFiles = { ...this.getState().files }
    const filesToRetry = Object.keys(updatedFiles).filter((file) => {
      return updatedFiles[file].error
    })

    filesToRetry.forEach((file) => {
      const updatedFile = {
        ...updatedFiles[file],
        isPaused: false,
        error: null,
      }
      updatedFiles[file] = updatedFile
    })
    this.setState({
      files: updatedFiles,
      error: null,
    })

    this.emit('retry-all', filesToRetry)

    if (filesToRetry.length === 0) {
      return Promise.resolve({
        successful: [],
        failed: [],
      })
    }

    const uploadID = this.#createUpload(filesToRetry, {
      forceAllowNewUpload: true, // create new upload even if allowNewUpload: false
    })
    return this.#runUpload(uploadID)
  }

  cancelAll({ reason = 'user' }: { reason?: FileRemoveReason } = {}): void {
    this.emit('cancel-all', { reason })

    // Only remove existing uploads if user is canceling
    if (reason === 'user') {
      const { files } = this.getState()

      const fileIDs = Object.keys(files)
      if (fileIDs.length) {
        this.removeFiles(fileIDs, 'cancel-all')
      }

      this.setState(defaultUploadState)
      // todo should we call this.emit('reset-progress') like we do for resetProgress?
    }
  }

  retryUpload(fileID: string): Promise<UploadResult<M, B> | undefined> {
    this.setFileState(fileID, {
      error: null,
      isPaused: false,
    })

    this.emit('upload-retry', fileID)

    const uploadID = this.#createUpload([fileID], {
      forceAllowNewUpload: true, // create new upload even if allowNewUpload: false
    })
    return this.#runUpload(uploadID)
  }

  logout(): void {
    this.iteratePlugins((plugin) => {
      ;(plugin as UnknownProviderPlugin<M, B>).provider?.logout?.()
    })
  }

  // ___Why throttle at 500ms?
  //    - We must throttle at >250ms for superfocus in Dashboard to work well
  //    (because animation takes 0.25s, and we want to wait for all animations to be over before refocusing).
  //    [Practical Check]: if thottle is at 100ms, then if you are uploading a file,
  //    and click 'ADD MORE FILES', - focus won't activate in Firefox.
  //    - We must throttle at around >500ms to avoid performance lags.
  //    [Practical Check] Firefox, try to upload a big file for a prolonged period of time. Laptop will start to heat up.
  // todo when uploading multiple files, this will cause problems because they share the same throttle,
  // meaning some files might never get their progress reported (eaten up by progress events from other files)
  calculateProgress = throttle(
    (file, data) => {
      const fileInState = this.getFile(file?.id)
      if (file == null || !fileInState) {
        this.log(
          `Not setting progress for a file that has been removed: ${file?.id}`,
        )
        return
      }

      if (fileInState.progress.percentage === 100) {
        this.log(
          `Not setting progress for a file that has been already uploaded: ${file.id}`,
        )
        return
      }

      // bytesTotal may be null or zero; in that case we can't divide by it
      const canHavePercentage =
        Number.isFinite(data.bytesTotal) && data.bytesTotal > 0
      this.setFileState(file.id, {
        progress: {
          ...fileInState.progress,
          bytesUploaded: data.bytesUploaded,
          bytesTotal: data.bytesTotal,
          percentage:
            canHavePercentage ?
              Math.round((data.bytesUploaded / data.bytesTotal) * 100)
            : 0,
        },
      })

      this.calculateTotalProgress()
    },
    500,
    { leading: true, trailing: true },
  )

  calculateTotalProgress(): void {
    // calculate total progress, using the number of files currently uploading,
    // multiplied by 100 and the summ of individual progress of each file
    const files = this.getFiles()

    const inProgress = files.filter((file) => {
      return (
        file.progress.uploadStarted ||
        file.progress.preprocess ||
        file.progress.postprocess
      )
    })

    if (inProgress.length === 0) {
      this.emit('progress', 0)
      this.setState({ totalProgress: 0 })
      return
    }

    const sizedFiles = inProgress.filter(
      (file) => file.progress.bytesTotal != null,
    )
    const unsizedFiles = inProgress.filter(
      (file) => file.progress.bytesTotal == null,
    )

    if (sizedFiles.length === 0) {
      const progressMax = inProgress.length * 100
      const currentProgress = unsizedFiles.reduce((acc, file) => {
        return acc + (file.progress.percentage as number)
      }, 0)
      const totalProgress = Math.round((currentProgress / progressMax) * 100)
      this.setState({ totalProgress })
      return
    }

    let totalSize = sizedFiles.reduce((acc, file) => {
      return (acc + (file.progress.bytesTotal ?? 0)) as number
    }, 0)
    const averageSize = totalSize / sizedFiles.length
    totalSize += averageSize * unsizedFiles.length

    let uploadedSize = 0
    sizedFiles.forEach((file) => {
      uploadedSize += file.progress.bytesUploaded as number
    })
    unsizedFiles.forEach((file) => {
      uploadedSize += (averageSize * (file.progress.percentage || 0)) / 100
    })

    let totalProgress =
      totalSize === 0 ? 0 : Math.round((uploadedSize / totalSize) * 100)

    // hot fix, because:
    // uploadedSize ended up larger than totalSize, resulting in 1325% total
    if (totalProgress > 100) {
      totalProgress = 100
    }

    this.setState({ totalProgress })
    this.emit('progress', totalProgress)
  }

  /**
   * Registers listeners for all global actions, like:
   * `error`, `file-removed`, `upload-progress`
   */
  #addListeners(): void {
    // Type inference only works for inline functions so we have to type it again
    const errorHandler: UppyEventMap<M, B>['error'] = (
      error,
      file,
      response,
    ) => {
      let errorMsg = error.message || 'Unknown error'
      if (error.details) {
        errorMsg += ` ${error.details}`
      }

      this.setState({ error: errorMsg })

      if (file != null && file.id in this.getState().files) {
        this.setFileState(file.id, {
          error: errorMsg,
          response,
        })
      }
    }

    this.on('error', errorHandler)

    this.on('upload-error', (file, error, response) => {
      errorHandler(error, file, response)

      if (typeof error === 'object' && error.message) {
        this.log(error.message, 'error')
        const newError = new Error(
          this.i18n('failedToUpload', { file: file?.name ?? '' }),
        ) as any // we may want a new custom error here
        newError.isUserFacing = true // todo maybe don't do this with all errors?
        newError.details = error.message
        if (error.details) {
          newError.details += ` ${error.details}`
        }
        this.#informAndEmit([newError])
      } else {
        this.#informAndEmit([error])
      }
    })

    let uploadStalledWarningRecentlyEmitted: ReturnType<
      typeof setTimeout
    > | null = null
    this.on('upload-stalled', (error, files) => {
      const { message } = error
      const details = files.map((file) => file.meta.name).join(', ')
      if (!uploadStalledWarningRecentlyEmitted) {
        this.info({ message, details }, 'warning', this.opts.infoTimeout)
        uploadStalledWarningRecentlyEmitted = setTimeout(() => {
          uploadStalledWarningRecentlyEmitted = null
        }, this.opts.infoTimeout)
      }
      this.log(`${message} ${details}`.trim(), 'warning')
    })

    this.on('upload', () => {
      this.setState({ error: null })
    })

    const onUploadStarted = (files: UppyFile<M, B>[]): void => {
      const filesFiltered = files.filter((file) => {
        const exists = file != null && this.getFile(file.id)
        if (!exists)
          this.log(
            `Not setting progress for a file that has been removed: ${file?.id}`,
          )
        return exists
      })

      const filesState = Object.fromEntries(
        filesFiltered.map((file) => [
          file.id,
          {
            progress: {
              uploadStarted: Date.now(),
              uploadComplete: false,
              percentage: 0,
              bytesUploaded: 0,
              bytesTotal: file.size,
            } as FileProgressStarted,
          },
        ]),
      )

      this.patchFilesState(filesState)
    }

    this.on('upload-start', (files) => {
      files.forEach((file: UppyFile<M, B>) => {
        // todo backward compat, remove this event in a next major
        this.emit('upload-started', file)
      })
      onUploadStarted(files)
    })

    this.on('upload-progress', this.calculateProgress)

    this.on('upload-success', (file, uploadResp) => {
      if (file == null || !this.getFile(file.id)) {
        this.log(
          `Not setting progress for a file that has been removed: ${file?.id}`,
        )
        return
      }

      const currentProgress = this.getFile(file.id).progress
      this.setFileState(file.id, {
        progress: {
          ...currentProgress,
          postprocess:
            this.#postProcessors.size > 0 ?
              {
                mode: 'indeterminate',
              }
            : undefined,
          uploadComplete: true,
          percentage: 100,
          bytesUploaded: currentProgress.bytesTotal,
        } as FileProgressStarted,
        response: uploadResp,
        uploadURL: uploadResp.uploadURL,
        isPaused: false,
      })

      // Remote providers sometimes don't tell us the file size,
      // but we can know how many bytes we uploaded once the upload is complete.
      if (file.size == null) {
        this.setFileState(file.id, {
          size: uploadResp.bytesUploaded || currentProgress.bytesTotal,
        })
      }

      this.calculateTotalProgress()
    })

    this.on('preprocess-progress', (file, progress) => {
      if (file == null || !this.getFile(file.id)) {
        this.log(
          `Not setting progress for a file that has been removed: ${file?.id}`,
        )
        return
      }
      this.setFileState(file.id, {
        progress: { ...this.getFile(file.id).progress, preprocess: progress },
      })
    })

    this.on('preprocess-complete', (file) => {
      if (file == null || !this.getFile(file.id)) {
        this.log(
          `Not setting progress for a file that has been removed: ${file?.id}`,
        )
        return
      }
      const files = { ...this.getState().files }
      files[file.id] = {
        ...files[file.id],
        progress: { ...files[file.id].progress },
      }
      delete files[file.id].progress.preprocess

      this.setState({ files })
    })

    this.on('postprocess-progress', (file, progress) => {
      if (file == null || !this.getFile(file.id)) {
        this.log(
          `Not setting progress for a file that has been removed: ${file?.id}`,
        )
        return
      }
      this.setFileState(file.id, {
        progress: {
          ...this.getState().files[file.id].progress,
          postprocess: progress,
        },
      })
    })

    this.on('postprocess-complete', (file) => {
      if (file == null || !this.getFile(file.id)) {
        this.log(
          `Not setting progress for a file that has been removed: ${file?.id}`,
        )
        return
      }
      const files = {
        ...this.getState().files,
      }
      files[file.id] = {
        ...files[file.id],
        progress: {
          ...files[file.id].progress,
        },
      }
      delete files[file.id].progress.postprocess

      this.setState({ files })
    })

    this.on('restored', () => {
      // Files may have changed--ensure progress is still accurate.
      this.calculateTotalProgress()
    })

    // @ts-expect-error should fix itself when dashboard it typed (also this doesn't belong here)
    this.on('dashboard:file-edit-complete', (file) => {
      if (file) {
        this.#checkRequiredMetaFieldsOnFile(file)
      }
    })

    // show informer if offline
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', this.#updateOnlineStatus)
      window.addEventListener('offline', this.#updateOnlineStatus)
      setTimeout(this.#updateOnlineStatus, 3000)
    }
  }

  updateOnlineStatus(): void {
    const online = window.navigator.onLine ?? true
    if (!online) {
      this.emit('is-offline')
      this.info(this.i18n('noInternetConnection'), 'error', 0)
      this.wasOffline = true
    } else {
      this.emit('is-online')
      if (this.wasOffline) {
        this.emit('back-online')
        this.info(this.i18n('connectedToInternet'), 'success', 3000)
        this.wasOffline = false
      }
    }
  }

  #updateOnlineStatus = this.updateOnlineStatus.bind(this)

  getID(): string {
    return this.opts.id
  }

  /**
   * Registers a plugin with Core.
   */
  use<T extends typeof BasePlugin<any, M, B>>(
    Plugin: T,
    opts?: ConstructorParameters<T>[1],
  ): this {
    if (typeof Plugin !== 'function') {
      const msg =
        `Expected a plugin class, but got ${
          Plugin === null ? 'null' : typeof Plugin
        }.` +
        ' Please verify that the plugin was imported and spelled correctly.'
      throw new TypeError(msg)
    }

    // Instantiate
    const plugin = new Plugin(this, opts)
    const pluginId = plugin.id

    if (!pluginId) {
      throw new Error('Your plugin must have an id')
    }

    if (!plugin.type) {
      throw new Error('Your plugin must have a type')
    }

    const existsPluginAlready = this.getPlugin(pluginId)
    if (existsPluginAlready) {
      const msg =
        `Already found a plugin named '${existsPluginAlready.id}'. ` +
        `Tried to use: '${pluginId}'.\n` +
        'Uppy plugins must have unique `id` options. See https://uppy.io/docs/plugins/#id.'
      throw new Error(msg)
    }

    // @ts-expect-error does exist
    if (Plugin.VERSION) {
      // @ts-expect-error does exist
      this.log(`Using ${pluginId} v${Plugin.VERSION}`)
    }

    if (plugin.type in this.#plugins) {
      this.#plugins[plugin.type].push(plugin)
    } else {
      this.#plugins[plugin.type] = [plugin]
    }
    plugin.install()

    this.emit('plugin-added', plugin)

    return this
  }

  /**
   * Find one Plugin by name.
   */
  getPlugin(id: string): UnknownPlugin<M, B> | undefined {
    for (const plugins of Object.values(this.#plugins)) {
      const foundPlugin = plugins.find((plugin) => plugin.id === id)
      if (foundPlugin != null) return foundPlugin
    }
    return undefined
  }

  private [Symbol.for('uppy test: getPlugins')](
    type: string,
  ): UnknownPlugin<M, B>[] {
    return this.#plugins[type]
  }

  /**
   * Iterate through all `use`d plugins.
   *
   */
  iteratePlugins(method: (plugin: UnknownPlugin<M, B>) => void): void {
    Object.values(this.#plugins).flat(1).forEach(method)
  }

  /**
   * Uninstall and remove a plugin.
   *
   * @param {object} instance The plugin instance to remove.
   */
  removePlugin(instance: UnknownPlugin<M, B>): void {
    this.log(`Removing plugin ${instance.id}`)
    this.emit('plugin-remove', instance)

    if (instance.uninstall) {
      instance.uninstall()
    }

    const list = this.#plugins[instance.type]
    // list.indexOf failed here, because Vue3 converted the plugin instance
    // to a Proxy object, which failed the strict comparison test:
    // obj !== objProxy
    const index = list.findIndex((item) => item.id === instance.id)
    if (index !== -1) {
      list.splice(index, 1)
    }

    const state = this.getState()
    const updatedState = {
      plugins: {
        ...state.plugins,
        [instance.id]: undefined,
      },
    }
    this.setState(updatedState)
  }

  /**
   * Uninstall all plugins and close down this Uppy instance.
   */
  // @todo next major: rename to `destroy`.
  // Cancel local uploads, cancel remote uploads, DON'T cancel assemblies
  // document that if you do want to cancel assemblies, you need to call smth manually.
  // Potentially remove reason, as it’s confusing, just come up with a default behaviour.
  close({ reason }: { reason?: FileRemoveReason } | undefined = {}): void {
    this.log(
      `Closing Uppy instance ${this.opts.id}: removing all files and uninstalling plugins`,
    )

    this.cancelAll({ reason })

    this.#storeUnsubscribe()

    this.iteratePlugins((plugin) => {
      this.removePlugin(plugin)
    })

    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('online', this.#updateOnlineStatus)
      window.removeEventListener('offline', this.#updateOnlineStatus)
    }
  }

  hideInfo(): void {
    const { info } = this.getState()

    this.setState({ info: info.slice(1) })

    this.emit('info-hidden')
  }

  /**
   * Set info message in `state.info`, so that UI plugins like `Informer`
   * can display the message.
   */
  info(
    message:
      | string
      | { message: string; details?: string | Record<string, string> },
    type: LogLevel = 'info',
    duration = 3000,
  ): void {
    const isComplexMessage = typeof message === 'object'

    this.setState({
      info: [
        ...this.getState().info,
        {
          type,
          message: isComplexMessage ? message.message : message,
          details: isComplexMessage ? message.details : null,
        },
      ],
    })

    setTimeout(() => this.hideInfo(), duration)

    this.emit('info-visible')
  }

  /**
   * Passes messages to a function, provided in `opts.logger`.
   * If `opts.logger: Uppy.debugLogger` or `opts.debug: true`, logs to the browser console.
   */
  log(message: string | Record<any, any> | Error, type?: string): void {
    const { logger } = this.opts
    switch (type) {
      case 'error':
        logger.error(message)
        break
      case 'warning':
        logger.warn(message)
        break
      default:
        logger.debug(message)
        break
    }
  }

  // We need to store request clients by a unique ID, so we can share RequestClient instances across files
  // this allows us to do rate limiting and synchronous operations like refreshing provider tokens
  // example: refreshing tokens: if each file has their own requestclient,
  // we don't have any way to synchronize all requests in order to
  // - block all requests
  // - refresh the token
  // - unblock all requests and allow them to run with a the new access token
  // back when we had a requestclient per file, once an access token expired,
  // all 6 files would go ahead and refresh the token at the same time
  // (calling /refresh-token up to 6 times), which will probably fail for some providers
  #requestClientById = new Map<string, unknown>()

  registerRequestClient(id: string, client: unknown): void {
    this.#requestClientById.set(id, client)
  }

  /** @protected */
  getRequestClientForFile<Client>(file: UppyFile<M, B>): Client {
    if (!file.remote)
      throw new Error(
        `Tried to get RequestClient for a non-remote file ${file.id}`,
      )
    const requestClient = this.#requestClientById.get(
      file.remote.requestClientId,
    )
    if (requestClient == null)
      throw new Error(
        `requestClientId "${file.remote.requestClientId}" not registered for file "${file.id}"`,
      )
    return requestClient as Client
  }

  /**
   * Restore an upload by its ID.
   */
  restore(uploadID: string): Promise<UploadResult<M, B> | undefined> {
    this.log(`Core: attempting to restore upload "${uploadID}"`)

    if (!this.getState().currentUploads[uploadID]) {
      this.#removeUpload(uploadID)
      return Promise.reject(new Error('Nonexistent upload'))
    }

    return this.#runUpload(uploadID)
  }

  /**
   * Create an upload for a bunch of files.
   *
   */
  #createUpload(
    fileIDs: string[],
    opts: { forceAllowNewUpload?: boolean } = {},
  ): string {
    // uppy.retryAll sets this to true — when retrying we want to ignore `allowNewUpload: false`
    const { forceAllowNewUpload = false } = opts

    const { allowNewUpload, currentUploads } = this.getState()
    if (!allowNewUpload && !forceAllowNewUpload) {
      throw new Error('Cannot create a new upload: already uploading.')
    }

    const uploadID = nanoid()

    this.emit('upload', {
      id: uploadID,
      fileIDs,
    })

    this.setState({
      allowNewUpload:
        this.opts.allowMultipleUploadBatches !== false &&
        this.opts.allowMultipleUploads !== false,

      currentUploads: {
        ...currentUploads,
        [uploadID]: {
          fileIDs,
          step: 0,
          result: {},
        },
      },
    })

    return uploadID
  }

  private [Symbol.for('uppy test: createUpload')](...args: any[]): string {
    // @ts-expect-error https://github.com/microsoft/TypeScript/issues/47595
    return this.#createUpload(...args)
  }

  #getUpload(uploadID: string): CurrentUpload<M, B> {
    const { currentUploads } = this.getState()

    return currentUploads[uploadID]
  }

  /**
   * Add data to an upload's result object.
   */
  addResultData(uploadID: string, data: CurrentUpload<M, B>['result']): void {
    if (!this.#getUpload(uploadID)) {
      this.log(
        `Not setting result for an upload that has been removed: ${uploadID}`,
      )
      return
    }
    const { currentUploads } = this.getState()
    const currentUpload = {
      ...currentUploads[uploadID],
      result: { ...currentUploads[uploadID].result, ...data },
    }
    this.setState({
      currentUploads: { ...currentUploads, [uploadID]: currentUpload },
    })
  }

  /**
   * Remove an upload, eg. if it has been canceled or completed.
   *
   */
  #removeUpload(uploadID: string): void {
    const currentUploads = { ...this.getState().currentUploads }
    delete currentUploads[uploadID]

    this.setState({
      currentUploads,
    })
  }

  /**
   * Run an upload. This picks up where it left off in case the upload is being restored.
   */
  async #runUpload(uploadID: string): Promise<UploadResult<M, B> | undefined> {
    const getCurrentUpload = (): CurrentUpload<M, B> => {
      const { currentUploads } = this.getState()
      return currentUploads[uploadID]
    }

    let currentUpload = getCurrentUpload()

    const steps = [
      ...this.#preProcessors,
      ...this.#uploaders,
      ...this.#postProcessors,
    ]
    try {
      for (let step = currentUpload.step || 0; step < steps.length; step++) {
        if (!currentUpload) {
          break
        }
        const fn = steps[step]

        this.setState({
          currentUploads: {
            ...this.getState().currentUploads,
            [uploadID]: {
              ...currentUpload,
              step,
            },
          },
        })

        const { fileIDs } = currentUpload

        // TODO give this the `updatedUpload` object as its only parameter maybe?
        // Otherwise when more metadata may be added to the upload this would keep getting more parameters
        await fn(fileIDs, uploadID)

        // Update currentUpload value in case it was modified asynchronously.
        currentUpload = getCurrentUpload()
      }
    } catch (err) {
      this.#removeUpload(uploadID)
      throw err
    }

    // Set result data.
    if (currentUpload) {
      // Mark postprocessing step as complete if necessary; this addresses a case where we might get
      // stuck in the postprocessing UI while the upload is fully complete.
      // If the postprocessing steps do not do any work, they may not emit postprocessing events at
      // all, and never mark the postprocessing as complete. This is fine on its own but we
      // introduced code in the @uppy/core upload-success handler to prepare postprocessing progress
      // state if any postprocessors are registered. That is to avoid a "flash of completed state"
      // before the postprocessing plugins can emit events.
      //
      // So, just in case an upload with postprocessing plugins *has* completed *without* emitting
      // postprocessing completion, we do it instead.
      currentUpload.fileIDs.forEach((fileID) => {
        const file = this.getFile(fileID)
        if (file && file.progress.postprocess) {
          this.emit('postprocess-complete', file)
        }
      })

      const files = currentUpload.fileIDs.map((fileID) => this.getFile(fileID))
      const successful = files.filter((file) => !file.error)
      const failed = files.filter((file) => file.error)
      this.addResultData(uploadID, { successful, failed, uploadID })

      // Update currentUpload value in case it was modified asynchronously.
      currentUpload = getCurrentUpload()
    }
    // Emit completion events.
    // This is in a separate function so that the `currentUploads` variable
    // always refers to the latest state. In the handler right above it refers
    // to an outdated object without the `.result` property.
    let result
    if (currentUpload) {
      result = currentUpload.result
      this.emit('complete', result)

      this.#removeUpload(uploadID)
    }
    if (result == null) {
      this.log(
        `Not setting result for an upload that has been removed: ${uploadID}`,
      )
    }
    return result
  }

  /**
   * Start an upload for all the files that are not currently being uploaded.
   */
  upload(): Promise<NonNullable<UploadResult<M, B>> | undefined> {
    if (!this.#plugins['uploader']?.length) {
      this.log('No uploader type plugins are used', 'warning')
    }

    let { files } = this.getState()

    const onBeforeUploadResult = this.opts.onBeforeUpload(files)

    if (onBeforeUploadResult === false) {
      return Promise.reject(
        new Error(
          'Not starting the upload because onBeforeUpload returned false',
        ),
      )
    }

    if (onBeforeUploadResult && typeof onBeforeUploadResult === 'object') {
      files = onBeforeUploadResult
      // Updating files in state, because uploader plugins receive file IDs,
      // and then fetch the actual file object from state
      this.setState({
        files,
      })
    }

    return Promise.resolve()
      .then(() => this.#restricter.validateMinNumberOfFiles(files))
      .catch((err) => {
        this.#informAndEmit([err])
        throw err
      })
      .then(() => {
        if (!this.#checkRequiredMetaFields(files)) {
          throw new RestrictionError(this.i18n('missingRequiredMetaField'))
        }
      })
      .catch((err) => {
        // Doing this in a separate catch because we already emited and logged
        // all the errors in `checkRequiredMetaFields` so we only throw a generic
        // missing fields error here.
        throw err
      })
      .then(() => {
        const { currentUploads } = this.getState()
        // get a list of files that are currently assigned to uploads
        const currentlyUploadingFiles = Object.values(currentUploads).flatMap(
          (curr) => curr.fileIDs,
        )

        const waitingFileIDs: string[] = []
        Object.keys(files).forEach((fileID) => {
          const file = this.getFile(fileID)
          // if the file hasn't started uploading and hasn't already been assigned to an upload..
          if (
            !file.progress.uploadStarted &&
            currentlyUploadingFiles.indexOf(fileID) === -1
          ) {
            waitingFileIDs.push(file.id)
          }
        })

        const uploadID = this.#createUpload(waitingFileIDs)
        return this.#runUpload(uploadID)
      })
      .catch((err) => {
        this.emit('error', err)
        this.log(err, 'error')
        throw err
      })
  }
}

export default Uppy
