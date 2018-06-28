import { Plugin, PluginOptions, Uppy, UppyFile } from '@uppy/core';

export interface AwsS3Part {
  PartNumber: number;
  Size: number;
  ETag: string;
}

export interface AwsS3MultipartOptions extends PluginOptions {
  serverUrl: string;
  createMultipartUpload(file: UppyFile): Promise<{uploadId: string, key: string}>;
  listParts(file: UppyFile, opts: {uploadId: string, key: string}): Promise<AwsS3Part>;
  prepareUploadPart(file: UppyFile, partData: {uploadId: string, key: string, body: Blob, number: number}): Promise<{url: string}>;
  abortMultipartUpload(file: UppyFile, opts: {uploadId: string, key: string}): Promise<void>;
  completeMultipartUpload(file: UppyFile, opts: {uploadId: string, key: string, parts: AwsS3Part[]}): Promise<{location?: string}>;
  timeout: number;
  limit: number;
}

export default class AwsS3Multipart extends Plugin {
  constructor(uppy: Uppy, opts: Partial<AwsS3MultipartOptions>);
}

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof AwsS3Multipart, opts: Partial<AwsS3MultipartOptions>): Uppy;
  }
}
