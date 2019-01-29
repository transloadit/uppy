import Uppy = require('@uppy/core');

declare module AwsS3Multipart {
  interface AwsS3Part {
    PartNumber?: number;
    Size?: number;
    ETag?: string;
  }

  interface AwsS3MultipartOptions extends Uppy.PluginOptions {
    serverUrl: string;
    createMultipartUpload(file: Uppy.UppyFile): Promise<{ uploadId: string, key: string }>;
    listParts(file: Uppy.UppyFile, opts: { uploadId: string, key: string }): Promise<AwsS3Part[]>;
    prepareUploadPart(file: Uppy.UppyFile, partData: { uploadId: string, key: string, body: Blob, number: number }): Promise<{ url: string }>;
    abortMultipartUpload(file: Uppy.UppyFile, opts: { uploadId: string, key: string }): Promise<void>;
    completeMultipartUpload(file: Uppy.UppyFile, opts: { uploadId: string, key: string, parts: AwsS3Part[] }): Promise<{ location?: string }>;
    timeout: number;
    limit: number;
  }
}

declare class AwsS3Multipart extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<AwsS3Multipart.AwsS3MultipartOptions>);
}

export = AwsS3Multipart;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof AwsS3Multipart, opts: Partial<AwsS3Multipart.AwsS3MultipartOptions>): Uppy.Uppy;
  }
}
