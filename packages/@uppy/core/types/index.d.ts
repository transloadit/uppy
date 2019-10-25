import UppyUtils = require('@uppy/utils');

declare module Uppy {
  // Utility types
  type OmitKey<T, Key> = Pick<T, Exclude<keyof T, Key>>;

  // These are defined in @uppy/utils instead of core so it can be used there without creating import cycles
  export type UppyFile<TMeta extends IndexedObject<any> = {}, TBody extends IndexedObject<any> = {}> = UppyUtils.UppyFile<TMeta, TBody>;
  export type Store = UppyUtils.Store;
  export type InternalMetadata = UppyUtils.InternalMetadata;

  interface IndexedObject<T> {
    [key: string]: T;
    [key: number]: T;
  }

  interface UploadedUppyFile<TMeta, TBody> extends UppyFile<TMeta, TBody> {
    uploadURL: string;
  }

  interface FailedUppyFile<TMeta, TBody> extends UppyFile<TMeta, TBody> {
    error: string;
  }

  // Replace the `meta` property type with one that allows omitting internal metadata; addFile() will add that
  type UppyFileWithoutMeta<TMeta, TBody> = OmitKey<UppyFile<TMeta, TBody>, 'meta'>;
  interface AddFileOptions<TMeta = IndexedObject<any>, TBody = IndexedObject<any>> extends Partial<UppyFileWithoutMeta<TMeta, TBody>> {
    // `.data` is the only required property here.
    data: Blob | File;
    meta?: Partial<InternalMetadata> & TMeta;
  }

  interface PluginOptions {
    id?: string;
  }

  class Plugin {
    id: string;
    uppy: Uppy;
    type: string;
    constructor(uppy: Uppy, opts?: PluginOptions);
    getPluginState(): object;
    setPluginState(update: any): object;
    update(state?: object): void;
    mount(target: any, plugin: any): void;
    render(state: object): void;
    addTarget(plugin: any): void;
    unmount(): void;
    install(): void;
    uninstall(): void;
  }

  interface LocaleStrings {
    [key: string]: string | LocaleStrings;
  }
  interface Locale {
    strings: LocaleStrings;
    pluralize?: (n: number) => number;
  }

  interface Restrictions {
    maxFileSize: number | null;
    maxNumberOfFiles: number | null;
    minNumberOfFiles: number | null;
    allowedFileTypes: string[] | null;
  }

  interface UppyOptions {
    id: string;
    autoProceed: boolean;
    allowMultipleUploads: boolean;
    debug: boolean;
    restrictions: Partial<Restrictions>;
    target: string | Plugin;
    meta: any;
    onBeforeFileAdded: (currentFile: UppyFile, files: {[key: string]: UppyFile}) => UppyFile | boolean | undefined;
    onBeforeUpload: (files: {[key: string]: UppyFile}) => {[key: string]: UppyFile} | boolean;
    locale: Locale;
    store: Store;
  }

  interface UploadResult<TMeta extends IndexedObject<any> = {}, TBody extends IndexedObject<any> = {}> {
    successful: UploadedUppyFile<TMeta, TBody>[];
    failed: FailedUppyFile<TMeta, TBody>[];
  }

  interface State<TMeta extends IndexedObject<any> = {}, TBody extends IndexedObject<any> = {}> extends IndexedObject<any> {
    capabilities?: {resumableUploads?: boolean};
    currentUploads: {};
    error?: string;
    files: {[key: string]: UploadedUppyFile<TMeta, TBody> | FailedUppyFile<TMeta, TBody>};
    info?: {
      isHidden: boolean;
      type: string;
      message: string;
      details: string;
    };
    plugins?: IndexedObject<any>;
    totalProgress: number;
  }
  type LogLevel = 'info' | 'warning' | 'error';
  class Uppy {
    constructor(opts?: Partial<UppyOptions>);
    on<TMeta extends IndexedObject<any> = {}>(event: 'upload-success', callback: (file: UppyFile<TMeta>, body: any, uploadURL: string) => void): Uppy;
    on<TMeta extends IndexedObject<any> = {}>(event: 'complete', callback: (result: UploadResult<TMeta>) => void): Uppy;
    on(event: string, callback: (...args: any[]) => void): Uppy;
    off(event: string, callback: any): Uppy;
    /**
     * For use by plugins only!
     */
    emit(event: string, ...args: any[]): void;
    updateAll(state: object): void;
    setState(patch: object): void;
    getState<TMeta extends IndexedObject<any> = {}>(): State<TMeta>;
    readonly state: State;
    setFileState(fileID: string, state: object): void;
    resetProgress(): void;
    addPreProcessor(fn: any): void;
    removePreProcessor(fn: any): void;
    addPostProcessor(fn: any): void;
    removePostProcessor(fn: any): void;
    addUploader(fn: any): void;
    removeUploader(fn: any): void;
    setMeta<TMeta extends IndexedObject<any> = {}>(data: TMeta): void;
    setFileMeta<TMeta extends IndexedObject<any> = {}>(fileID: string, data: TMeta): void;
    getFile<TMeta extends IndexedObject<any> = {}, TBody extends IndexedObject<any> = {}>(fileID: string): UppyFile<TMeta, TBody>;
    getFiles<TMeta extends IndexedObject<any> = {}, TBody extends IndexedObject<any> = {}>(): Array<UppyFile<TMeta, TBody>>;
    addFile<TMeta extends IndexedObject<any> = {}>(file: AddFileOptions<TMeta>): void;
    removeFile(fileID: string): void;
    pauseResume(fileID: string): boolean;
    pauseAll(): void;
    resumeAll(): void;
    retryAll(): void;
    cancelAll(): void;
    retryUpload(fileID: string): any;
    reset(): void;
    getID(): string;
    use<T extends typeof Plugin>(pluginClass: T, opts: object): Uppy;
    getPlugin(name: string): Plugin;
    iteratePlugins(callback: (plugin: Plugin) => void): void;
    removePlugin(instance: Plugin): void;
    close(): void;
    info(message: string | {message: string; details: string}, type?: LogLevel, duration?: number): void;
    hideInfo(): void;
    log(msg: string, type?: LogLevel): void;
    run(): Uppy;
    restore<TMeta extends IndexedObject<any> = {}>(uploadID: string): Promise<UploadResult>;
    addResultData(uploadID: string, data: object): void;
    upload<TMeta extends IndexedObject<any> = {}>(): Promise<UploadResult>;
  }
}

declare function Uppy(opts?: Partial<Uppy.UppyOptions>): Uppy.Uppy;

export = Uppy;
