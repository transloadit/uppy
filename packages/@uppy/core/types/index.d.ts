import UppyUtils = require('@uppy/utils')

declare module Uppy {
  // Utility types
  type OmitKey<T, Key> = Pick<T, Exclude<keyof T, Key>>

  // These are defined in @uppy/utils instead of core so it can be used there without creating import cycles
  export type UppyFile<
    TMeta extends IndexedObject<any> = {},
    TBody extends IndexedObject<any> = {}
  > = UppyUtils.UppyFile<TMeta, TBody>
  export type Store = UppyUtils.Store
  export type InternalMetadata = UppyUtils.InternalMetadata

  interface IndexedObject<T> {
    [key: string]: T
    [key: number]: T
  }

  interface UploadedUppyFile<TMeta, TBody> extends UppyFile<TMeta, TBody> {
    uploadURL: string
  }

  interface FailedUppyFile<TMeta, TBody> extends UppyFile<TMeta, TBody> {
    error: string
  }

  // Replace the `meta` property type with one that allows omitting internal metadata; addFile() will add that
  type UppyFileWithoutMeta<TMeta, TBody> = OmitKey<
    UppyFile<TMeta, TBody>,
    'meta'
  >
  interface AddFileOptions<
    TMeta = IndexedObject<any>,
    TBody = IndexedObject<any>
  > extends Partial<UppyFileWithoutMeta<TMeta, TBody>> {
    // `.data` is the only required property here.
    data: Blob | File
    meta?: Partial<InternalMetadata> & TMeta
  }

  interface PluginOptions {
    id?: string
  }
  interface DefaultPluginOptions extends PluginOptions {
    [prop: string]: any
  }

  type PluginTarget = string | Element | typeof Plugin

  class Plugin<TOptions extends PluginOptions = DefaultPluginOptions> {
    id: string
    uppy: Uppy
    type: string
    constructor(uppy: Uppy, opts?: TOptions)
    setOptions(update: Partial<TOptions>): void
    getPluginState(): object
    setPluginState(update: IndexedObject<any>): object
    update(state?: object): void
    mount(target: PluginTarget, plugin: typeof Plugin): void
    render(state: object): void
    addTarget<TPlugin extends Plugin>(plugin: TPlugin): void
    unmount(): void
    install(): void
    uninstall(): void
  }

  type LocaleStrings<TNames extends string> = {
    [K in TNames]?: string | { [n: number]: string }
  }
  interface Locale<TNames extends string = string> {
    strings: LocaleStrings<TNames>
    pluralize?: (n: number) => number
  }

  interface Restrictions {
    maxFileSize?: number | null
    minFileSize?: number | null
    maxTotalFileSize?: number | null
    maxNumberOfFiles?: number | null
    minNumberOfFiles?: number | null
    allowedFileTypes?: string[] | null
  }

  interface UppyOptions<TMeta extends IndexedObject<any> = {}> {
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

  interface UploadResult<
    TMeta extends IndexedObject<any> = {},
    TBody extends IndexedObject<any> = {}
  > {
    successful: UploadedUppyFile<TMeta, TBody>[]
    failed: FailedUppyFile<TMeta, TBody>[]
  }

