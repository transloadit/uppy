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
  interface ProgressData {
    progress: number;
    bytesUploaded: number;
    bytesTotal: number;
  }

  export default function emitSocketProgress(uploader: object, progressData: ProgressData, file: object);
}

declare module '@uppy/utils/lib/findAllDOMElements' {
  export default function findAllDOMElements(element: string | HTMLElement): HTMLElement[];
}

declare module '@uppy/utils/lib/findDOMElement' {
  export default function findDOMElement(element: string | HTMLElement): HTMLElement?;
}

declare module '@uppy/utils/lib/generateFileID' {
  export default function generateFileID(file: object): string;
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
  export default function getFileType(file: object): string?;
}

declare module '@uppy/utils/lib/getFileTypeExtension' {
  export default function getFileTypeExtension(mime: string): string;
}

declare module '@uppy/utils/lib/getSocketHost' {
  export default function getSocketHost(url: string): string;
}

declare module '@uppy/utils/lib/getSpeed' {
  export default function getSpeed(progress: { bytesTotal: number, bytesUploaded: number }): number;
}

declare module '@uppy/utils/lib/getTimeStamp' {
  export default function getTimeStamp(): string;
}

declare module '@uppy/utils/lib/isDOMElement' {
  export default function isDOMElement(element: any): boolean;
}

declare module '@uppy/utils/lib/isObjectURL' {
  export default function isObjectURL(url: string): boolean;
}

declare module '@uppy/utils/lib/isPreviewSupported' {
  export default function isPreviewSupported(mime: string): boolean;
}

declare module '@uppy/utils/lib/isTouchDevice' {
  export default function isTouchDevice(): boolean;
}

declare module '@uppy/utils/lib/limitPromises' {
  // TODO guess this could be generic but it's probably fine this way
  // because it's mostly for internal use
  type LimitedFunction = (...args: any[]) => Promise<any>;
  type LimitedFunctionFactory = (fn: function) => LimitedFunction;

  export default function limitPromises(limit: number): LimitedFunctionFactory;
}

declare module '@uppy/utils/lib/prettyETA' {
  export default function prettyETA(seconds: number): string;
}

declare module '@uppy/utils/lib/runPromiseSequence' {
  type Promiser = (...args: any[]) => Promise<void>;
  export default function runPromiseSequence(functions: Promiser[], ...args: any[]): Promise<void>;
}

declare module '@uppy/utils/lib/secondsToTime' {
  export default function secondsToTime(seconds: number): string;
}

declare module '@uppy/utils/lib/settle' {
  export default function settle(promises: Promise[]): Promise<{ successful: any[], failed: any[] }>;
}

declare module '@uppy/utils/lib/toArray' {
  export default function toArray(list: any): Array;
}

declare module '@uppy/utils/lib/truncateString' {
  export default function truncateString(input: string): string;
}
