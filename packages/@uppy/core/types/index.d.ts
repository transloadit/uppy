import * as UppyUtils from '@uppy/utils'

// Utility types
type OmitKey<T, Key> = Pick<T, Exclude<keyof T, Key>>

type UploadHandler = (fileIDs: string[]) => Promise<void>

export interface IndexedObject<T> {
  [key: string]: T
  [key: number]: T
}

// These are defined in @uppy/utils instead of core so it can be used there without creating import cycles
export type UppyFile<
  TMeta extends IndexedObject<any> = Record<string, unknown>,
  TBody extends IndexedObject<any> = Record<string, unknown>
> = UppyUtils.UppyFile<TMeta, TBody>

// Replace the `meta` property type with one that allows omitting internal metadata addFile() will add that
type UppyFileWithoutMeta<TMeta, TBody> = OmitKey<
  UppyFile<TMeta, TBody>,
  'meta'
>

type LocaleStrings<TNames extends string> = {
  [K in TNames]?: string | { [n: number]: string }
}

type LogLevel = 'info' | 'warning' | 'error'

// This hack accepts _any_ string for `Event`, but also tricks VSCode and friends into providing autocompletions
// for the names listed. https://github.com/microsoft/TypeScript/issues/29729#issuecomment-505826972
// eslint-disable-next-line no-use-before-define
type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

type Event = LiteralUnion<
  | 'file-added'
  | 'file-removed'
  | 'upload'
  | 'upload-progress'
  | 'upload-success'
  | 'complete'
  | 'error'
  | 'upload-error'
  | 'upload-retry'
  | 'info-visible'
  | 'info-hidden'
  | 'cancel-all'
  | 'restriction-failed'
  | 'reset-progress'
>

export type Store = UppyUtils.Store

export type InternalMetadata = UppyUtils.InternalMetadata

export interface UploadedUppyFile<TMeta, TBody> extends UppyFile<TMeta, TBody> {
  uploadURL: string
}

export interface FailedUppyFile<TMeta, TBody> extends UppyFile<TMeta, TBody> {
  error: string
}

export interface AddFileOptions<
  TMeta = IndexedObject<any>,
  TBody = IndexedObject<any>
> extends Partial<UppyFileWithoutMeta<TMeta, TBody>> {
  // `.data` is the only required property here.
  data: Blob | File
  meta?: Partial<InternalMetadata> & TMeta
}

export interface PluginOptions {
  id?: string
}

export interface DefaultPluginOptions extends PluginOptions {
  [prop: string]: any
}

export class BasePlugin<TOptions extends PluginOptions = DefaultPluginOptions> {
  id: string

  // eslint-disable-next-line no-use-before-define
  uppy: Uppy

  type: string

  // eslint-disable-next-line no-use-before-define
  constructor(uppy: Uppy, opts?: TOptions)

  setOptions(update: Partial<TOptions>): void

  getPluginState(): Record<string, unknown>

  setPluginState(update: IndexedObject<any>): Record<string, unknown>

  install(): void

  uninstall(): void
}

export class UIPlugin<TOptions extends PluginOptions = DefaultPluginOptions> extends BasePlugin<TOptions> {
  id: string

  // eslint-disable-next-line no-use-before-define
  uppy: Uppy

  type: string

  // eslint-disable-next-line no-use-before-define
  constructor(uppy: Uppy, opts?: TOptions)

  update(state?: Record<string, unknown>): void

  // eslint-disable-next-line no-use-before-define
  mount(target: PluginTarget, plugin: typeof UIPlugin): void

  render(state: Record<string, unknown>): void

  addTarget<TPlugin extends UIPlugin>(plugin: TPlugin): void

  unmount(): void
}

export type PluginTarget =
  | string
  | Element
  | typeof BasePlugin
  | typeof UIPlugin

export interface Locale<TNames extends string = string> {
  strings: LocaleStrings<TNames>
  pluralize?: (n: number) => number
}

export interface Restrictions {
  maxFileSize?: number | null
  minFileSize?: number | null
  maxTotalFileSize?: number | null
  maxNumberOfFiles?: number | null
  minNumberOfFiles?: number | null
  allowedFileTypes?: string[] | null
}

export interface UppyOptions<TMeta extends IndexedObject<any> = Record<string, unknown>> {
  id?: string
  autoProceed?: boolean
  allowMultipleUploads?: boolean
  debug?: boolean
  restrictions?: Restrictions
  meta?: TMeta
  onBeforeFileAdded?: (
    currentFile: UppyFile<TMeta>,
    files: { [key: string]: UppyFile<TMeta> }
  ) => UppyFile<TMeta> | boolean | undefined
  onBeforeUpload?: (files: {
    [key: string]: UppyFile<TMeta>
  }) => { [key: string]: UppyFile<TMeta> } | boolean
  locale?: Locale
  store?: Store
  infoTimeout?: number
}

export interface UploadResult<
  TMeta extends IndexedObject<any> = Record<string, unknown>,
  TBody extends IndexedObject<any> = Record<string, unknown>
> {
  successful: UploadedUppyFile<TMeta, TBody>[]
  failed: FailedUppyFile<TMeta, TBody>[]
}

export interface State<
  TMeta extends IndexedObject<any> = Record<string, unknown>,
  TBody extends IndexedObject<any> = Record<string, unknown>