  interface State<
    TMeta extends IndexedObject<any> = {},
    TBody extends IndexedObject<any> = {}
  > extends IndexedObject<any> {
    capabilities?: { resumableUploads?: boolean }
    currentUploads: {}
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

  type LogLevel = 'info' | 'warning' | 'error'

  /** Enable the old, untyped `uppy.use()` signature. */
  type LooseTypes = 'loose'
  /** Disable the old, untyped `uppy.use()` signature. */
  type StrictTypes = 'strict'
  type TypeChecking = LooseTypes | StrictTypes

  // This hack accepts _any_ string for `Event`, but also tricks VSCode and friends into providing autocompletions
  // for the names listed. https://github.com/microsoft/TypeScript/issues/29729#issuecomment-505826972
  type LiteralUnion<T extends U, U = string> = T | (U & { });
  type Event = LiteralUnion<'file-added' | 'file-removed' | 'upload' | 'upload-progress' | 'upload-success' | 'complete' | 'error' | 'upload-error' |
               'upload-retry' | 'info-visible' | 'info-hidden' | 'cancel-all' | 'restriction-failed' | 'reset-progress'>;

  type UploadHandler = (fileIDs: string[]) => Promise<void>

  class Uppy<TUseStrictTypes extends TypeChecking = TypeChecking> {
    constructor(opts?: UppyOptions)
    on<TMeta extends IndexedObject<any> = {}>(
      event: 'upload-success',
      callback: (file: UppyFile<TMeta>, body: any, uploadURL: string) => void
    ): this
    on<TMeta extends IndexedObject<any> = {}>(
      event: 'complete',
      callback: (result: UploadResult<TMeta>) => void
    ): this
    on(event: Event, callback: (...args: any[]) => void): this
    off(event: Event, callback: (...args: any[]) => void): this
    /**
     * For use by plugins only.
     */
    emit(event: Event, ...args: any[]): void
    updateAll(state: object): void
    setOptions(update: Partial<UppyOptions>): void
    setState(patch: object): void
    getState<TMeta extends IndexedObject<any> = {}>(): State<TMeta>
    readonly state: State
    setFileState(fileID: string, state: object): void
    resetProgress(): void
    addPreProcessor(fn: UploadHandler): void
    removePreProcessor(fn: UploadHandler): void
    addPostProcessor(fn: UploadHandler): void
    removePostProcessor(fn: UploadHandler): void
    addUploader(fn: UploadHandler): void
    removeUploader(fn: UploadHandler): void
    setMeta<TMeta extends IndexedObject<any> = {}>(data: TMeta): void
    setFileMeta<TMeta extends IndexedObject<any> = {}>(
      fileID: string,
      data: TMeta
    ): void
    getFile<
      TMeta extends IndexedObject<any> = {},
      TBody extends IndexedObject<any> = {}
    >(fileID: string): UppyFile<TMeta, TBody>
    getFiles<
      TMeta extends IndexedObject<any> = {},
      TBody extends IndexedObject<any> = {}
    >(): Array<UppyFile<TMeta, TBody>>
    addFile<TMeta extends IndexedObject<any> = {}>(
      file: AddFileOptions<TMeta>
    ): string
    removeFile(fileID: string): void
    pauseResume(fileID: string): boolean
    pauseAll(): void
    resumeAll(): void
    retryAll<TMeta extends IndexedObject<any> = {}>(): Promise<UploadResult<TMeta>>
    cancelAll(): void
    retryUpload<TMeta extends IndexedObject<any> = {}>(fileID: string): Promise<UploadResult<TMeta>>
    reset(): void
    getID(): string
    /**
     * Add a plugin to this Uppy instance.
     */
    use<TOptions, TInstance extends Plugin<TOptions>>(
      pluginClass: new (uppy: this, opts: TOptions) => TInstance,
      opts?: TOptions
    ): this
    /**
     * Fallback `.use()` overload with unchecked plugin options.
     *
     * This does not validate that the options you pass in are correct.
     * We recommend disabling this overload by using the `Uppy<Uppy.StrictTypes>` type, instead of the plain `Uppy` type, to enforce strict typechecking.
     * This overload will be removed in Uppy 2.0.
     */
    use(pluginClass: TUseStrictTypes extends StrictTypes ? never : new (uppy: this, opts: any) => Plugin<any>, opts?: object): this
    getPlugin(name: string): Plugin
    iteratePlugins(callback: (plugin: Plugin) => void): void
    removePlugin(instance: Plugin): void
    close(): void
    info(
      message: string | { message: string; details: string },
      type?: LogLevel,
      duration?: number
    ): void
    hideInfo(): void
    log(msg: string, type?: LogLevel): void
    /**
     * Obsolete: do not use. This method does nothing and will be removed in a future release.
     */
    run(): this
    restore<TMeta extends IndexedObject<any> = {}>(
      uploadID: string
    ): Promise<UploadResult<TMeta>>
    addResultData(uploadID: string, data: object): void
    upload<TMeta extends IndexedObject<any> = {}>(): Promise<UploadResult<TMeta>>
  }
}

/**
 * Create an uppy instance.
 *
 * By default, Uppy's `.use(Plugin, options)` method uses loose type checking.
 * In Uppy 2.0, the `.use()` method will get a stricter type signature. You can enable strict type checking of plugin classes and their options today by using:
 * ```ts
 * const uppy = Uppy<Uppy.StrictTypes>()
 * ```
 * Make sure to also declare any variables and class properties with the `StrictTypes` parameter:
 * ```ts
 * private uppy: Uppy<Uppy.StrictTypes>;
 * ```
 */
declare function Uppy<TUseStrictTypes extends Uppy.TypeChecking = Uppy.TypeChecking>(opts?: Uppy.UppyOptions): Uppy.Uppy<TUseStrictTypes>

export = Uppy
