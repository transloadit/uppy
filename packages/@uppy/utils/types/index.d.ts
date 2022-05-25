declare module '@uppy/utils/lib/Translator' {
  namespace Translator {
    export interface Locale {
      strings?: {
        [key: string]: string | { [plural: number]: string }
      }
      pluralize?: (n: number) => number
    }
  }

  class Translator {
    constructor (opts: Translator.Locale | Translator.Locale[])

    translate (key: string, options: Record<string, unknown>): string

    translateArray (key: string, options: Record<string, unknown>): any[]
  }

  export = Translator
}

declare module '@uppy/utils/lib/EventTracker' {
  namespace EventTracker {
    export type EventHandler = (...args: any[]) => void
    export interface Emitter {
      on: (event: string, handler: EventHandler) => void
      off: (event: string, handler: EventHandler) => void
    }
  }

  class EventTracker {
    constructor (emitter: EventTracker.Emitter)

    on (event: string, handler: EventTracker.EventHandler): void

    remove (): void
  }

  export = EventTracker
}

declare module '@uppy/utils/lib/ProgressTimeout' {
  class ProgressTimeout {
    constructor (timeout: number, timeoutHandler: () => void)

    progress (): void

    done (): void
  }
  export = ProgressTimeout
}

declare module '@uppy/utils/lib/RateLimitedQueue' {
  namespace RateLimitedQueue {
    export type AbortFunction = () => void
    export interface AbortablePromise<T> extends Promise<T> {
      abort(): void
    }
    export type QueueEntry = {
      abort: () => void,
      done: () => void,
    }
    export type QueueOptions = {
      priority?: number
    }
  }

  export class RateLimitedQueue {
    constructor(limit: number)

    run(
      fn: () => RateLimitedQueue.AbortFunction,
      queueOptions?: RateLimitedQueue.QueueOptions
    ): RateLimitedQueue.QueueEntry

    wrapPromiseFunction(
      fn: () => (...args: any[]) => Promise<any>,
      queueOptions?: RateLimitedQueue.QueueOptions
    ): (...args: any[]) => RateLimitedQueue.AbortablePromise<any>
  }

  export const internalRateLimitedQueue: symbol
}

declare module '@uppy/utils/lib/canvasToBlob' {
  function canvasToBlob (
    canvas: HTMLCanvasElement,
    type: string,
    quality?: number
  ): Promise<Blob>
  export = canvasToBlob
}

declare module '@uppy/utils/lib/dataURItoBlob' {
  function dataURItoBlob (
    dataURI: string,
    opts: { mimeType?: string; name?: string }
  ): Blob
  export = dataURItoBlob
}

declare module '@uppy/utils/lib/dataURItoFile' {
  function dataURItoFile (
    dataURI: string,
    opts: { mimeType?: string; name?: string }
  ): File
  export = dataURItoFile
}

declare module '@uppy/utils/lib/emitSocketProgress' {
  import UppyUtils = require('@uppy/utils')

  interface ProgressData {
    progress: number
    bytesUploaded: number
    bytesTotal: number
  }

  function emitSocketProgress (
    uploader: unknown,
    progressData: ProgressData,
    file: UppyUtils.UppyFile
  ): void
  export = emitSocketProgress
}

declare module '@uppy/utils/lib/findAllDOMElements' {
  function findAllDOMElements (element: string | HTMLElement): HTMLElement[]
  export = findAllDOMElements
}

declare module '@uppy/utils/lib/findDOMElement' {
  function findDOMElement (element: string | HTMLElement): HTMLElement | null
  export = findDOMElement
}

declare module '@uppy/utils/lib/generateFileID' {
  import UppyUtils = require('@uppy/utils')

  function generateFileID (file: UppyUtils.UppyFile): string
  export = generateFileID
}

declare module '@uppy/utils/lib/getBytesRemaining' {
  function getBytesRemaining (progress: {
    bytesTotal: number
    bytesUploaded: number
  }): number
  export = getBytesRemaining
}

declare module '@uppy/utils/lib/getETA' {
  function getETA (progress: unknown): number
  export = getETA
}

declare module '@uppy/utils/lib/getFileNameAndExtension' {
  function getFileNameAndExtension(
    filename: string
  ): { name: string, extension: string | undefined }
  export = getFileNameAndExtension
}

declare module '@uppy/utils/lib/getFileType' {
  import UppyUtils = require('@uppy/utils')

  function getFileType (file: UppyUtils.UppyFile): string
  export = getFileType
}

declare module '@uppy/utils/lib/getFileTypeExtension' {
  function getFileTypeExtension (mime: string): string
  export = getFileTypeExtension
}

declare module '@uppy/utils/lib/getSocketHost' {
  function getSocketHost (url: string): string
  export = getSocketHost
}

declare module '@uppy/utils/lib/getSpeed' {
  function getSpeed (progress: {
    bytesTotal: number
    bytesUploaded: number
  }): number
  export = getSpeed
}

declare module '@uppy/utils/lib/getTimeStamp' {
  function getTimeStamp (): string
  export = getTimeStamp
}

declare module '@uppy/utils/lib/isDOMElement' {
  function isDOMElement (element: any): boolean
  export = isDOMElement
}

declare module '@uppy/utils/lib/isObjectURL' {
  function isObjectURL (url: string): boolean
  export = isObjectURL
}

declare module '@uppy/utils/lib/isDragDropSupported' {
  function isDragDropSupported (): boolean
  export = isDragDropSupported
}

declare module '@uppy/utils/lib/isPreviewSupported' {
  function isPreviewSupported (mime: string): boolean
  export = isPreviewSupported
}

declare module '@uppy/utils/lib/isTouchDevice' {
  function isTouchDevice (): boolean
  export = isTouchDevice
}

declare module '@uppy/utils/lib/prettyETA' {
  function prettyETA (seconds: number): string
  export = prettyETA
}

declare module '@uppy/utils/lib/secondsToTime' {
  function secondsToTime (seconds: number): string
  export = secondsToTime
}

declare module '@uppy/utils/lib/settle' {
  function settle<T> (
    promises: Promise<T>[]
  ): Promise<{ successful: T[]; failed: any[] }>
  export = settle
}

declare module '@uppy/utils/lib/toArray' {
  function toArray (list: any): any[]
  export = toArray
}

declare module '@uppy/utils/lib/getDroppedFiles' {
  function getDroppedFiles (
    dataTransfer: DataTransfer,
    options?: Record<string, unknown>
  ): Promise<File[]>
  export = getDroppedFiles
}

declare module '@uppy/utils' {
  interface IndexedObject<T> {
    [key: string]: T
    [key: number]: T
  }
  export type InternalMetadata = { name: string; type?: string }
  export interface FileProgress  {
    uploadStarted: number | null
    uploadComplete: boolean
    percentage: number
    bytesUploaded: number
    bytesTotal: number
  }
  export interface UppyFile<
    TMeta = IndexedObject<any>,
    TBody = IndexedObject<any>
  > {
    data: Blob | File
    extension: string
    id: string
    isPaused?: boolean
    isRemote: boolean
    meta: InternalMetadata & TMeta
    name: string
    preview?: string
    progress?: FileProgress
    remote?: {
      host: string
      url: string
      body?: Record<string, unknown>
    }
    size: number
    source?: string
    type?: string
    response?: {
      body: TBody
      status: number
      uploadURL: string | undefined
    }
  }
  export interface Store {
    getState (): Record<string, unknown>
    setState (patch: Record<string, unknown>): void
    subscribe (listener: any): () => void
  }
}
