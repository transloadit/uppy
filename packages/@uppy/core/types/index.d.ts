declare module Uppy {
  interface IndexedObject<T> {
    [key: string]: T;
    [key: number]: T;
  }
  interface UppyFile<TMeta extends IndexedObject<any> = {}> {
    data: Blob | File;
    extension: string;
    id: string;
    isPaused?: boolean;
    isRemote: boolean;
    meta: {
      name: string;
      type?: string;
    } & TMeta;
    name: string;
    preview?: string;
    progress?: {
      uploadStarted: number;
      uploadComplete: boolean;
      percentage: number;
      bytesUploaded: number;
      bytesTotal: number;
    };
    remote?: {
      host: string;
      url: string;
      body?: object;
    };
    size: number;
    source?: string;
    type?: string;
  }

  interface UploadedUppyFile<TMeta extends IndexedObject<any> = {}> extends UppyFile<TMeta> {
    uploadURL: string;
  }

  interface FailedUppyFile<TMeta extends IndexedObject<any> = {}> extends UppyFile<TMeta> {
    error: string;
  }

  interface AddFileOptions extends Partial<UppyFile> {
    // `.data` is the only required property here.
    data: Blob | File;
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

  interface Store {
    getState(): object;
    setState(patch: object): void;
    subscribe(listener: any): () => void;
  }

  interface LocaleStrings {
    [key: string]: string | LocaleStrings;
  }
  interface Locale {
    strings: LocaleStrings;
    pluralize?: (n: number) => number;
  }

  interface UppyOptions {
    id: string;
    autoProceed: boolean;
    allowMultipleUploads: boolean;
    debug: boolean;
    restrictions: {
      maxFileSize: number | null;
      maxNumberOfFiles: number | null;
      minNumberOfFiles: number | null;
      allowedFileTypes: string[] | null;
    };
    target: string | Plugin;
    meta: any;
    onBeforeFileAdded: (currentFile: UppyFile, files: {[key: string]: UppyFile}) => UppyFile | boolean | undefined;
    onBeforeUpload: (files: {[key: string]: UppyFile}) => {[key: string]: UppyFile} | boolean;
    locale: Locale;
    store: Store;
  }

  interface UploadResult<TMeta extends IndexedObject<any> = {}> {
    successful: UploadedUppyFile<TMeta>[];
    failed: FailedUppyFile<TMeta>[];
  }

  interface State<TMeta extends IndexedObject<any> = {}> extends IndexedObject<any> {
    capabilities?: {resumableUploads?: boolean};
    currentUploads: {};
    error?: string;
    files: {[key: string]: UploadedUppyFile<TMeta> | FailedUppyFile<TMeta>};
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
    on(event: 'upload-success', callback: (file: UppyFile, body: any, uploadURL: string) => void): Uppy;
    on(event: 'complete', callback: (result: UploadResult) => void): Uppy;
    on(event: string, callback: (...args: any[]) => void): Uppy;
    off(event: string, callback: any): Uppy;
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
    setMeta(data: any): void;
    setFileMeta(fileID: string, data: object): void;
    getFile<TMeta extends IndexedObject<any> = {}>(fileID: string): UppyFile<TMeta>;
    getFiles<TMeta extends IndexedObject<any> = {}>(): Array<UppyFile<TMeta>>;
    addFile(file: AddFileOptions): void;
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
    restore(uploadID: string): Promise<UploadResult>;
    addResultData(uploadID: string, data: object): void;
    upload(): Promise<UploadResult>;
  }
}

declare function Uppy(opts?: Partial<Uppy.UppyOptions>): Uppy.Uppy;

export = Uppy;