> extends IndexedObject<any> {
  capabilities?: { resumableUploads?: boolean }
  currentUploads: Record<string, unknown>
  error?: string
  files: {
    [key: string]:
      | UploadedUppyFile<TMeta, TBody>
      | FailedUppyFile<TMeta, TBody>
  }
  info?: {
    isHidden: boolean
    type: string
    message: string
    details: string
  }
  plugins?: IndexedObject<any>
  totalProgress: number
}

type UploadSuccessCallback<T> = (file: UppyFile<T>, body: any, uploadURL: string) => void
type UploadCompleteCallback<T> = (result: UploadResult<T>) => void

export class Uppy {
  constructor(opts?: UppyOptions)

  on<TMeta extends IndexedObject<any> = Record<string, unknown>>(event: 'upload-success', callback: UploadSuccessCallback<TMeta>): this

  on<TMeta extends IndexedObject<any> = Record<string, unknown>>(event: 'complete', callback: UploadCompleteCallback<TMeta>): this

  on(event: Event, callback: (...args: any[]) => void): this

  once<TMeta extends IndexedObject<any> = Record<string, unknown>>(event: 'upload-success', callback: UploadSuccessCallback<TMeta>): this

  once<TMeta extends IndexedObject<any> = Record<string, unknown>>(event: 'complete', callback: UploadCompleteCallback<TMeta>): this

  once(event: Event, callback: (...args: any[]) => void): this

  off(event: Event, callback: (...args: any[]) => void): this

  off(event: Event, callback: (...args: any[]) => void): this

  /**
   * For use by plugins only.
   */
  emit(event: Event, ...args: any[]): void

  updateAll(state: Record<string, unknown>): void

  setOptions(update: Partial<UppyOptions>): void

  setState(patch: Record<string, unknown>): void

  getState<TMeta extends IndexedObject<any> = Record<string, unknown>>(): State<TMeta>

  readonly state: State

  setFileState(fileID: string, state: Record<string, unknown>): void

  resetProgress(): void

  addPreProcessor(fn: UploadHandler): void

  removePreProcessor(fn: UploadHandler): void

  addPostProcessor(fn: UploadHandler): void

  removePostProcessor(fn: UploadHandler): void

  addUploader(fn: UploadHandler): void

  removeUploader(fn: UploadHandler): void

  setMeta<TMeta extends IndexedObject<any> = Record<string, unknown>>(data: TMeta): void

  setFileMeta<TMeta extends IndexedObject<any> = Record<string, unknown>>(
    fileID: string,
    data: TMeta
  ): void

  getFile<
    TMeta extends IndexedObject<any> = Record<string, unknown>,
    TBody extends IndexedObject<any> = Record<string, unknown>
  >(fileID: string): UppyFile<TMeta, TBody>

  getFiles<
    TMeta extends IndexedObject<any> = Record<string, unknown>,
    TBody extends IndexedObject<any> = Record<string, unknown>
  >(): Array<UppyFile<TMeta, TBody>>

  getObjectOfFilesPerState(): {
    newFiles: Array<UppyFile>
    startedFiles: Array<UppyFile>
    uploadStartedFiles: Array<UppyFile>
    pausedFiles: Array<UppyFile>
    completeFiles: Array<UppyFile>
    erroredFiles: Array<UppyFile>
    inProgressFiles: Array<UppyFile>
    inProgressNotPausedFiles: Array<UppyFile>
    processingFiles: Array<UppyFile>
    isUploadStarted: boolean
    isAllComplete: boolean
    isAllErrored: boolean
    isAllPaused: boolean
    isUploadInProgress: boolean
    isSomeGhost: boolean
  }

  addFile<TMeta extends IndexedObject<any> = Record<string, unknown>>(
    file: AddFileOptions<TMeta>
  ): string

  removeFile(fileID: string): void

  pauseResume(fileID: string): boolean

  pauseAll(): void

  resumeAll(): void

  retryAll<TMeta extends IndexedObject<any> = Record<string, unknown>>(): Promise<
    UploadResult<TMeta>
  >

  cancelAll(): void

  retryUpload<TMeta extends IndexedObject<any> = Record<string, unknown>>(
    fileID: string
  ): Promise<UploadResult<TMeta>>

  reset(): void

  getID(): string

  use<TOptions, TInstance extends UIPlugin | BasePlugin<TOptions>>(
    pluginClass: new (uppy: this, opts: TOptions) => TInstance,
    opts?: TOptions
  ): this

  getPlugin<TPlugin extends UIPlugin | BasePlugin>(name: string): TPlugin | undefined

  iteratePlugins(callback: (plugin: UIPlugin | BasePlugin) => void): void

  removePlugin(instance: UIPlugin | BasePlugin): void

  close(): void

  logout(): void

  info(
    message: string | { message: string; details: string },
    type?: LogLevel,
    duration?: number
  ): void

  hideInfo(): void

  log(msg: string, type?: LogLevel): void

  restore<TMeta extends IndexedObject<any> = Record<string, unknown>>(
    uploadID: string
  ): Promise<UploadResult<TMeta>>

  addResultData(uploadID: string, data: Record<string, unknown>): void

  upload<TMeta extends IndexedObject<any> = Record<string, unknown>>(): Promise<UploadResult<TMeta>>
}

export default Uppy
