declare module '@uppy/core' {
  // TODO actually use the properties here
  export interface UppyFile {
    data: Blob | File;
    extension: string;
    id: string;
    isPaused: boolean;
    isRemote: boolean;
    meta: {
      name: string;
      type?: string;
    };
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
    uploadURL?: string;
  }

  export interface PluginOptions {
    id?: string;
  }

  export class Plugin {
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

  export interface Store {
    getState(): object;
    setState(patch: object): void;
    subscribe(listener: any): () => void;
  }

  export interface UppyOptions {
    id: string;
    autoProceed: boolean;
    debug: boolean;
    restrictions: {
      maxFileSize: false,
      maxNumberOfFiles: false,
      minNumberOfFiles: false,
      allowedFileTypes: false
    };
    target: string | Plugin;
    meta: any;
    // onBeforeFileAdded: (currentFile, files) => currentFile,
    // onBeforeUpload: (files) => files,
    locale: any;
    store: Store;
  }

  export interface UploadResult {
    successful: Array<UppyFile>;
    failed: Array<UppyFile>;
  }

  type LogLevel = 'info' | 'warning' | 'error';
  export class Uppy {
    constructor(opts?: Partial<UppyOptions>);
    on(event: 'upload-success', callback: (file: UppyFile, body: any, uploadURL: string) => any): Uppy;
    on(event: 'complete', callback: (result: UploadResult) => void): Uppy;
    on(event: string, callback: (...args: any[]) => any): Uppy;
    off(event: string, callback: any): Uppy;
    updateAll(state: object): void;
    setState(patch: object): void;
    getState(): object;
    readonly state: object;
    setFileState(fileID: string, state: object): void;
    resetProgress(): void;
    addPreProcessor(fn: any): void;
    removePreProcessor(fn: any): void;
    addPostProcessor(fn: any): void;
    removePostProcessor(fn: any): void;
    addUploader(fn: any): void;
    removeUploader(fn: any): void;
    setMeta(data: any): void;
    setFileMeta(fileID: string, data: any): void;
    getFile(fileID: string): UppyFile;
    getFiles(): UppyFile[];
    addFile(file: object): void;
    removeFile(fileID: string): void;
    pauseResume(fileID: string): boolean;
    pauseAll(): void;
    resumeAll(): void;
    retryAll(): void;
    cancelAll(): void;
    retryUpload(fileID: string): any;
    reset(): void;
    getID(): string;
    use(plugin: typeof Plugin, opts: any): Uppy;
    getPlugin(name: string): Plugin;
    iteratePlugins(method: any): void;
    removePlugin(instance: Plugin): void;
    close(): void;
    info(message: string | { message: string; details: string; }, type?: LogLevel, duration?: number): void;
    hideInfo(): void;
    log(msg: string, type?: LogLevel): void;
    run(): Uppy;
    restore(uploadID: string): Promise<any>;
    addResultData(uploadID: string, data: any): void;
    upload(): Promise<any>;
  }

  export default function createUppy(opts?: Partial<UppyOptions>): Uppy;
}
