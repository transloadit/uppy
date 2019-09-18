declare module '@uppy/utils/lib/Translator' {
  export interface TranslatorOptions {
    locale: {
      strings: {
        [key: string]: string | { [plural: number]: string };
      };
      pluralize: (n: number) => number;
    };
  }

  export default class Translator {
    constructor(opts: TranslatorOptions);
  }
}

declare module '@uppy/utils/lib/EventTracker' {
  export type EventHandler = (...args: any[]) => void;
  export interface Emitter {
    on: (event: string, handler: EventHandler) => void;
    off: (event: string, handler: EventHandler) => void;
  }

  export default class EventTracker {
    constructor(emitter: Emitter);
    on(event: string, handler: EventHandler): void;
    remove(): void;
  }
}

declare module '@uppy/utils/lib/ProgressTimeout' {
  export default class ProgressTimeout {
    constructor(timeout: number, timeoutHandler: () => void);
    progress(): void;
    done(): void;
  }
}

declare module '@uppy/utils/lib/RateLimitedQueue' {
  namespace RateLimitedQueue {
    export type AbortFunction = () => void;
    export type PromiseFunction = (...args: any[]) => Promise<any>;
    export type QueueEntry = {
      abort: () => void,
      done: () => void,
    };
  }

  class RateLimitedQueue {
    constructor(limit: number);
    run(fn: () => RateLimitedQueue.AbortFunction): RateLimitedQueue.QueueEntry;
    wrapPromiseFunction(fn: () => RateLimitedQueue.PromiseFunction): RateLimitedQueue.PromiseFunction;
  }

  export = RateLimitedQueue
}

declare module '@uppy/utils/lib/canvasToBlob' {
  export default function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob>;
}

declare module '@uppy/utils/lib/dataURItoBlob' {
  export default function dataURItoBlob(dataURI: string, opts: { mimeType?: string, name?: string }): Blob;
}

declare module '@uppy/utils/lib/dataURItoFile' {
  export default function dataURItoFile(dataURI: string, opts: { mimeType?: string, name?: string }): File;
}

declare module '@uppy/utils/lib/emitSocketProgress' {
  import UppyUtils = require('@uppy/utils');

  interface ProgressData {
    progress: number;
    bytesUploaded: number;
    bytesTotal: number;
  }

  export default function emitSocketProgress(uploader: object, progressData: ProgressData, file: UppyUtils.UppyFile): void;
}

declare module '@uppy/utils/lib/findAllDOMElements' {
  export default function findAllDOMElements(element: string | HTMLElement): HTMLElement[];
}

declare module '@uppy/utils/lib/findDOMElement' {
  export default function findDOMElement(element: string | HTMLElement): HTMLElement | null;
}

declare module '@uppy/utils/lib/generateFileID' {
  import UppyUtils = require('@uppy/utils');

  export default function generateFileID(file: UppyUtils.UppyFile): string;
}

declare module '@uppy/utils/lib/getBytesRemaining' {
  export default function getBytesRemaining(progress: { bytesTotal: number, bytesUploaded: number }): number;
}

declare module '@uppy/utils/lib/getETA' {
  export default function getETA(progress: object): number;
}

declare module '@uppy/utils/lib/getFileNameAndExtension' {
  export default function getFileNameAndExtension(filename: string): { name: string, extension: string };
}

declare module '@uppy/utils/lib/getFileType' {
  import UppyUtils = require('@uppy/utils');

  function getFileType(file: UppyUtils.UppyFile): string | null;
  export = getFileType
}

declare module '@uppy/utils/lib/getFileTypeExtension' {
  function getFileTypeExtension(mime: string): string;
  export = getFileTypeExtension
}

declare module '@uppy/utils/lib/getSocketHost' {
  function getSocketHost(url: string): string;
  export = getSocketHost
}

declare module '@uppy/utils/lib/getSpeed' {
  function getSpeed(progress: { bytesTotal: number, bytesUploaded: number }): number;
  export = getSpeed
}

declare module '@uppy/utils/lib/getTimeStamp' {
  function getTimeStamp(): string;
  export = getTimeStamp
}

declare module '@uppy/utils/lib/isDOMElement' {
  function isDOMElement(element: any): boolean;
  export = isDOMElement
}

declare module '@uppy/utils/lib/isObjectURL' {
  function isObjectURL(url: string): boolean;
  export = isObjectURL
}

declare module '@uppy/utils/lib/isDragDropSupported' {
  function isDragDropSupported(): boolean;
  export = isDragDropSupported
}

declare module '@uppy/utils/lib/isPreviewSupported' {
  function isPreviewSupported(mime: string): boolean;
  export = isPreviewSupported
}

declare module '@uppy/utils/lib/isTouchDevice' {
  function isTouchDevice(): boolean;
  export = isTouchDevice
}

declare module '@uppy/utils/lib/prettyETA' {
  function prettyETA(seconds: number): string;
  export = prettyETA
}

declare module '@uppy/utils/lib/secondsToTime' {
  function secondsToTime(seconds: number): string;
  export = secondsToTime
}

declare module '@uppy/utils/lib/settle' {
  function settle<T>(promises: Promise<T>[]): Promise<{ successful: T[], failed: any[] }>;
  export = settle
}

declare module '@uppy/utils/lib/toArray' {
  function toArray(list: any): any[];
  export = toArray
}

declare module '@uppy/utils/lib/getDroppedFiles' {
  function getDroppedFiles(dataTransfer: DataTransfer, options?: object): Promise<File[]>;
  export = getDroppedFiles
}

declare module '@uppy/utils' {
  interface IndexedObject<T> {
    [key: string]: T;
    [key: number]: T;
  }
  export type InternalMetadata = { name: string, type?: string };
  export interface UppyFile<TMeta = IndexedObject<any>> {
    data: Blob | File;
    extension: string;
    id: string;
    isPaused?: boolean;
    isRemote: boolean;
    meta: InternalMetadata & TMeta;
    name: string;
    preview?: string;
    progress?: {
      uploadStarted: number | null;
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
  export interface Store {
    getState(): object;
    setState(patch: object): void;
    subscribe(listener: any): () => void;
  }
}
